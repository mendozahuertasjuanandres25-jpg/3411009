const purchaseStatus = document.getElementById("compra-estado");
const purchaseButtons = document.querySelectorAll("[data-buy-product]");
const loginLink = document.getElementById("compra-login");

if (!(purchaseStatus instanceof HTMLElement) || !(loginLink instanceof HTMLAnchorElement)) {
  throw new Error("No se encontraron los elementos necesarios para el catálogo.");
}

let csrfToken = "";

const loadSession = async () => {
  purchaseButtons.forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
    }
  });

  try {
    const { user, csrf_token: token } = await window.InventoryAuthClient.request("/api/me");
    csrfToken = token;
    purchaseStatus.textContent = `Sesión activa: ${user.full_name}. Las compras de esta página son demostrativas.`;
    loginLink.hidden = true;
    purchaseButtons.forEach((button) => {
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
      }
    });
  } catch (error) {
    if (error.status === 401) {
      window.location.replace("./login.html");
      return;
    }
    purchaseStatus.textContent = `No se pudo validar la sesión. ${error.message}`;
  }
};

purchaseButtons.forEach((button) => {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.addEventListener("click", async () => {
    const productId = button.dataset.productId;
    const productName = button.dataset.productName;
    if (!productId || !productName) {
      throw new Error("Los datos del producto no son válidos.");
    }

    if (!window.confirm(`¿Registrar una compra de demostración de "${productName}"? No se realizará ningún pago.`)) {
      return;
    }

    button.disabled = true;
    try {
      await window.InventoryAuthClient.request("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-CSRF-Token": csrfToken,
        },
        body: new URLSearchParams({ product_id: productId }),
      });
      purchaseStatus.textContent = `Compra de demostración registrada: ${productName}. Ya aparece en tu perfil.`;
    } catch (error) {
      purchaseStatus.textContent = `No se pudo registrar la compra. ${error.message}`;
    } finally {
      button.disabled = false;
    }
  });
});

loadSession();
