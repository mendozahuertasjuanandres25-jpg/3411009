(function () {
  const STORAGE_KEY = "inventarioSena.localData";
  const readStore = () => {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {
        users: {},
        currentUserId: null,
        purchases: {},
      };
    } catch (error) {
      return { users: {}, currentUserId: null, purchases: {} };
    }
  };
  const writeStore = (store) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  };
  const readFile = (file) => new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener("error", () => reject(new Error("No se pudo leer la foto.")), { once: true });
    reader.readAsDataURL(file);
  });
  const publicUser = (store, user) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    photo_url: user.photo_url || null,
  });

  const handleLocalRequest = async (url, options) => {
    const store = readStore();
    const method = (options && options.method || "GET").toUpperCase();
    const body = options && options.body;

    if (url === "/api/me" && method === "GET") {
      let user = store.users[store.currentUserId];
      if (!user) {
        user = {
          id: "demo",
          full_name: "Usuario de demostración",
          email: "demo@sena.test",
          password: "",
          photo_url: null,
        };
        store.users.demo = user;
        store.currentUserId = "demo";
        writeStore(store);
      }
      return {
        user: publicUser(store, user),
        csrf_token: "demo-csrf-token",
      };
    }

    if (url === "/api/register" && method === "POST") {
      const fields = body instanceof FormData
        ? Object.fromEntries([
            ["full_name", body.get("full_name")],
            ["email", body.get("email")],
            ["password", body.get("password")],
            ["profile_photo", body.get("profile_photo")],
          ])
        : {};
      const email = String(fields.email || "").trim().toLowerCase();
      const name = String(fields.full_name || "").trim();
      if (!name || !email) {
        throw new Error("Completa el nombre y el correo.");
      }
      if (Object.values(store.users).some((user) => user.email.toLowerCase() === email)) {
        throw new Error("Ese correo ya tiene una cuenta. Inicia sesión o usa otro correo.");
      }
      const photo = fields.profile_photo instanceof File
        ? await readFile(fields.profile_photo)
        : null;
      const id = `user-${Date.now()}`;
      store.users[id] = {
        id,
        full_name: name,
        email,
        password: String(fields.password || ""),
        photo_url: photo,
      };
      store.purchases[id] = [];
      writeStore(store);
      return { message: "Cuenta creada.", full_name: name, email };
    }

    if (url === "/api/login" && method === "POST") {
      let values = {};
      if (body instanceof URLSearchParams) {
        values = Object.fromEntries(body.entries());
      } else if (body instanceof FormData) {
        values = Object.fromEntries(body.entries());
      }
      const email = String(values.email || "").trim().toLowerCase();
      let user = Object.values(store.users).find((item) => item.email.toLowerCase() === email);
      if (!user) {
        const id = `user-${Date.now()}`;
        user = {
          id,
          full_name: email.split("@")[0] || "Usuario",
          email,
          password: String(values.password || ""),
          photo_url: null,
        };
        store.users[id] = user;
        store.purchases[id] = [];
      } else if (user.password && user.password !== String(values.password || "")) {
        throw new Error("El correo o la contraseña son incorrectos.");
      }
      store.currentUserId = user.id;
      writeStore(store);
      return {
        user: publicUser(store, user),
        csrf_token: "demo-csrf-token",
      };
    }

    if (url === "/api/logout" && method === "POST") {
      const user = store.users[store.currentUserId];
      if (user && user.id === "demo") {
        delete store.users.demo;
      }
      store.currentUserId = null;
      writeStore(store);
      return { message: "Sesión cerrada." };
    }

    if (url === "/api/profile" && method === "POST") {
      const user = store.users[store.currentUserId];
      if (!user) {
        throw new Error("Inicia sesión para continuar.");
      }
      const name = body instanceof FormData ? String(body.get("full_name") || "").trim() : "";
      if (!name) {
        throw new Error("Escribe tu nombre completo.");
      }
      user.full_name = name;
      const removePhoto = body instanceof FormData && body.get("remove_photo") === "true";
      const photo = body instanceof FormData ? body.get("profile_photo") : null;
      if (removePhoto) {
        user.photo_url = null;
      } else if (photo instanceof File) {
        user.photo_url = await readFile(photo);
      }
      writeStore(store);
      return { user: publicUser(store, user), csrf_token: "demo-csrf-token" };
    }

    if (url === "/api/purchases" && method === "GET") {
      const userId = store.currentUserId;
      return { purchases: store.purchases[userId] || [] };
    }

    if (url === "/api/purchases" && method === "POST") {
      const product = (options && options.body instanceof URLSearchParams)
        ? options.body.get("product_id")
        : null;
      const catalog = {
        "teclado-inalambrico": ["Teclado inalámbrico", 85000],
        "mouse-optico": ["Mouse óptico", 42000],
        "ssd-480gb": ["Unidad SSD 480 GB", 165000],
        "monitor-24": ["Monitor de 24 pulgadas", 620000],
        "samsung-galaxy-s24": ["Samsung Galaxy S24", 3990000],
        "iphone-15-pro": ["iPhone 15 Pro", 5580000],
        "xiaomi-redmi-note-13": ["Redmi Note 13 Pro", 1350000],
        "motorola-edge-50": ["Motorola Edge 50", 2200000],
      };
      if (!catalog[product]) {
        throw new Error("El producto seleccionado no está disponible.");
      }
      const userId = store.currentUserId;
      store.purchases[userId] ||= [];
      store.purchases[userId].unshift({
        product_id: product,
        product_name: catalog[product][0],
        price: catalog[product][1],
        purchased_at: new Date().toISOString(),
      });
      writeStore(store);
      return { message: "Compra de demostración registrada." };
    }

    throw new Error("Esta acción no está disponible en el modo local.");
  };

  const request = async (url, options) => {
    if (url.startsWith("/api/")) {
      try {
        return await handleLocalRequest(url, options);
      } catch (error) {
        const localError = error instanceof Error ? error : new Error("No se pudo completar la solicitud.");
        localError.status = 422;
        throw localError;
      }
    }

    const requestOptions = options || {};
    const headers = new Headers(requestOptions.headers || {});
    headers.set("Accept", "application/json");

    const response = await fetch(url, {
      ...requestOptions,
      credentials: "same-origin",
      headers,
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : {};

    if (!response.ok) {
      const error = new Error(payload.error || "No se pudo completar la solicitud.");
      error.status = response.status;
      throw error;
    }

    return payload;
  };

  document.addEventListener("click", async (event) => {
    const logoutLink = event.target instanceof Element ? event.target.closest("[data-auth-logout]") : null;
    if (!logoutLink) {
      return;
    }

    event.preventDefault();
    try {
      const currentSession = await request("/api/me");
      await request("/api/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": currentSession.csrf_token },
      });
      window.location.assign(logoutLink.href);
    } catch (error) {
      window.alert(`No se pudo cerrar la sesión. ${error.message}`);
    }
  });

  window.InventoryAuthClient = Object.freeze({ request });
})();
