(() => {
  const views = {
    home: document.getElementById("view-home"),
    ahp: document.getElementById("view-ahp"),
    about: document.getElementById("view-about"),
    contact: document.getElementById("view-contact"),
    projects: document.getElementById("view-projects"),
    profile: document.getElementById("view-profile"),
  };

  const navLinks = {
    home: document.getElementById("nav-home"),
    ahp: document.getElementById("nav-ahp"),
    about: document.getElementById("nav-about"),
    contact: document.getElementById("nav-contact"),
  };

  const activeClasses = [
    "text-blue-700",
    "dark:text-blue-400",
    "border-b-2",
    "border-blue-700",
    "dark:border-blue-400",
    "pb-1",
  ];
  const inactiveClasses = [
    "text-slate-600",
    "dark:text-slate-400",
    "hover:text-slate-900",
    "dark:hover:text-slate-100",
  ];

  let activeView = "home";

  function switchView(target) {
    if (!views[target] || target === activeView) return;

    Object.keys(navLinks).forEach((key) => {
      const link = navLinks[key];
      if (!link) return;
      if (key === target) {
        link.classList.remove(...inactiveClasses);
        link.classList.add(...activeClasses);
      } else {
        link.classList.remove(...activeClasses);
        link.classList.add(...inactiveClasses);
      }
    });

    const currentEl = views[activeView];
    const targetEl = views[target];
    if (!currentEl || !targetEl) return;

    currentEl.classList.remove("opacity-100");
    currentEl.classList.add("opacity-0");

    setTimeout(() => {
      currentEl.classList.remove("block");
      currentEl.classList.add("hidden");

      targetEl.classList.remove("hidden");
      targetEl.classList.add("block");

      void targetEl.offsetWidth;

      targetEl.classList.remove("opacity-0");
      targetEl.classList.add("opacity-100");

      activeView = target;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 200);
  }

  window.switchView = switchView;

  navLinks.home?.addEventListener("click", () => switchView("home"));
  navLinks.ahp?.addEventListener("click", () => switchView("ahp"));
  navLinks.about?.addEventListener("click", () => switchView("about"));
  navLinks.contact?.addEventListener("click", () => switchView("contact"));

  document
    .getElementById("btnOpenNewProject")
    ?.addEventListener("click", () => switchView("ahp"));
})();
