// Password visibility toggle
const pwInput = document.getElementById('password');
const toggleBtn = document.getElementById('togglePw');

const eyeOpenIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const eyeOffIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.7 19.7 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.9 19.9 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/></svg>';

toggleBtn.addEventListener('click', () => {
  const isPassword = pwInput.type === 'password';
  pwInput.type = isPassword ? 'text' : 'password';
  toggleBtn.setAttribute('aria-label', isPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
  toggleBtn.innerHTML = isPassword ? eyeOffIcon : eyeOpenIcon;
});

// Login form submit
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  // TODO: hook up real authentication here.
});

// Volunteer login entry point
document.getElementById('volunteerBtn').addEventListener('click', () => {
  // TODO: hook up volunteer login flow here.
});
