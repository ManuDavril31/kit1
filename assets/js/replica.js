// Réplica JS: cuenta regresiva simple y año dinámico
(function () {
  // Detección simple de navegadores in‑app (Facebook, Instagram, TikTok, etc.)
  const isInApp =
    /FBAN|FBAV|Instagram|Line|Twitter|Telegram|WhatsApp|TikTok/i.test(
      navigator.userAgent || ""
    );

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Define un objetivo de 10 minutos desde la carga
  const target = Date.now() + 10 * 60 * 1000;
  const els = {
    d: document.getElementById("cd-d"),
    h: document.getElementById("cd-h"),
    m: document.getElementById("cd-m"),
    s: document.getElementById("cd-s"),
  };
  // Centralización del enlace: se carga desde assets/config.json
  // Fallback por si no carga el JSON
  window.PURCHASE_URL =
    window.PURCHASE_URL || "https://pay.hotmart.com/Y86835362H?checkoutMode=10";

  function applyPurchaseUrl(url) {
    window.PURCHASE_URL = url || window.PURCHASE_URL;
    const selectors = [
      "a[data-cta]",
      "a.btn[href*='pay.hotmart.com']",
      "a[href*='checkoutMode=10']",
    ];
    const anchors = document.querySelectorAll(selectors.join(","));
    anchors.forEach((a) => {
      a.setAttribute("href", window.PURCHASE_URL);
      // En navegadores in‑app abrir en la misma vista para evitar prompts de "salir de la app".
      if (isInApp) {
        a.setAttribute("target", "_self");
        a.removeAttribute("rel");
      } else {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
      }
    });
    // Actualiza también el JSON-LD si existe
    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      try {
        const data = JSON.parse(ld.textContent);
        if (data && data.offers) {
          data.offers.url = window.PURCHASE_URL;
          ld.textContent = JSON.stringify(data);
        }
      } catch (_) {}
    }
  }

  // Formateo y aplicación de precios desde assets/config.json
  function formatMoney({
    symbol,
    code,
    amount,
    spaceBetweenSymbol,
    showCents,
  }) {
    const n = parseFloat(amount);
    if (!isFinite(n)) return "";
    const num = showCents ? n.toFixed(2) : String(Math.round(n));
    const sym = symbol || "";
    const symPart = sym ? (spaceBetweenSymbol ? sym + " " : sym) : "";
    const codePart = code ? " " + code : "";
    return `${symPart}${num}${codePart}`;
  }

  function applyPricing(pr) {
    if (!pr || typeof pr !== "object") return;
    const common = {
      symbol: pr.currencySymbol,
      code: pr.currencyCode,
      spaceBetweenSymbol: !!pr.spaceBetweenSymbol,
    };

    // Oferta: precio normal y actual
    const oldWrap = document.querySelector(".offer .offer__label");
    const oldEl = document.querySelector(".offer .old-price");
    const newEl = document.querySelector(".offer .new-price");
    if (newEl) {
      newEl.textContent = formatMoney({
        ...common,
        amount: pr.current,
        showCents: !!pr.showCents,
      });
    }
    if (oldEl) {
      const oldNum = parseFloat(pr.old);
      const curNum = parseFloat(pr.current);
      if (!isFinite(oldNum) || !isFinite(curNum) || oldNum <= curNum) {
        // Si no hay precio anterior válido o no es mayor, ocultamos la línea "PRECIO NORMAL"
        if (oldWrap) oldWrap.style.display = "none";
      } else {
        oldEl.textContent = formatMoney({
          ...common,
          amount: pr.old,
          showCents: !!pr.showCents,
        });
        if (oldWrap) oldWrap.style.display = "";
      }
    }

    // Cálculo y despliegue de % descuento (si aplica)
    const oldNum = parseFloat(pr.old);
    const curNum = parseFloat(pr.current);
    if (isFinite(oldNum) && isFinite(curNum) && oldNum > curNum) {
      const pct = Math.round(((oldNum - curNum) / oldNum) * 100);
      const badge = document.getElementById("discount-badge");
      if (badge) {
        badge.textContent = `-${pct}% HOY`;
        badge.hidden = false;
      }
      const heroDiscount = document.getElementById("hero-discount");
      if (heroDiscount) {
        heroDiscount.textContent = `-${pct}%`;
        heroDiscount.hidden = false;
      }
    }

    // Snippet precio en hero
    const heroPrice = document.getElementById("hero-price");
    if (heroPrice) {
      heroPrice.textContent = formatMoney({
        ...common,
        amount: pr.current,
        showCents: !!pr.showCents,
      });
      heroPrice.hidden = false;
    }

    // Badge inline en sticky note
    const stickyNote = document.querySelector(".sticky-cta__note");
    if (
      stickyNote &&
      !stickyNote.querySelector(".badge-inline") &&
      pr.current
    ) {
      const span = document.createElement("strong");
      span.className = "badge-inline";
      span.textContent = "OFERTA";
      stickyNote.appendChild(span);
    }

    // Sticky CTA: versión compacta opcional (sin decimales si stickyCompact)
    const stickyStrong = document.querySelector(
      "#sticky-cta .sticky-cta__label strong"
    );
    if (stickyStrong) {
      const stickyPrice = formatMoney({
        ...common,
        amount: pr.current,
        showCents: pr.stickyCompact ? false : !!pr.showCents,
      });
      stickyStrong.textContent = stickyPrice;
    }

    // Actualiza JSON-LD: price y currency
    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      try {
        const data = JSON.parse(ld.textContent);
        if (data && data.offers) {
          if (pr.current) data.offers.price = String(pr.current);
          if (pr.currencyCode) data.offers.priceCurrency = pr.currencyCode;
          ld.textContent = JSON.stringify(data);
        }
      } catch (_) {}
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetch("assets/config.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        const url = cfg && (cfg.purchaseUrl || cfg.PURCHASE_URL);
        applyPurchaseUrl(url);
        if (cfg && cfg.pricing) applyPricing(cfg.pricing);
      })
      .catch(() => applyPurchaseUrl())
      .finally(() => {
        // También engancha la barra sticky si existe (por si no tenía data-cta)
        const sticky = document.querySelector("#sticky-cta a.btn");
        if (sticky && !sticky.getAttribute("href")) {
          sticky.setAttribute("href", window.PURCHASE_URL);
          if (isInApp) {
            sticky.setAttribute("target", "_self");
            sticky.removeAttribute("rel");
          } else {
            sticky.setAttribute("target", "_blank");
            sticky.setAttribute("rel", "noopener");
          }
        }

        // Ajuste de enlaces PDF en in‑app: abrir en la misma vista y sin atributo download para evitar descargas automáticas.
        if (isInApp) {
          document.querySelectorAll("a[href$='.pdf']").forEach((a) => {
            a.setAttribute("target", "_self");
            a.removeAttribute("download");
          });
        }
      });
  });
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      Object.values(els).forEach((e) => e && (e.textContent = "00"));
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;
    const s = Math.floor(diff / 1000) % 60;
    if (els.d) els.d.textContent = String(d).padStart(2, "0");
    // Solicitud: mantener HORAS en 00, sin mostrar valores como 23 al inicio
    if (els.h) els.h.textContent = "00";
    if (els.m) els.m.textContent = String(m).padStart(2, "0");
    if (els.s) els.s.textContent = String(s).padStart(2, "0");
    // Estado de escasez visual cuando < 5min
    const cdEl = document.querySelector(".countdown");
    if (cdEl) {
      if (diff < 5 * 60 * 1000) cdEl.classList.add("scarcity");
      else cdEl.classList.remove("scarcity");
    }
    setTimeout(tick, 1000);
  }
  tick();
})();

