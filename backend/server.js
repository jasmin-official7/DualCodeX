require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Built-in in-memory multipart/form-data parser (Zero external dependencies needed)
function parseMultipart(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    return res.status(400).json({ error: 'Invalid multipart boundary.' });
  }

  const boundaryStr = boundaryMatch[1] || boundaryMatch[2];
  const boundary = Buffer.from('--' + boundaryStr);

  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      req.body = req.body || {};
      req.files = req.files || [];

      let positions = [];
      let index = 0;
      while ((index = buffer.indexOf(boundary, index)) !== -1) {
        positions.push(index);
        index += boundary.length;
      }

      for (let i = 0; i < positions.length - 1; i++) {
        const start = positions[i] + boundary.length;
        const end = positions[i + 1];
        let part = buffer.subarray(start, end);

        if (part[0] === 13 && part[1] === 10) {
          part = part.subarray(2);
        }
        if (part[part.length - 2] === 13 && part[part.length - 1] === 10) {
          part = part.subarray(0, part.length - 2);
        }

        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headerLines = part.subarray(0, headerEnd).toString('utf8').split('\r\n');
        const bodyBuffer = part.subarray(headerEnd + 4);

        let name = null;
        let filename = null;
        let mimetype = 'image/jpeg';

        for (const line of headerLines) {
          const cdMatch = line.match(/Content-Disposition:\s*form-data;\s*(.*)/i);
          if (cdMatch) {
            const params = cdMatch[1];
            const nameMatch = params.match(/name="([^"]+)"/);
            if (nameMatch) name = nameMatch[1];

            const fnMatch = params.match(/filename="([^"]+)"/);
            if (fnMatch) filename = fnMatch[1];
          }

          const ctMatch = line.match(/Content-Type:\s*([^\s;]+)/i);
          if (ctMatch) {
            mimetype = ctMatch[1];
          }
        }

        if (!name) continue;

        if (filename !== null) {
          req.files.push({
            fieldname: name,
            originalname: filename,
            mimetype: mimetype,
            buffer: bodyBuffer
          });
        } else {
          req.body[name] = bodyBuffer.toString('utf8');
        }
      }

      next();
    } catch (err) {
      console.error('Multipart parse error:', err);
      return res.status(400).json({ error: 'Failed to parse multipart form data.' });
    }
  });
}

// Multer setup with memory storage
let multer;
try {
  multer = require('multer');
} catch (e) {
  // Polyfill / fallback multer with memoryStorage if multer module is missing
  multer = function({ storage } = {}) {
    return {
      single: (fieldName) => (req, res, next) => {
        parseMultipart(req, res, () => {
          const file = req.files ? (req.files.find(f => f.fieldname === fieldName) || req.files[0]) : null;
          if (file) {
            req.file = file;
          }
          next();
        });
      }
    };
  };
  multer.memoryStorage = () => ({});
}

const upload = multer({ storage: multer.memoryStorage() });

// GET / - Health Check
app.get('/', (req, res) => {
  res.send('Server running');
});

