const menu = document.getElementById("menuLateral");
const toggleButton = document.querySelector("[data-menu-toggle]");
const backdrop = document.querySelector(".menu-fondo");
const closeButtons = document.querySelectorAll("[data-menu-close]");

if (!(menu instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement) || !(backdrop instanceof HTMLButtonElement)) {
  throw new Error("No se encontraron los elementos necesarios para el menú.");
}

const setMenuOpen = (open) => {
  menu.classList.toggle("abierto", open);
  backdrop.classList.toggle("visible", open);
  document.body.classList.toggle("menu-abierto", open);
  menu.setAttribute("aria-hidden", String(!open));
  backdrop.setAttribute("aria-hidden", String(!open));
  toggleButton.setAttribute("aria-expanded", String(open));
  toggleButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  menu.inert = !open;

  if (open) {
    const firstLink = menu.querySelector(".menu-enlace");
    if (firstLink instanceof HTMLElement) {
      firstLink.focus();
    }
  } else {
    toggleButton.focus();
  }
};

toggleButton.addEventListener("click", () => {
  setMenuOpen(toggleButton.getAttribute("aria-expanded") !== "true");
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => setMenuOpen(false));
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && toggleButton.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
  }
});
