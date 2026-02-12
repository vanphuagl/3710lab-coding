"use strict";

// ===== CONFIGURATION =====
const CONFIG = {
  isMobile: window.matchMedia("(max-width: 1024px)"),
  fadeoutDelay: 1500,
  videoTimeout: 3000,
};

// ===== GSAP SETUP =====
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
});

// ===== INIT LENIS =====
const wrapper = document.querySelector("[data-lenis-wrapper]");
const lenis = new Lenis({
  ...(wrapper && { wrapper }),
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

// integrate with GSAP
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ===== UTILITIES =====
const stopScroll = () => { lenis.stop(); document.body.style.overflow = "hidden"; };
const startScroll = () => { lenis.start(); document.body.style.overflow = ""; };

// ===== INIT APP HEIGHT =====
const initAppHeight = () => {
  const doc = document.documentElement;
  doc.style.setProperty("--app-height", `${doc.clientHeight}px`);
  doc.style.setProperty(
    "--menu-height",
    `${Math.max(doc.clientHeight, window.innerHeight || 0)}px`,
  );
};

// ===== INIT PAGE NAVIGATION =====
const initPageNavigation = () => {
  document.addEventListener("click", (evt) => {
    const link = evt.target.closest(
      'a:not([href^="#"]):not([target]):not([href^="mailto"]):not([href^="tel"])'
    );
    if (!link) return;

    evt.preventDefault();
    const url = link.getAttribute("href");
    if (!url) return;

    const hashIndex = url.indexOf("#");
    const hash = hashIndex !== -1 ? url.substring(hashIndex) : "";

    if (hash && hash !== "#") {
      try {
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
      } catch (err) {
        console.error("Invalid hash selector:", hash, err);
      }
    }

    document.body.classList.add("fadeout");
    setTimeout(() => window.location = url, CONFIG.fadeoutDelay);
  });
};

// ===== INIT LOADING =====
const initLoading = () => {
  const [loading, loadingContent] = [
    document.querySelector("[data-loading]"),
    document.querySelector("[data-loading-content]"),
  ];
  if (!loading || !loadingContent) return;

  if (sessionStorage.getItem("opening-displayed") === "true") {
    loading.remove();
    return;
  }

  stopScroll();
  gsap.timeline()
    .to(loadingContent, { opacity: 1, duration: 2, ease: "power2.out", delay: 1 })
    .to(loadingContent, { opacity: 0, duration: 2, ease: "power2.out", delay: 1 })
    .to(loading, {
      opacity: 0,
      duration: 2,
      ease: "power2.out",
      delay: 1,
      onComplete: () => {
        startScroll();
        loading.remove();
        sessionStorage.setItem("opening-displayed", "true");
      },
    });
};

// ===== INIT POPUP =====
const initPopup = () => {
  const [popups, togglers] = [
    document.querySelectorAll("[data-popup]"),
    document.querySelectorAll("[data-popup-toggler]"),
  ]
  if (!popups.length || !togglers.length) return;

  const openPopup = (popup) => {
    popup.classList.add("--active");
    stopScroll();

    gsap.timeline()
      .to("[data-popup-container]", { y: 0, duration: 0.8, ease: "power3.out" })
      .fromTo(
        "[data-popup-content]",
        { opacity: 0, filter: "blur(10px)", y: 20 },
        { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.6, ease: "power2.out" },
        "-=0.4"
      );
  };

  const closePopup = (popup) => {
    gsap.timeline({
      onComplete: () => {
        popup.classList.remove("--active");
        startScroll();
      }
    })
      .to("[data-popup-content]", {
        opacity: 0,
        filter: "blur(10px)",
        y: 20,
        duration: 0.3,
        ease: "power2.in",
      })
      .to("[data-popup-container]", { y: "100%", duration: 0.6, ease: "power3.in" }, "-=0.1");
  };

  // event handlers
  togglers.forEach((toggler) => {
    toggler.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = toggler.getAttribute("data-popup-toggler");
      const targetPopup = document.querySelector(`[data-popup="${targetId}"]`);
      if (targetPopup) openPopup(targetPopup);
    });
  });

  popups.forEach((popup) => {
    const closeBtn = popup.querySelector("[data-popup-close]");
    if (closeBtn) closeBtn.addEventListener("click", () => closePopup(popup));

    popup.addEventListener("click", (e) => {
      if (e.target === popup) closePopup(popup);
    });
  });

  // ESC handler
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activePopup = document.querySelector("[data-popup].--active");
      if (activePopup) closePopup(activePopup);
    }
  });
};

