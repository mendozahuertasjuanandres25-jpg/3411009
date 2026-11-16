const loginForm = document.getElementById("login-form");
const loginSubmit = document.getElementById("login-submit");
const passwordInput = document.getElementById("clave");
const passwordToggle = document.getElementById("toggle-password");
const loginStatus = document.getElementById("login-status");
const recoveryButton = document.querySelector('[data-login-feature="recovery"]');

if (
  !(loginForm instanceof HTMLFormElement) ||
  !(loginSubmit instanceof HTMLButtonElement) ||
  !(passwordInput instanceof HTMLInputElement) ||
  !(passwordToggle instanceof HTMLButtonElement) ||
  !(loginStatus instanceof HTMLElement) ||
  !(recoveryButton instanceof HTMLButtonElement)
) {
  throw new Error("No se encontraron los elementos necesarios para el inicio de sesión.");
}

passwordToggle.addEventListener("click", () => {
  const shouldShowPassword = passwordInput.type === "password";
  passwordInput.type = shouldShowPassword ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
  passwordToggle.setAttribute("aria-label", shouldShowPassword ? "Ocultar contraseña" : "Mostrar contraseña");
});
passwordToggle.disabled = false;

const showPendingMessage = (message) => {
  loginStatus.textContent = message;
  loginStatus.hidden = false;
};

recoveryButton.addEventListener("click", () => {
  showPendingMessage("La recuperación de contraseña estará disponible cuando se configure el servicio de autenticación.");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (loginForm.reportValidity()) {
    window.location.assign("dashboard.html");
  }
});
loginSubmit.disabled = false;
