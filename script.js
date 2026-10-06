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
/* HERO — crossfade + zoom contínuo, sem reset entre as fotos */
(() => {
  const slides = [...document.querySelectorAll(".hero-slider .hero-slide")];
  if (slides.length < 2) return;

  let current = 0;
  const displayTime = 5000;
  const fadeTime = 2000;
  const zoomDuration = displayTime + fadeTime;

  const startTime = performance.now();

  function updateZoom(now) {
    const elapsed = (now - startTime) % zoomDuration;
    const progress = elapsed / zoomDuration;

    // Zoom contínuo de 1.000 até 1.055
    const scale = 1 + (0.055 * progress);

    slides.forEach(slide => {
      slide.style.transform = `scale(${scale})`;
    });

    requestAnimationFrame(updateZoom);
  }

  function showSlide(next) {
    const previous = current;
    current = next % slides.length;

    slides[previous].classList.remove("is-active");
    slides[current].classList.add("is-active");

    slides.forEach((slide, index) => {
      const active = index === current;

      if (active) {
        slide.removeAttribute("aria-hidden");
        slide.alt = "Dra. Larissa Lima";
      } else {
        slide.setAttribute("aria-hidden", "true");
        slide.alt = "";
      }
    });
  }

  showSlide(0);
  requestAnimationFrame(updateZoom);

  window.setInterval(
    () => showSlide(current + 1),
    displayTime + fadeTime
  );
})();
