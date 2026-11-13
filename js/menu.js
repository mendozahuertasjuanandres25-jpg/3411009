const menu = document.getElementById("menuLateral");
const toggleButton = document.querySelector("[data-menu-toggle]");
const backdrop = document.querySelector(".menu-fondo");
const closeButtons = document.querySelectorAll("[data-menu-close]");
const desktopViewport = window.matchMedia("(min-width: 768px)");

if (!(menu instanceof HTMLElement) || !(toggleButton instanceof HTMLButtonElement) || !(backdrop instanceof HTMLButtonElement)) {
  throw new Error("No se encontraron los elementos necesarios para el menú.");
}

const setMenuOpen = (open, restoreFocus = true) => {
  const menuIsOpen = desktopViewport.matches || open;
  const mobileMenuIsOpen = !desktopViewport.matches && menuIsOpen;

  menu.classList.toggle("abierto", menuIsOpen);
  backdrop.classList.toggle("visible", mobileMenuIsOpen);
  document.body.classList.toggle("menu-abierto", mobileMenuIsOpen);
  menu.setAttribute("aria-hidden", String(!menuIsOpen));
  backdrop.setAttribute("aria-hidden", String(!mobileMenuIsOpen));
  toggleButton.setAttribute("aria-expanded", String(mobileMenuIsOpen));
  toggleButton.setAttribute("aria-label", mobileMenuIsOpen ? "Cerrar menú" : "Abrir menú");
  menu.inert = !menuIsOpen;

  if (open && mobileMenuIsOpen) {
    const firstLink = menu.querySelector(".menu-enlace");
    if (firstLink instanceof HTMLElement) {
      firstLink.focus();
    }
  } else if (!menuIsOpen && restoreFocus) {
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
  if (!desktopViewport.matches && event.key === "Escape" && toggleButton.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
  }
});

desktopViewport.addEventListener("change", () => setMenuOpen(false, false));
setMenuOpen(false, false);
