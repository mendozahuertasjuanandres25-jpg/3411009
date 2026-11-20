const initializeProfilePage = () => {
  const activeEmail = window.InventoryDemoStore.getActiveEmail();
  if (!activeEmail) {
    window.location.replace("./login.html");
    return;
  }

  const profileForm = document.getElementById("perfil-formulario");
  const nameInput = document.getElementById("perfil-nombre");
  const emailInput = document.getElementById("perfil-correo");
  const photoInput = document.getElementById("perfil-foto");
  const removePhotoButton = document.getElementById("perfil-quitar-foto");
  const avatarPhoto = document.getElementById("perfil-avatar-foto");
  const avatarFallback = document.getElementById("perfil-avatar-predeterminado");
  const status = document.getElementById("perfil-mensaje");
  const purchaseBody = document.getElementById("historial-compras");
  const emptyHistory = document.getElementById("historial-vacio");

  if (
    !(profileForm instanceof HTMLFormElement) ||
    !(nameInput instanceof HTMLInputElement) ||
    !(emailInput instanceof HTMLInputElement) ||
    !(photoInput instanceof HTMLInputElement) ||
    !(removePhotoButton instanceof HTMLButtonElement) ||
    !(avatarPhoto instanceof HTMLImageElement) ||
    !(avatarFallback instanceof SVGElement) ||
    !(status instanceof HTMLElement) ||
    !(purchaseBody instanceof HTMLTableSectionElement) ||
    !(emptyHistory instanceof HTMLElement)
  ) {
    throw new Error("No se encontraron los elementos necesarios para el perfil.");
  }

  let profile = window.InventoryDemoStore.getProfile(activeEmail);
  if (!profile) {
    profile = { name: activeEmail.split("@")[0], email: activeEmail, photo: null, purchases: [] };
  }
  nameInput.value = profile.name;
  emailInput.value = activeEmail;

  const showPhoto = (photo) => {
    if (photo) {
      avatarPhoto.src = photo;
      avatarPhoto.hidden = false;
      avatarFallback.hidden = true;
    } else {
      avatarPhoto.removeAttribute("src");
      avatarPhoto.hidden = true;
      avatarFallback.hidden = false;
    }
  };
  showPhoto(profile.photo);

  photoInput.addEventListener("change", async () => {
    const [file] = photoInput.files || [];
    if (!file) {
      showPhoto(profile.photo);
      return;
    }
    try {
      showPhoto(await window.InventoryDemoStore.readPhoto(file));
      status.hidden = true;
    } catch (error) {
      status.textContent = error.message;
      status.hidden = false;
      photoInput.value = "";
      showPhoto(profile.photo);
    }
  });

  removePhotoButton.addEventListener("click", () => {
    photoInput.value = "";
    profile = { ...profile, photo: null };
    showPhoto(null);
    status.textContent = "La foto se quitará cuando guardes los cambios.";
    status.hidden = false;
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!profileForm.reportValidity()) {
      return;
    }

    try {
      const [file] = photoInput.files || [];
      const photo = file ? await window.InventoryDemoStore.readPhoto(file) : profile.photo;
      profile = window.InventoryDemoStore.saveProfile({
        name: nameInput.value,
        email: activeEmail,
        photo,
      });
      showPhoto(profile.photo);
      photoInput.value = "";
      status.textContent = "Perfil actualizado en este navegador.";
      status.hidden = false;
    } catch (error) {
      status.textContent = `No se pudieron guardar los cambios. ${error.message}`;
      status.hidden = false;
    }
  });

  const purchases = Array.isArray(profile.purchases) ? profile.purchases.slice().reverse() : [];
  purchases.forEach((purchase) => {
    const row = document.createElement("tr");
    const productCell = document.createElement("td");
    const dateCell = document.createElement("td");
    const priceCell = document.createElement("td");
    productCell.textContent = purchase.productName;
    dateCell.textContent = new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(purchase.purchasedAt));
    priceCell.textContent = new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(purchase.price);
    row.append(productCell, dateCell, priceCell);
    purchaseBody.append(row);
  });
  emptyHistory.hidden = purchases.length > 0;
};

initializeProfilePage();