// Slider móviles simple
(function () {
  const slider = document.querySelector(".mobiles__slider");
  if (!slider) return;
  const track = slider.querySelector(".mobiles__track");
  const prev = slider.querySelector(".mob-btn.prev");
  const next = slider.querySelector(".mob-btn.next");
  function scrollByCard(dir) {
    const phone = track.querySelector(".phone");
    if (!phone) return;
    const width = phone.getBoundingClientRect().width + 16;
    track.scrollBy({ left: dir * width, behavior: "smooth" });
  }
  prev.addEventListener("click", () => scrollByCard(-1));
  next.addEventListener("click", () => scrollByCard(1));
})();

// Lead form (simulado)
(function () {
  const form = document.getElementById("lead-form");
  if (!form) return;
  const email = document.getElementById("lead-email");
  const msg = document.getElementById("lead-msg");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = (email.value || "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val)) {
      msg.textContent = "Ingresa un correo válido";
      msg.className = "form-msg err";
      return;
    }
    // Simulación de envío - aquí integrarías tu API o servicio
    msg.textContent = "¡Guía enviada! Revisa tu bandeja (o SPAM).";
    msg.className = "form-msg ok";
    form.reset();
    window.dispatchEvent(
      new CustomEvent("lead-submitted", { detail: { email: val } })
    );
  });
})();

// Sticky CTA (aparece tras scroll)
(function () {
  const bar = document.getElementById("sticky-cta");
  if (!bar) return;
  let shown = false;
  function onScroll() {
    if (window.scrollY > 1200 && !shown) {
      bar.classList.add("show");
      shown = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();

// Tracking ligero (console)
(function () {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cta]");
    if (!btn) return;
    const id = btn.getAttribute("data-cta");
    console.log("[CTA]", id, "click");
    window.dispatchEvent(new CustomEvent("cta-click", { detail: { id } }));
  });
})();

// Embed YouTube en hero con reproducción a los 2s
(function () {
  const container = document.getElementById("yt-hero");
  if (!container) return;
  const vid = container.getAttribute("data-video-id");
  let player;

  function loadYT(cb) {
    if (window.YT && window.YT.Player) return cb();
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      prev && prev();
      cb();
    };
  }

  function createPlayer() {
    player = new YT.Player("yt-hero", {
      width: "100%",
      height: "100%",
      videoId: vid,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: () => {
          setTimeout(() => {
            try {
              player.playVideo();
            } catch (e) {}
          }, 2000);
        },
      },
    });
  }

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    loadYT(createPlayer);
  } else {
    document.addEventListener("DOMContentLoaded", () => loadYT(createPlayer), {
      once: true,
    });
  }
})();
