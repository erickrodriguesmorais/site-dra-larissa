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

  // Destaca automaticamente a seção que está na tela.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { threshold: 0.55 });

    sections.forEach(section => observer.observe(section));
  }
})();