// ===== INIT DETAIL PAGE =====
const initDetailPage = () => {
  const detailSection = document.querySelector("[data-section-detail]");
  if (!detailSection) return;

  stopScroll();
  gsap.to(detailSection, {
    opacity: 1,
    duration: 2,
    delay: 2,
    ease: "power2.out",
    onComplete: startScroll,
  });
};

// ===== INIT MENU =====
const initMenu = () => {
  const [menu, menuTogglers, menuColors] = [
    document.querySelector("[data-menu]"),
    document.querySelectorAll("[data-menu-toggler]"),
    document.querySelectorAll("[data-menu-color]")
  ]
  if (!menu || !menuTogglers.length) return;

  const toggleMenu = () => {
    const isOpen = menu.classList.contains("--show");
    menu.classList.toggle("--show");
    menuTogglers[0].innerText = isOpen ? "Menu" : "Close";

    document.body.style.overflow = isOpen ? "" : "hidden";
    menuColors.forEach((item) => item.classList.toggle("--color", !isOpen));
  };

  menuTogglers.forEach((btn) => btn.addEventListener("click", toggleMenu));
};

// ===== HANDLE BACKGROUND VIDEO =====
const handleBackgroundVideo = () => {
  const [video, source] = [
    document.querySelector("[data-video]"),
    document.getElementById("video-source")
  ]
  if (!video || !source) return;

  const updateVideo = () => {
    if (CONFIG.isMobile.matches) {
      video.poster = "/assets/images/video-poster-sp.webp";
      source.src = "/assets/videos/yurage02_tate_sp.webm";
    } else {
      video.poster = "/assets/images/video-poster.webp";
      source.src = "/assets/videos/yuriage01_yoko_pc.webm";
    }
    video.load();
  };

  updateVideo();
  CONFIG.isMobile.addEventListener("change", updateVideo);
};

// ===== WAIT FOR VIDEO =====
const waitForVideos = () => {
  const video = document.querySelector("[data-video]");
  if (!video) return Promise.resolve();
  if (video.readyState >= 3) return Promise.resolve();

  return new Promise((resolve) => {
    video.addEventListener("canplaythrough", resolve, { once: true });
    setTimeout(resolve, CONFIG.videoTimeout);
  });
};

// ===== HANDLE VIDEO SOUND =====
const handleSoundVideo = () => {
  const [video, soundOnBtn, soundOffBtn] = [
    document.querySelector("[data-video]"),
    document.querySelector("[data-sound-on]"),
    document.querySelector("[data-sound-off]")
  ]
  if (!video || !soundOnBtn || !soundOffBtn) return;

  const toggleSound = (isMuted) => {
    video.muted = !isMuted;
    soundOnBtn.classList.toggle("--active", isMuted);
    soundOffBtn.classList.toggle("--active", !isMuted);
  };

  soundOnBtn.addEventListener("click", () => toggleSound(true));
  soundOffBtn.addEventListener("click", () => toggleSound(false));
};

