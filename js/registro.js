const registrationForm = document.getElementById("registro-formulario");
const passwordInput = document.getElementById("clave");
const passwordConfirmation = document.getElementById("confirmar-clave");
const passwordMessage = document.getElementById("confirmar-ayuda");
const profilePhotoInput = document.getElementById("foto-perfil");
const profilePhotoPreview = document.getElementById("foto-perfil-preview");
const registrationStatus = document.getElementById("registro-estado");
const registrationSubmit = registrationForm instanceof HTMLFormElement
  ? registrationForm.querySelector('button[type="submit"]')
  : null;

if (
  !(registrationForm instanceof HTMLFormElement) ||
  !(passwordInput instanceof HTMLInputElement) ||
  !(passwordConfirmation instanceof HTMLInputElement) ||
  !(passwordMessage instanceof HTMLElement) ||
  !(profilePhotoInput instanceof HTMLInputElement) ||
  !(profilePhotoPreview instanceof HTMLImageElement) ||
  !(registrationStatus instanceof HTMLElement) ||
  !(registrationSubmit instanceof HTMLButtonElement)
) {
  throw new Error("No se encontraron los elementos necesarios para el registro.");
}

const setRegistrationMessage = (message, state) => {
  registrationStatus.textContent = message;
  registrationStatus.dataset.state = state;
  registrationStatus.hidden = false;
};

const readPhoto = (file) => new Promise((resolve, reject) => {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    reject(new Error("Elige una imagen JPG, PNG o WebP."));
    return;
  }
  if (file.size > 1024 * 1024) {
    reject(new Error("La foto debe pesar máximo 1 MB."));
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result === "string") {
      resolve(reader.result);
    } else {
      reject(new Error("No se pudo leer la foto seleccionada."));
    }
  }, { once: true });
  reader.addEventListener("error", () => reject(new Error("No se pudo leer la foto seleccionada.")), { once: true });
  reader.readAsDataURL(file);
});

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
    profilePhotoPreview.src = await readPhoto(file);
    profilePhotoPreview.hidden = false;
    registrationStatus.hidden = true;
  } catch (error) {
    registrationStatus.textContent = error.message;
    registrationStatus.dataset.state = "error";
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

  registrationSubmit.disabled = true;
  registrationStatus.hidden = true;

  try {
    const [file] = profilePhotoInput.files || [];
    const photoPreview = file ? await readPhoto(file) : null;
    const formData = new FormData();
    formData.set("full_name", nameInput.value.trim());
    formData.set("email", emailInput.value.trim());
    formData.set("password", passwordInput.value);
    formData.set("password_confirmation", passwordConfirmation.value);
    if (file) {
      formData.set("profile_photo", file, file.name);
    }

    const result = await window.InventoryAuthClient.request("/api/register", {
      method: "POST",
      body: formData,
    });

    try {
      window.sessionStorage.setItem("inventarioSena.registrationNotice", JSON.stringify({
        full_name: result.full_name,
        email: result.email,
        photo: photoPreview,
      }));
    } catch (error) {
      setRegistrationMessage("Cuenta creada. No se pudo preparar la vista previa, pero puedes iniciar sesión.", "success");
    }

    window.location.assign(`./login.html?registered=1&email=${encodeURIComponent(result.email)}`);
  } catch (error) {
    setRegistrationMessage(error.message, "error");
    registrationSubmit.disabled = false;
  }
});
