"use strict";

// ===== globals =====
const isMobile = window.matchMedia("(max-width: 1024px)");
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
});

// ===== init =====
const init = () => {
  ScrollTrigger.refresh();
  history.scrollRestoration = "manual";
  // # wait for videos
  handleBackgroundVideo();
  waitForVideos().then(() => {
    document.body.classList.remove("fadeout");
  });
  // # app height
  appHeight();
  // # init detail pag
  initDetailPage();
  // # init loading
  initLoading();
  // # init popup
  initPopup();
  // # scroll trigger
  handleScrollTrigger();
};

// ===== handle background video responsive =====
const handleBackgroundVideo = () => {
  const [video, source] = [
    document.getElementById("bg-video"),
    document.getElementById("video-source"),
  ];

  if (!video || !source) return;

  const updateVideo = () => {
    if (isMobile.matches) {
      video.poster = "/assets/images/video-poster-sp.webp";
      source.src = "/assets/videos/yurage02_tate_sp.webm";
    } else {
      video.poster = "/assets/images/video-poster.webp";
      source.src = "/assets/videos/yuriage01_yoko_pc.webm";
    }
    video.load();
  };
  updateVideo();
  isMobile.addEventListener("change", updateVideo);
};

// ===== wait for videos =====
const waitForVideos = () => {
  const videos = document.querySelectorAll("[data-video]");
  if (!videos.length) return Promise.resolve();

  const videoPromises = Array.from(videos).map((video) => {
    if (video.readyState >= 3) return Promise.resolve();

    return new Promise((resolve) => {
      video.addEventListener("canplaythrough", resolve, { once: true });
      setTimeout(resolve, 3000);
    });
  });

  return Promise.all(videoPromises);
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
document.addEventListener("click", (evt) => {
  const link = evt.target.closest(
    'a:not([href^="#"]):not([target]):not([href^="mailto"]):not([href^="tel"])',
  );
  if (!link) return;

  evt.preventDefault();
  const url = link.getAttribute("href");

  if (url && url !== "") {
    const idx = url.indexOf("#");
    const hash = idx !== -1 ? url.substring(idx) : "";

    if (hash && hash !== "#") {
      try {
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          return false;
        }
      } catch (err) {
        console.error("Invalid hash selector:", hash, err);
      }
    }

    document.body.classList.add("fadeout");
    setTimeout(function () {
      window.location = url;
    }, 1500);
  }

  return false;
});

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

// ==== go to page ====
const initDetailPage = () => {
  const detailSection = document.querySelector("[data-section-detail]");
  if (!detailSection) return;
  document.body.style.overflow = "hidden";

  gsap.to(detailSection, {
    opacity: 1,
    duration: 2,
    delay: 2,
    ease: "power2.out",
    onComplete: () => {
      document.body.style.overflow = "";
    },
  });
};

// ===== menu =====
const [menu, menuTogglers, menuColors] = [
  document.querySelector("[data-menu]"),
  document.querySelectorAll("[data-menu-toggler]"),
  document.querySelectorAll("[data-menu-color]"),
];

const toggleMenu = () => {
  const isOpen = menu.classList.contains("--show");
  menu.classList.toggle("--show", !isOpen);
  menuTogglers[0].innerText = isOpen ? "Menu" : "Close";

  if (isOpen) {
    document.body.style.overflow = "";
  } else {
    document.body.style.overflow = "hidden";
  }

  if (!menuColors) return;
  menuColors.forEach((item) => item.classList.toggle("--color", !isOpen));
};
menuTogglers?.forEach((btn) => btn.addEventListener("click", toggleMenu));

// ===== handle video =====
const [videos, videoOverlay, soundOnBtn, soundOffBtn] = [
  document.querySelectorAll("[data-video]"),
  document.querySelector("[data-video-overlay]"),
  document.querySelector("[data-sound-on]"),
  document.querySelector("[data-sound-off]"),
];

const toggleSound = (isMuted) => {
  videos.forEach((item) => {
    item.muted = !isMuted;
  });
  soundOnBtn.classList.toggle("--active", isMuted);
  soundOffBtn.classList.toggle("--active", !isMuted);
};
soundOnBtn?.addEventListener("click", () => toggleSound(true));
soundOffBtn?.addEventListener("click", () => toggleSound(false));

// ===== handle size text =====
const [sizeDefaultBtn, sizeLargebtn] = [
  document.querySelector("[data-size-default]"),
  document.querySelector("[data-size-large]"),
];

const toggleSize = (isLarge) => {
  document.documentElement.style.setProperty("--font-scale", isLarge ? 1.3 : 1);
  sizeLargebtn.classList.toggle("--active", isLarge);
  sizeDefaultBtn.classList.toggle("--active", !isLarge);

  requestAnimationFrame(() => {
    lenis?.resize();
    ScrollTrigger.refresh();
  });
};
sizeLargebtn?.addEventListener("click", () => toggleSize(true));
sizeDefaultBtn?.addEventListener("click", () => toggleSize(false));

// ===== back to top =====
const backtotop = document.querySelector("[data-control-back]");
const handleBacktoTop = function () {
  lenis.scrollTo(0, {
    duration: 1.5,
    easing: (t) => t * t * t * (t * (t * 6 - 15) + 10),
    force: true,
  });
};
backtotop?.addEventListener("click", handleBacktoTop);

// ===== scroll trigger =====
const handleScrollTrigger = () => {
  const triggerTop = document.querySelector("[data-offsettop]");
  const triggerBottom = document.querySelector("[data-offsetbottom]");

  if (!videos || !videoOverlay || !triggerTop || !triggerBottom) return;
  gsap
    .timeline({
      scrollTrigger: {
        trigger: triggerTop,
        scroller: wrapper,
        start: "bottom top+=15%",
        end: "bottom top+=15%",
        toggleActions: "play none none reverse",
        markers: false,
      },
    })
    .to(videos, { opacity: 0.15, duration: 0.5 }, 0)
    .to(videoOverlay, { backgroundColor: "#fff", duration: 0.5 }, 0)
    .to(":root", { "--text-color": "#000", duration: 0.5 }, 0)
    .to(
      "[data-control-line]",
      { opacity: 0, filter: "blur(10px)", duration: 0.3, ease: "power2.in" },
      0,
    )
    .to(
      "[data-control-size]",
      {
        opacity: 1,
        filter: "blur(0px)",
        pointerEvents: "auto",
        duration: 0.6,
        ease: "power2.out",
        delay: 0.2,
      },
      0,
    );

  gsap
    .timeline({
      scrollTrigger: {
        trigger: triggerBottom,
        scroller: wrapper,
        start: "bottom top+=15%",
        end: "bottom top+=15%",
        toggleActions: "play none none reverse",
        markers: false,
      },
    })
    .to(videos, { opacity: 1, duration: 0.5 }, 0)
    .to(videoOverlay, { backgroundColor: "#000", duration: 0.5 }, 0)
    .to(":root", { "--text-color": "#fff", duration: 0.5 }, 0)
    .to(
      "[data-control-size]",
      {
        opacity: 0,
        filter: "blur(10px)",
        pointerEvents: "none",
        duration: 0.3,
        ease: "power2.in",
      },
      0,
    )
    .to(
      backtotop,
      {
        opacity: 1,
        filter: "blur(0px)",
        pointerEvents: "auto",
        duration: 0.6,
        ease: "power2.out",
        delay: 0.2,
      },
      0,
    );
};

// ### ===== DOMCONTENTLOADED ===== ###
window.addEventListener("DOMContentLoaded", init);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    document.body.classList.remove("fadeout");
  }
});
