const registrationForm = document.getElementById("registro-formulario");
const passwordInput = document.getElementById("clave");
const passwordConfirmation = document.getElementById("confirmar-clave");
const passwordMessage = document.getElementById("confirmar-ayuda");
const profilePhotoInput = document.getElementById("foto-perfil");
const profilePhotoPreview = document.getElementById("foto-perfil-preview");
const registrationStatus = document.getElementById("registro-estado");

if (
  !(registrationForm instanceof HTMLFormElement) ||
  !(passwordInput instanceof HTMLInputElement) ||
  !(passwordConfirmation instanceof HTMLInputElement) ||
  !(passwordMessage instanceof HTMLElement) ||
  !(profilePhotoInput instanceof HTMLInputElement) ||
  !(profilePhotoPreview instanceof HTMLImageElement) ||
  !(registrationStatus instanceof HTMLElement)
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
profilePhotoInput.addEventListener("change", async () => {
  const [file] = profilePhotoInput.files || [];
  if (!file) {
    profilePhotoPreview.hidden = true;
    return;
  }

  try {
    profilePhotoPreview.src = await window.InventoryDemoStore.readPhoto(file);
    profilePhotoPreview.hidden = false;
    registrationStatus.hidden = true;
  } catch (error) {
    registrationStatus.textContent = error.message;
    registrationStatus.hidden = false;
    profilePhotoInput.value = "";
    profilePhotoPreview.hidden = true;
  }
});

registrationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  validatePasswordMatch();

  if (!registrationForm.reportValidity()) {
    return;
  }

  const nameInput = document.getElementById("nombre");
  const emailInput = document.getElementById("correo");
  if (!(nameInput instanceof HTMLInputElement) || !(emailInput instanceof HTMLInputElement)) {
    throw new Error("No se encontraron los campos de nombre y correo del registro.");
  }

  try {
    const [file] = profilePhotoInput.files || [];
    const previousProfile = window.InventoryDemoStore.getProfile(emailInput.value);
    const photo = file ? await window.InventoryDemoStore.readPhoto(file) : previousProfile ? previousProfile.photo : null;
    window.InventoryDemoStore.saveProfile({
      name: nameInput.value,
      email: emailInput.value,
      photo,
    });
    window.InventoryDemoStore.setActiveEmail(emailInput.value);
    window.location.assign("dashboard.html");
  } catch (error) {
    registrationStatus.textContent = `No se pudo guardar el perfil en este navegador. ${error.message}`;
    registrationStatus.hidden = false;
  }
});