// POST /api/caption - Generate AI caption or meme for uploaded image
app.post('/api/caption', upload.single('image'), async (req, res) => {
  const mode = req.body.mode ? String(req.body.mode).trim().toLowerCase() : '';
  const userPrompt = req.body.prompt ? String(req.body.prompt).trim() : '';

  // Handle file attached via multer or fallback multipart parser
  const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

  // Validation: file and mode are required
  if (!file) {
    return res.status(400).json({ error: 'Image file is required.' });
  }

  if (!mode || !['caption', 'meme'].includes(mode)) {
    return res.status(400).json({ error: "Mode is required and must be either 'caption' or 'meme'." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is missing or invalid in .env configuration.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    let systemPrompt = '';
    if (mode === 'caption') {
      systemPrompt = 'Generate a short, engaging social-media caption (1-2 sentences) for this image.';
    } else if (mode === 'meme') {
      systemPrompt = 'Generate a funny, punchy meme-style caption or joke for this image.';
    }

    if (userPrompt) {
      systemPrompt += ` Context from user: "${userPrompt.substring(0, 150)}"`;
    }

    systemPrompt += ' CRITICAL INSTRUCTION: Return ONLY ONE final caption or meme. Do NOT include any explanations, introductions, meta-text, multiple options, bullet points, quotes, or markdown formatting — output ONLY the raw, final ready-to-post text.';

    const imagePart = {
      inlineData: {
        mimeType: file.mimetype || 'image/jpeg',
        data: file.buffer.toString('base64')
      }
    };

    const result = await model.generateContent([systemPrompt, imagePart]);
    const response = await result.response;
    let text = response.text() ? response.text().trim() : '';

    // Strip any residual quotes or markdown block wrappers
    text = text.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').replace(/^["']|["']$/g, '').trim();

    if (!text) {
      return res.status(500).json({ error: 'Gemini API returned an empty caption.' });
    }

    return res.json({ text });
  } catch (error) {
    console.error('Error in /api/caption:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate caption/meme.'
    });
  }
});

// POST /api/describe - Generate AI description for artwork
app.post('/api/describe', async (req, res) => {
  const { title, category } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required.' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_key_here') {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is missing or invalid in .env configuration.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Write a short 2-sentence gallery-style description of the artwork based on the title "${title}" and category "${category}".`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const description = response.text() ? response.text().trim() : '';

    if (!description) {
      return res.status(500).json({ error: 'Gemini API returned an empty description.' });
    }

    return res.json({ description });
  } catch (error) {
    console.error('Error in /api/describe:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate artwork description.'
    });
  }
});

// POST /api/generate-art - Generate Art with Gemini image model gemini-3.1-flash-lite-image
app.post('/api/generate-art', parseMultipart, async (req, res) => {
  const promptRaw = req.body.prompt ? String(req.body.prompt).trim() : '';
  const prompt = promptRaw.substring(0, 500);
  const styleStrictness = req.body.styleStrictness !== undefined ? Number(req.body.styleStrictness) : 65;
  const aspectRatio = req.body.aspectRatio || '16:9';
  const files = req.files || [];

  if (!prompt || files.length === 0) {
    return res.status(400).json({
      error: 'Prompt and at least one reference image are required.'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is missing or invalid in .env configuration.'
    });
  }

  try {
    let strictnessInstruction = '';
    if (styleStrictness >= 70) {
      strictnessInstruction = 'Closely follow the visual style, colors, composition, and texture of the reference images.';
    } else if (styleStrictness <= 30) {
      strictnessInstruction = 'Use the reference images only as loose artistic inspiration.';
    } else {
      strictnessInstruction = 'Balance creative interpretation with the style of the reference images.';
    }

    const fullPrompt = `${prompt} (${strictnessInstruction} Target Aspect Ratio: ${aspectRatio})`;

    const imageParts = files.map(file => ({
      inlineData: {
        mimeType: file.mimetype || 'image/jpeg',
        data: file.buffer.toString('base64')
      }
    }));

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-image' });

    const result = await model.generateContent([fullPrompt, ...imageParts]);
    const response = await result.response;

    let imageData = null;
    const candidates = response?.candidates || [];
    if (candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data;
          break;
        }
      }
    }

    if (!imageData) {
      const textResponse = response.text ? response.text() : '';
      const b64Match = textResponse.match(/data:image\/[a-zA-Z]+;base64,([A-Za-z0-9+/=]+)/);
      if (b64Match) {
        imageData = b64Match[1];
      } else if (textResponse && textResponse.length > 100 && !textResponse.includes(' ')) {
        imageData = textResponse.trim();
      }
    }

    if (!imageData) {
      return res.status(500).json({
        error: 'Gemini API did not return an image payload.'
      });
    }

    return res.json({ imageData });
  } catch (error) {
    console.error('Error in /api/generate-art:', error);
    const errMsg = error.message || String(error);
    
    const isBillingOrQuota =
      errMsg.includes('billing') ||
      errMsg.includes('quota') ||
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('PERMISSION_DENIED') ||
      errMsg.includes('402') ||
      errMsg.includes('403') ||
      errMsg.includes('Pay-as-you-go') ||
      errMsg.includes('API key') ||
      errMsg.includes('not found') ||
      errMsg.includes('unsupported');

    if (isBillingOrQuota) {
      return res.status(403).json({
        error: 'This model requires billing to be enabled or valid API permissions. Details: ' + errMsg
      });
    }

    return res.status(500).json({
      error: 'Failed to generate artwork: ' + errMsg
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