// ===== HANDLE SIZE TEXT =====
const handleSizeText = () => {
  const [sizeDefaultBtn, sizeLargeBtn] = [
    document.querySelector("[data-size-default]"),
    document.querySelector("[data-size-large]")
  ]
  if (!sizeDefaultBtn || !sizeLargeBtn) return;

  const toggleSize = (isLarge) => {
    document.documentElement.style.setProperty("--font-scale", isLarge ? 1.3 : 1);
    sizeLargeBtn.classList.toggle("--active", isLarge);
    sizeDefaultBtn.classList.toggle("--active", !isLarge);

    requestAnimationFrame(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    });
  };

  sizeLargeBtn.addEventListener("click", () => toggleSize(true));
  sizeDefaultBtn.addEventListener("click", () => toggleSize(false));
};

// ===== HANDLE BACK TO TOP =====
const handleBackToTop = () => {
  const backBtn = document.querySelector("[data-control-back]");
  if (!backBtn) return;

  backBtn.addEventListener("click", () => {
    lenis.scrollTo(0, {
      duration: 1.5,
      easing: (t) => t * t * t * (t * (t * 6 - 15) + 10),
      force: true,
    });
  });
};

// ===== INIT SCROLL TRIGGER =====
const initScrollTrigger = () => {
  const [video, videoOverlay, triggerTop, triggerBottom, triggerBack, triggerLine, triggerSize] = [
    document.querySelector("[data-video]"),
    document.querySelector("[data-video-overlay]"),
    document.querySelector("[data-offsettop]"),
    document.querySelector("[data-offsetbottom]"),
    document.querySelector("[data-control-back]"),
    document.querySelector("[data-control-line]"),
    document.querySelector("[data-control-size]"),
  ]
  if (!video || !videoOverlay || !triggerTop || !triggerBottom) return;

  // top trigger
  gsap.timeline({
    scrollTrigger: {
      trigger: triggerTop,
      scroller: wrapper,
      start: "bottom top+=15%",
      end: "bottom top+=15%",
      toggleActions: "play none none reverse",
    },
  })
    .to(video, { opacity: 0.15, duration: 0.5 }, 0)
    .to(videoOverlay, { backgroundColor: "#fff", duration: 0.5 }, 0)
    .to(":root", { "--text-color": "#000", duration: 0.5 }, 0)
    .to(triggerLine, { opacity: 0, filter: "blur(10px)", duration: 0.3, ease: "power2.in" }, 0)
    .to(triggerSize, {
      opacity: 1,
      filter: "blur(0px)",
      pointerEvents: "auto",
      duration: 0.6,
      ease: "power2.out",
      delay: 0.2,
    }, 0);

  // bottom trigger
  gsap.timeline({
    scrollTrigger: {
      trigger: triggerBottom,
      scroller: wrapper,
      start: "bottom top+=15%",
      end: "bottom top+=15%",
      toggleActions: "play none none reverse",
    },
  })
    .to(video, { opacity: 1, duration: 0.5 }, 0)
    .to(videoOverlay, { backgroundColor: "#000", duration: 0.5 }, 0)
    .to(":root", { "--text-color": "#fff", duration: 0.5 }, 0)
    .to(triggerSize, {
      opacity: 0,
      filter: "blur(10px)",
      pointerEvents: "none",
      duration: 0.3,
      ease: "power2.in",
    }, 0)
    .to(triggerBack, {
      opacity: 1,
      filter: "blur(0px)",
      pointerEvents: "auto",
      duration: 0.6,
      ease: "power2.out",
      delay: 0.2,
    }, 0);
};

// ===== INITIALIZATION =====
const init = () => {
  history.scrollRestoration = "manual";

  // # setup video and wait for load
  handleBackgroundVideo();
  waitForVideos().then(() => {
    document.body.classList.remove("fadeout");
  });

  // # initialize UI components
  initAppHeight();
  initDetailPage();
  initLoading();
  initPopup();
  initMenu();
  initScrollTrigger();
  handleSoundVideo();
  handleSizeText();
  handleBackToTop();
  initPageNavigation();
};

// ### ===== EVENT LISTENER ===== ###
window.addEventListener("resize", initAppHeight);
window.addEventListener("DOMContentLoaded", init);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    document.body.classList.remove("fadeout");
  }
});