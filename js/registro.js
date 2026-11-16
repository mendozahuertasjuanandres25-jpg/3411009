const registrationForm = document.getElementById("registro-formulario");
const passwordInput = document.getElementById("clave");
const passwordConfirmation = document.getElementById("confirmar-clave");
const passwordMessage = document.getElementById("confirmar-ayuda");

if (
  !(registrationForm instanceof HTMLFormElement) ||
  !(passwordInput instanceof HTMLInputElement) ||
  !(passwordConfirmation instanceof HTMLInputElement) ||
  !(passwordMessage instanceof HTMLElement)
) {
  throw new Error("No se encontraron los elementos necesarios para validar el registro.");
}

const validatePasswordMatch = () => {
  const isEmpty = passwordConfirmation.value.length === 0;
  const passwordsMatch = passwordInput.value === passwordConfirmation.value;
  const mismatchMessage = "Las contraseñas no coinciden.";

  passwordConfirmation.setCustomValidity(!isEmpty && !passwordsMatch ? mismatchMessage : "");
  passwordMessage.textContent = mismatchMessage;
  passwordMessage.hidden = isEmpty || passwordsMatch;
};

passwordInput.addEventListener("input", validatePasswordMatch);
passwordConfirmation.addEventListener("input", validatePasswordMatch);
registrationForm.addEventListener("submit", (event) => {
  validatePasswordMatch();

  if (!passwordConfirmation.checkValidity()) {
    event.preventDefault();
    passwordConfirmation.reportValidity();
  }
});
