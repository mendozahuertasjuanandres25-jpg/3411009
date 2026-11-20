const loginForm = document.getElementById("login-form");
const loginSubmit = document.getElementById("login-submit");
const passwordInput = document.getElementById("clave");
const passwordToggle = document.getElementById("toggle-password");
const loginStatus = document.getElementById("login-status");
const recoveryButton = document.querySelector('[data-login-feature="recovery"]');
const registeredToast = document.getElementById("registration-toast");
const registeredName = document.getElementById("registered-name");
const registeredEmail = document.getElementById("registered-email");
const registeredPhoto = document.getElementById("registered-photo");
const registeredInitial = document.getElementById("registered-initial");
const emailInput = document.getElementById("correo");
const rememberInput = document.getElementById("recordar");

if (
  !(loginForm instanceof HTMLFormElement) ||
  !(loginSubmit instanceof HTMLButtonElement) ||
  !(passwordInput instanceof HTMLInputElement) ||
  !(passwordToggle instanceof HTMLButtonElement) ||
  !(loginStatus instanceof HTMLElement) ||
  !(recoveryButton instanceof HTMLButtonElement) ||
  !(registeredToast instanceof HTMLElement) ||
  !(registeredName instanceof HTMLElement) ||
  !(registeredEmail instanceof HTMLElement) ||
  !(registeredPhoto instanceof HTMLImageElement) ||
  !(registeredInitial instanceof HTMLElement) ||
  !(emailInput instanceof HTMLInputElement) ||
  !(rememberInput instanceof HTMLInputElement)
) {
  throw new Error("No se encontraron los elementos necesarios para el inicio de sesión.");
}

const showLoginMessage = (message, state) => {
  loginStatus.textContent = message;
  loginStatus.dataset.state = state;
  loginStatus.hidden = false;
};

const showRegistrationConfirmation = () => {
  const query = new URLSearchParams(window.location.search);
  if (query.get("registered") !== "1") {
    return;
  }

  registeredToast.hidden = false;
  const email = query.get("email") || "";
  emailInput.value = email;
  registeredEmail.textContent = email;
  registeredName.textContent = "Tu cuenta está lista para iniciar sesión.";

  const noticeText = window.sessionStorage.getItem("inventarioSena.registrationNotice");
  if (noticeText) {
    window.sessionStorage.removeItem("inventarioSena.registrationNotice");
    try {
      const notice = JSON.parse(noticeText);
      if (notice.email && notice.email.toLocaleLowerCase("es") === email.toLocaleLowerCase("es")) {
        registeredName.textContent = notice.full_name;
        registeredInitial.textContent = notice.full_name.trim().charAt(0).toLocaleUpperCase("es");
        if (typeof notice.photo === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(notice.photo)) {
          registeredPhoto.src = notice.photo;
          registeredPhoto.hidden = false;
          registeredInitial.hidden = true;
        }
      }
    } catch (error) {
      showLoginMessage("La cuenta fue creada. No se pudo cargar su vista previa; inicia sesión con tu correo.", "info");
    }
  }
};

showRegistrationConfirmation();

passwordToggle.addEventListener("click", () => {
  const shouldShowPassword = passwordInput.type === "password";
  passwordInput.type = shouldShowPassword ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
  passwordToggle.setAttribute("aria-label", shouldShowPassword ? "Ocultar contraseña" : "Mostrar contraseña");
});
passwordToggle.disabled = false;

recoveryButton.addEventListener("click", () => {
  showLoginMessage("La recuperación de contraseña estará disponible cuando se configure el servicio correspondiente.", "info");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) {
    return;
  }

  loginSubmit.disabled = true;
  loginStatus.hidden = true;
  const body = new URLSearchParams({
    email: emailInput.value.trim(),
    password: passwordInput.value,
    remember_me: String(rememberInput.checked),
  });

  try {
    await window.InventoryAuthClient.request("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body,
    });
    window.location.assign("./dashboard.html");
  } catch (error) {
    showLoginMessage(error.message, "error");
    loginSubmit.disabled = false;
  }
});

loginSubmit.disabled = false;
