# 🎨 ArtisanFlow

**Your art. AI wit. Ready to post.**

ArtisanFlow is an AI-powered platform that turns any image into a ready-to-post social media caption or meme — instantly. Built for **VibeForge 1.0**, under the **"AI in Entertainment and Content Creation"** track.

---

## 🚀 What It Does

Upload any image, add a bit of optional context, and let AI generate:
- 📝 **Captions** — short, engaging, social-media-ready text
- 😂 **Memes** — funny, punchy, internet-humor-style captions

Every generated caption/meme is saved to your **Library**, where you can search, filter, copy, or delete past creations — all without needing an account or database.

---

## ✨ Features

- **Image Upload** — drag & drop or browse to upload any JPG/PNG
- **Two Generation Modes** — Caption or Meme, powered by Gemini AI
- **Optional Context Input** — guide the tone of the output (150 char limit)
- **One-Click Copy** — copy generated text straight to clipboard
- **Generation History (Library)** — view, search, and filter past captions/memes by type
- **Delete Entries** — remove unwanted history items anytime
- **Fully Responsive UI** — clean, modern interface built for a smooth demo experience

---

## 🛠️ Tech Stack

**Frontend**
- HTML, CSS, JavaScript
- LocalStorage for generation history (no database required)

**Backend**
- Node.js + Express
- Multer — handles image upload (multipart/form-data)
- Google Gemini API (`gemini-flash-latest`) — powers caption/meme generation

**Deployment**
- Frontend: Render
- Backend: Railway


---

## ⚙️ Getting Started (Local Setup)

### Prerequisites
- [Node.js](https://nodejs.org) (LTS recommended)
- A free [Gemini API key](https://aistudio.google.com) from Google AI Studio

### 1. Clone the repository
```bash
git clone https://github.com/jasmin-official7/DualCodeX.git
cd DualCodeX
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

Start the backend server:
```bash
npm start
```
Server runs on `http://localhost:5000`

### 3. Set up the frontend
Open `frontend/index.html` in your browser, or serve it using a local server (e.g. VS Code Live Server extension) at `http://127.0.0.1:5500`.

> Make sure the frontend's API calls point to your running backend URL (`http://localhost:5000` locally, or your deployed Render URL in production).

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Google Gemini API key (get one free at [aistudio.google.com](https://aistudio.google.com)) |

⚠️ Never commit your real `.env` file. Use `.env.example` as a template.

---

## 🧩 API Endpoints

### `POST /api/describe`
Generates a short AI description for an artwork.
```json
{ "title": "Sunset Study", "category": "traditional" }
```
**Response:**
```json
{ "description": "..." }
```

### `POST /api/caption`
Generates a caption or meme from an uploaded image.

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `image` | File | The uploaded image |
| `mode` | String | `"caption"` or `"meme"` |

**Response:**
```json
{ "text": "..." }
```

---

## 👥 Team — DualCodeX

Built for VibeForge 1.0 — Online Round
Track: **AI in Entertainment and Content Creation**

---

## 📄 License

This project was built for hackathon submission purposes as part of VibeForge 1.0.
