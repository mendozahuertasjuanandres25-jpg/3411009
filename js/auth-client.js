(function () {
  const request = async (url, options) => {
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
