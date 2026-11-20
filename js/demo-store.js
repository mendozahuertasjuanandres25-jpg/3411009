(function () {
  const PROFILES_KEY = "inventarioSena.demoProfiles";
  const ACTIVE_USER_KEY = "inventarioSena.activeUser";
  const MAX_PHOTO_SIZE = 1024 * 1024;
  const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const normalizeEmail = (email) => String(email).trim().toLocaleLowerCase("es");

  const readProfiles = () => {
    const savedProfiles = window.localStorage.getItem(PROFILES_KEY);
    if (!savedProfiles) {
      return {};
    }

    let profiles;
    try {
      profiles = JSON.parse(savedProfiles);
    } catch (error) {
      throw new Error("Los perfiles guardados están dañados. Borra los datos locales del sitio e inténtalo de nuevo.");
    }

    if (!profiles || typeof profiles !== "object" || Array.isArray(profiles)) {
      throw new Error("El formato de los perfiles guardados no es válido.");
    }

    return profiles;
  };

  const getProfile = (email) => {
    const normalizedEmail = normalizeEmail(email);
    const profile = readProfiles()[normalizedEmail];
    return profile && typeof profile === "object" ? profile : null;
  };

  const saveProfile = (profile) => {
    const email = normalizeEmail(profile.email);
    const name = String(profile.name).trim();
    if (!email || !name) {
      throw new Error("Escribe un nombre y un correo válidos para guardar el perfil.");
    }

    const profiles = readProfiles();
    const previousProfile = profiles[email];
    profiles[email] = {
      name,
      email,
      photo: profile.photo || null,
      purchases: previousProfile && Array.isArray(previousProfile.purchases) ? previousProfile.purchases : [],
    };
    window.localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    return profiles[email];
  };

  const getActiveEmail = () => window.sessionStorage.getItem(ACTIVE_USER_KEY);

  const setActiveEmail = (email) => {
    window.sessionStorage.setItem(ACTIVE_USER_KEY, normalizeEmail(email));
  };

  const clearActiveEmail = () => window.sessionStorage.removeItem(ACTIVE_USER_KEY);

  const addPurchase = (email, purchase) => {
    const profile = getProfile(email);
    if (!profile) {
      throw new Error("No se encontró el perfil para guardar esta compra.");
    }

    const purchases = Array.isArray(profile.purchases) ? profile.purchases : [];
    const updatedProfile = {
      ...profile,
      purchases: purchases.concat({
        productId: purchase.productId,
        productName: purchase.productName,
        price: purchase.price,
        purchasedAt: new Date().toISOString(),
      }),
    };
    return saveProfile(updatedProfile);
  };

  const readPhoto = (file) => new Promise((resolve, reject) => {
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      reject(new Error("Elige una imagen JPG, PNG o WebP."));
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
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

  document.addEventListener("click", (event) => {
    const logoutLink = event.target instanceof Element ? event.target.closest("[data-demo-logout]") : null;
    if (logoutLink) {
      event.preventDefault();
      clearActiveEmail();
      window.location.assign(logoutLink.href);
    }
  });

  window.InventoryDemoStore = Object.freeze({
    addPurchase,
    clearActiveEmail,
    getActiveEmail,
    getProfile,
    normalizeEmail,
    readPhoto,
    saveProfile,
    setActiveEmail,
  });
})();
