const currentDate = document.getElementById("current-date");
const searchInput = document.getElementById("product-search");
const productsTableBody = document.getElementById("products-table-body");
const productsEmpty = document.getElementById("products-empty");
const searchStatus = document.getElementById("search-status");
const notificationsToggle = document.getElementById("notifications-toggle");
const notificationsPanel = document.getElementById("notifications-panel");

if (
  !(currentDate instanceof HTMLElement) ||
  !(searchInput instanceof HTMLInputElement) ||
  !(productsTableBody instanceof HTMLTableSectionElement) ||
  !(productsEmpty instanceof HTMLTableRowElement) ||
  !(searchStatus instanceof HTMLElement) ||
  !(notificationsToggle instanceof HTMLButtonElement) ||
  !(notificationsPanel instanceof HTMLElement)
) {
  throw new Error("No se encontraron los elementos necesarios para el dashboard.");
}

currentDate.textContent = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

const updateProductSearch = () => {
  const query = searchInput.value.trim().toLocaleLowerCase("es");
  const rows = Array.from(productsTableBody.querySelectorAll("[data-product-row]"));
  let visibleRows = 0;

  rows.forEach((row) => {
    const matches = row.textContent.toLocaleLowerCase("es").includes(query);
    row.hidden = !matches;
    visibleRows += Number(matches);
  });

  productsEmpty.hidden = rows.length > 0 && visibleRows > 0;
  if (rows.length === 0 && query) {
    productsEmpty.querySelector("strong").textContent = "No hay productos para buscar";
    productsEmpty.querySelector("small").textContent = "Conecta la fuente de datos para buscar en el inventario.";
    searchStatus.textContent = "No hay productos cargados para buscar.";
  } else if (rows.length > 0 && query && visibleRows === 0) {
    productsEmpty.querySelector("strong").textContent = "No se encontraron coincidencias";
    productsEmpty.querySelector("small").textContent = "Prueba con otro nombre o categoría.";
    searchStatus.textContent = "No se encontraron productos que coincidan.";
  } else if (rows.length > 0 && query) {
    searchStatus.textContent = `${visibleRows} productos encontrados.`;
  } else {
    productsEmpty.querySelector("strong").textContent = "No hay productos para mostrar";
    productsEmpty.querySelector("small").textContent = "Los datos aparecerán aquí cuando estén conectados.";
    searchStatus.textContent = "";
  }
};

searchInput.addEventListener("input", updateProductSearch);

const closeNotifications = () => {
  notificationsToggle.setAttribute("aria-expanded", "false");
  notificationsToggle.setAttribute("aria-label", "Mostrar notificaciones");
  notificationsPanel.hidden = true;
};

notificationsToggle.addEventListener("click", () => {
  const shouldOpen = notificationsToggle.getAttribute("aria-expanded") !== "true";
  notificationsToggle.setAttribute("aria-expanded", String(shouldOpen));
  notificationsToggle.setAttribute("aria-label", shouldOpen ? "Cerrar notificaciones" : "Mostrar notificaciones");
  notificationsPanel.hidden = !shouldOpen;
});

document.addEventListener("click", (event) => {
  if (!notificationsPanel.contains(event.target) && !notificationsToggle.contains(event.target)) {
    closeNotifications();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNotifications();
  }
});
