"use strict";

// ===== globals =====
const isMobile = window.matchMedia("(max-width: 1024px)");
const eventsTrigger = ["pageshow", "scroll"];

// ===== init =====
const init = () => {
  history.scrollRestoration = "manual";
  // # app height
  appHeight();
  // # init loading
  initLoading();
  // # init popup
  initPopup();
};

// ===== lenis =====
const wrapper = document.querySelector("[data-lenis-wrapper]");
const lenis = new Lenis({
  ...(wrapper && {
    wrapper: wrapper,
  }),
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
  mouseMultiplier: 1.0,
  smoothTouch: true,
  touchMultiplier: 1.5,
  infinite: false,
  direction: "vertical",
  gestureDirection: "vertical",
});
const raf = (t) => {
  lenis.raf(t);
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ===== app height =====
const appHeight = () => {
  const doc = document.documentElement;
  const menuH = Math.max(doc.clientHeight, window.innerHeight || 0);

  doc.style.setProperty("--app-height", `${doc.clientHeight}px`);
  doc.style.setProperty("--menu-height", `${menuH}px`);
};
window.addEventListener("resize", appHeight);

// ===== href fadeout =====
const handleLinkClick = (e) => {
  const link = e.target.closest(
    'a:not([href^="#"]):not([target]):not([href^="mailto"]):not([href^="tel"])',
  );

  if (!link) return;
  e.preventDefault();

  document.body.classList.add("fadeout");
  setTimeout(() => {
    window.location.href = link.href;
  }, 1100);
};
document.addEventListener("click", handleLinkClick);

// ===== lazy load =====
const ll = new LazyLoad({
  threshold: 100,
  elements_selector: ".lazy",
});

// ===== init loading =====
const initLoading = () => {
  const [loading, loadingContent] = [
    document.querySelector("[data-loading]"),
    document.querySelector("[data-loading-content]"),
  ];

  if (!loading) return;

  if (sessionStorage.getItem("opening-displayed") === "true") {
    loading.remove();
  } else {
    lenis.stop();
    const tl = gsap.timeline({});
    tl.to(loadingContent, {
      opacity: 1,
      duration: 2,
      ease: "power2.out",
      delay: 1,
    })
      .to(loadingContent, {
        opacity: 0,
        duration: 2,
        ease: "power2.out",
        delay: 1,
      })
      .to(loading, {
        opacity: 0,
        duration: 2,
        ease: "power2.out",
        delay: 1,
        onComplete: () => {
          lenis.start();
          loading.remove();
          sessionStorage.setItem("opening-displayed", true);
        },
      });
  }
};

// ===== toggle popup introduction =====
const initPopup = () => {
  const [popups, togglers] = [
    document.querySelectorAll("[data-popup]"),
    document.querySelectorAll("[data-popup-toggler]"),
  ];

  if (!popups.length || !togglers.length) return;

  // open popup
  const openPopup = (popup) => {
    popup.classList.add("--active");
    lenis.stop();
    const tl = gsap.timeline();

    tl.to("[data-popup-container]", {
      y: 0,
      duration: 0.8,
      ease: "power3.out",
    });
    tl.fromTo(
      "[data-popup-content]",
      {
        opacity: 0,
        filter: "blur(10px)",
        y: 20,
      },
      {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        duration: 0.6,
        ease: "power2.out",
      },
      "-=0.4",
    );
  };

  // close popup
  const closePopup = (popup) => {
    const tl = gsap.timeline({
      onComplete: () => {
        popup.classList.remove("--active");
        lenis.start();
      },
    });

    tl.to("[data-popup-content]", {
      opacity: 0,
      filter: "blur(10px)",
      y: 20,
      duration: 0.3,
      stagger: 0.05,
      ease: "power2.in",
    }).to(
      "[data-popup-container]",
      {
        y: "100%",
        duration: 0.6,
        ease: "power3.in",
      },
      "-=0.1",
    );
  };

  // trigger popup
  togglers.forEach((toggler) => {
    toggler.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = toggler.getAttribute("data-popup-toggler");
      const targetPopup = document.querySelector(`[data-popup="${targetId}"]`);
      if (!targetPopup) return;
      openPopup(targetPopup);
    });
  });

  // events close popup
  popups.forEach((popup) => {
    const closeBtn = popup.querySelector("[data-popup-close]");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => closePopup(popup));
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && popup.classList.contains("--active")) {
        closePopup(popup);
      }
    });

    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        closePopup(popup);
      }
    });
  });
};

// ===== menu =====
const [menu, menuTogglers] = [
  document.querySelector("[data-menu]"),
  document.querySelectorAll("[data-menu-toggler]"),
];

const toggleMenu = () => {
  menu.classList.toggle("--show", !menu.classList.contains("--show"));
};
menuTogglers.forEach((btn) => btn.addEventListener("click", toggleMenu));

// ===== handle video =====
const video = document.querySelector("[data-video]");
const soundOnBtn = document.querySelector("[data-sound-on]");
const soundOffBtn = document.querySelector("[data-sound-off]");

const toggleSound = (isMuted) => {
  video.muted = isMuted;
  soundOnBtn.classList.toggle("--active", !isMuted);
  soundOffBtn.classList.toggle("--active", isMuted);
};
soundOnBtn?.addEventListener("click", () => toggleSound(false));
soundOffBtn?.addEventListener("click", () => toggleSound(true));

// ### ===== DOMCONTENTLOADED ===== ###
window.addEventListener("DOMContentLoaded", init);
