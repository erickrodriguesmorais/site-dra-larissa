(() => {
  const pages = [
    "index.html",
    "sobre.html",
    "preco.html",
    "depoimentos.html",
    "contato.html"
  ];

  const current = (
    window.location.pathname.split("/").pop() || "index.html"
  ).toLowerCase();

  const currentIndex = pages.indexOf(current);

  if (currentIndex === -1) return;

  // Funciona apenas no desktop com mouse/trackpad.
  const desktopMouse = window.matchMedia(
    "(min-width: 769px) and (pointer: fine)"
  ).matches;

  if (!desktopMouse) return;

  let locked = false;

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;

      if (Math.abs(event.deltaY) < 18) return;

      if (locked) {
        event.preventDefault();
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0 || nextIndex >= pages.length) return;

      event.preventDefault();

      locked = true;

      setTimeout(() => {
        window.location.href = pages[nextIndex];
      }, 120);
    },
    { passive: false }
  );
})();
