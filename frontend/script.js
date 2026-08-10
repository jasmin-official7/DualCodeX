document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const passwordForm = document.getElementById('password-form');
  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const updatePasswordBtn = document.getElementById('update-password-btn');
  const passwordFeedback = document.getElementById('password-feedback');
  
  const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');
  
  const logoutBtn = document.getElementById('logout-btn');
  const logoutModal = document.getElementById('logout-modal');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirmLogout = document.getElementById('modal-confirm-logout');
  
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');

  // Password Visibility Toggle
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetInput = document.getElementById(targetId);
      if (!targetInput) return;

      const isPassword = targetInput.type === 'password';
      targetInput.type = isPassword ? 'text' : 'password';

      // Update SVG Icon
      btn.innerHTML = isPassword ? `
        <!-- Eye Off Icon -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      ` : `
        <!-- Eye Icon -->
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    });
  });

  // Password Validation on Input
  newPasswordInput.addEventListener('input', () => {
    const val = newPasswordInput.value;
    if (val.length === 0) {
      passwordFeedback.textContent = '';
      passwordFeedback.className = 'field-feedback';
    } else if (val.length < 8) {
      passwordFeedback.textContent = 'Password must be at least 8 characters long.';
      passwordFeedback.className = 'field-feedback error';
    } else {
      passwordFeedback.textContent = 'Strong password candidate!';
      passwordFeedback.className = 'field-feedback success';
    }
  });

  // Handle Password Update Form Submit
  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = newPasswordInput.value.trim();

    if (!newPass) {
      passwordFeedback.textContent = 'Please enter a new password.';
      passwordFeedback.className = 'field-feedback error';
      newPasswordInput.focus();
      return;
    }

    if (newPass.length < 8) {
      passwordFeedback.textContent = 'Password must be at least 8 characters long.';
      passwordFeedback.className = 'field-feedback error';
      newPasswordInput.focus();
      return;
    }

    // Success State
    showToast('Password updated successfully!');
    currentPasswordInput.value = newPass;
    newPasswordInput.value = '';
    passwordFeedback.textContent = '';
    passwordFeedback.className = 'field-feedback';
  });

  // Modal Handlers
  function openModal() {
    logoutModal.classList.add('active');
    logoutModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    logoutModal.classList.remove('active');
    logoutModal.setAttribute('aria-hidden', 'true');
  }

  logoutBtn.addEventListener('click', openModal);
  modalCancel.addEventListener('click', closeModal);

  // Close modal when clicking outside content
  logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
      closeModal();
    }
  });

  modalConfirmLogout.addEventListener('click', () => {
    closeModal();
    showToast('Signed out of ArtisanFlow session');
  });

  // Toast Functionality
  let toastTimeout;
  function showToast(message) {
    clearTimeout(toastTimeout);
    toastText.textContent = message;
    toast.classList.add('active');

    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 3500);
  }

  // Workspace Banner Badge Interaction
  const bannerBadge = document.querySelector('.banner-badge');
  if (bannerBadge) {
    bannerBadge.addEventListener('click', () => {
      showToast('Navigating to your artisan workspace...');
    });
  }
});

