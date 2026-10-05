(() => {
  const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];
  const sections = [...document.querySelectorAll(".one-page-section")];
  const menuButton = document.querySelector(".menu-btn");

  // Fecha o menu mobile ao escolher uma seção.
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      menuButton?.setAttribute("aria-expanded", "false");
    });
  });

  // Destaca o menu conforme a seção que está sendo visualizada.
  // Usamos a posição real das seções porque "Sobre mim" é uma seção longa
  // e o IntersectionObserver com threshold alto poderia não ativá-la.
  function updateActiveNav() {
    const offset = (parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue("--header-height")) || 120) + 40;

    let currentId = sections[0]?.id || "home";

    sections.forEach(section => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY + offset >= top) {
        currentId = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === "#" + currentId
      );
    });
  }

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  window.addEventListener("resize", updateActiveNav);
  window.addEventListener("load", updateActiveNav);
  updateActiveNav();

})();

/* V17 — expansão da lista de doenças tratadas */
document.addEventListener("DOMContentLoaded", function () {
  const list = document.getElementById("doencas-lista");
  const button = document.querySelector(".disease-toggle");
  if (!list || !button) return;

  const extras = Array.from(list.querySelectorAll(".disease-extra"));
  let expanded = false;

  function render() {
    extras.forEach(item => { item.hidden = !expanded; });
    button.textContent = expanded ? "Veja menos" : "Veja mais";
    button.setAttribute("aria-expanded", String(expanded));
  }

  render();
  button.addEventListener("click", function () {
    expanded = !expanded;
    render();
  });
});
