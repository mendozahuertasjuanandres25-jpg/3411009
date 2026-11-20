const profileForm = document.getElementById("perfil-formulario");
const nameInput = document.getElementById("perfil-nombre");
const emailInput = document.getElementById("perfil-correo");
const photoInput = document.getElementById("perfil-foto");
const removePhotoButton = document.getElementById("perfil-quitar-foto");
const avatarPhoto = document.getElementById("perfil-avatar-foto");
const avatarFallback = document.getElementById("perfil-avatar-predeterminado");
const statusMessage = document.getElementById("perfil-mensaje");
const purchaseBody = document.getElementById("historial-compras");
const emptyHistory = document.getElementById("historial-vacio");
const saveButton = profileForm instanceof HTMLFormElement
  ? profileForm.querySelector('button[type="submit"]')
  : null;

if (
  !(profileForm instanceof HTMLFormElement) ||
  !(nameInput instanceof HTMLInputElement) ||
  !(emailInput instanceof HTMLInputElement) ||
  !(photoInput instanceof HTMLInputElement) ||
  !(removePhotoButton instanceof HTMLButtonElement) ||
  !(avatarPhoto instanceof HTMLImageElement) ||
  !(avatarFallback instanceof SVGElement) ||
  !(statusMessage instanceof HTMLElement) ||
  !(purchaseBody instanceof HTMLTableSectionElement) ||
  !(emptyHistory instanceof HTMLElement) ||
  !(saveButton instanceof HTMLButtonElement)
) {
  throw new Error("No se encontraron los elementos necesarios para el perfil.");
}

let csrfToken = "";
let removePhoto = false;
let previewUrl = null;
let currentPhotoUrl = null;

const setStatus = (message, state) => {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
  statusMessage.hidden = false;
};

const showPhoto = (url) => {
  currentPhotoUrl = url;
  if (url) {
    avatarPhoto.src = url;
    avatarPhoto.hidden = false;
    avatarFallback.hidden = true;
  } else {
    avatarPhoto.removeAttribute("src");
    avatarPhoto.hidden = true;
    avatarFallback.hidden = false;
  }
};

const renderPurchases = (purchases) => {
  purchaseBody.replaceChildren();
  purchases.forEach((purchase) => {
    const row = document.createElement("tr");
    const productCell = document.createElement("td");
    const dateCell = document.createElement("td");
    const priceCell = document.createElement("td");
    productCell.textContent = purchase.product_name;
    dateCell.textContent = new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(purchase.purchased_at));
    priceCell.textContent = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(purchase.price));
    row.append(productCell, dateCell, priceCell);
    purchaseBody.append(row);
  });
  emptyHistory.hidden = purchases.length > 0;
};

const loadProfile = async () => {
  try {
    const session = await window.InventoryAuthClient.request("/api/me");
    const user = session.user;
    csrfToken = session.csrf_token;
    nameInput.value = user.full_name;
    emailInput.value = user.email;
    showPhoto(user.photo_url ? `${user.photo_url}?v=${Date.now()}` : null);

    const { purchases } = await window.InventoryAuthClient.request("/api/purchases");
    renderPurchases(purchases);
  } catch (error) {
    if (error.status === 401) {
      window.location.replace("./login.html");
      return;
    }
    setStatus(`No se pudo cargar el perfil. ${error.message}`, "error");
  }
};

photoInput.addEventListener("change", () => {
  const [file] = photoInput.files || [];
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  if (!file) {
    showPhoto(currentPhotoUrl);
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1024 * 1024) {
    photoInput.value = "";
    setStatus("Elige una imagen JPG, PNG o WebP de máximo 1 MB.", "error");
    return;
  }
  removePhoto = false;
  previewUrl = URL.createObjectURL(file);
  showPhoto(previewUrl);
  statusMessage.hidden = true;
});

removePhotoButton.addEventListener("click", () => {
  photoInput.value = "";
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  removePhoto = true;
  showPhoto(null);
  setStatus("La foto se quitará cuando guardes los cambios.", "info");
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!profileForm.reportValidity()) {
    return;
  }

  saveButton.disabled = true;
  const formData = new FormData();
  formData.set("full_name", nameInput.value.trim());
  formData.set("remove_photo", String(removePhoto));
  const [file] = photoInput.files || [];
  if (file) {
    formData.set("profile_photo", file, file.name);
  }

  try {
    const { user } = await window.InventoryAuthClient.request("/api/profile", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body: formData,
    });
    nameInput.value = user.full_name;
    removePhoto = false;
    photoInput.value = "";
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    showPhoto(user.photo_url ? `${user.photo_url}?v=${Date.now()}` : null);
    setStatus("Perfil actualizado correctamente.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    saveButton.disabled = false;
  }
});

avatarPhoto.addEventListener("error", () => showPhoto(null));
loadProfile();
