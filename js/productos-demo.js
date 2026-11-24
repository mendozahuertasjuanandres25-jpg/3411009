const purchaseStatus = document.getElementById("compra-estado");
const purchaseButtons = document.querySelectorAll("[data-buy-product]");
const loginLink = document.getElementById("compra-login");
const searchInput = document.getElementById("buscador-productos");
const productCards = Array.from(document.querySelectorAll(".producto-demo"));
const categoryButtons = document.querySelectorAll("[data-category-filter]");
const cartCounter = document.getElementById("contador-carrito");

let activeCategory = "todos";

const filterProducts = () => {
  const query = searchInput instanceof HTMLInputElement
    ? searchInput.value.trim().toLocaleLowerCase("es")
    : "";

  let visibleCount = 0;
  productCards.forEach((card) => {
    const categoryMatches = activeCategory === "todos"
      || card.dataset.category === activeCategory;
    const searchMatches = !query
      || card.dataset.search?.includes(query)
      || card.textContent.toLocaleLowerCase("es").includes(query);
    const visible = categoryMatches && searchMatches;
    card.hidden = !visible;
    if (visible) {
      visibleCount += 1;
    }
  });

  const grid = document.querySelector(".catalogo-grid");
  if (!(grid instanceof HTMLElement)) {
    return;
  }
  const existingMessage = grid.querySelector(".catalogo-sin-resultados");
  if (visibleCount === 0 && !existingMessage) {
    const message = document.createElement("p");
    message.className = "catalogo-sin-resultados";
    message.textContent = "No encontramos productos con esos criterios.";
    grid.appendChild(message);
  } else if (visibleCount > 0 && existingMessage) {
    existingMessage.remove();
  }
};

if (searchInput instanceof HTMLInputElement) {
  searchInput.addEventListener("input", filterProducts);
}

categoryButtons.forEach((button) => {
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }
  button.addEventListener("click", () => {
    activeCategory = button.dataset.categoryFilter || "todos";
    categoryButtons.forEach((item) => item.removeAttribute("aria-pressed"));
    button.setAttribute("aria-pressed", "true");
    filterProducts();
  });
});

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
    const headerLogin = document.querySelector(".tienda-login strong");
    if (headerLogin instanceof HTMLElement) {
      headerLogin.textContent = "Mi cuenta";
    }
    const purchaseHistory = await window.InventoryAuthClient.request("/api/purchases");
    if (cartCounter instanceof HTMLElement) {
      cartCounter.textContent = String(purchaseHistory.purchases.length);
    }
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
      if (cartCounter instanceof HTMLElement) {
        cartCounter.textContent = String(Number(cartCounter.textContent || "0") + 1);
      }
    } catch (error) {
      purchaseStatus.textContent = `No se pudo registrar la compra. ${error.message}`;
    } finally {
      button.disabled = false;
    }
  });
});

loadSession();
