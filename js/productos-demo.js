const purchaseStatus = document.getElementById("compra-estado");
const loginLink = document.getElementById("compra-login");

if (!(purchaseStatus instanceof HTMLElement) || !(loginLink instanceof HTMLAnchorElement)) {
  throw new Error("No se encontraron los elementos necesarios para el catálogo.");
}

const activeEmail = window.InventoryDemoStore.getActiveEmail();
loginLink.hidden = Boolean(activeEmail);
if (activeEmail) {
  const profile = window.InventoryDemoStore.getProfile(activeEmail);
  purchaseStatus.textContent = `Sesión de demostración: ${profile ? profile.name : activeEmail}.`;
}

document.querySelectorAll("[data-buy-product]").forEach((button) => {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  button.addEventListener("click", () => {
    const email = window.InventoryDemoStore.getActiveEmail();
    if (!email) {
      purchaseStatus.textContent = "Inicia sesión para registrar una compra en tu historial.";
      loginLink.hidden = false;
      return;
    }

    const purchase = {
      productId: button.dataset.productId,
      productName: button.dataset.productName,
      price: Number(button.dataset.productPrice),
    };
    if (!purchase.productId || !purchase.productName || !Number.isFinite(purchase.price) || purchase.price <= 0) {
      throw new Error("Los datos del producto no son válidos.");
    }

    if (!window.confirm(`¿Registrar una compra de prueba de "${purchase.productName}"? No se realizará ningún pago.`)) {
      return;
    }

    try {
      window.InventoryDemoStore.addPurchase(email, purchase);
      purchaseStatus.textContent = `Compra de prueba registrada: ${purchase.productName}. Ya aparece en tu perfil.`;
    } catch (error) {
      purchaseStatus.textContent = `No se pudo registrar la compra. ${error.message}`;
    }
  });
});
