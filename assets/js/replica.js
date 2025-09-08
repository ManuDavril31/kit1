// Réplica JS: cuenta regresiva simple y año dinámico
(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Define un objetivo de 24h desde la carga
  const target = Date.now() + 24 * 60 * 60 * 1000;
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
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
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
          sticky.setAttribute("target", "_blank");
          sticky.setAttribute("rel", "noopener");
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
    if (els.h) els.h.textContent = String(h).padStart(2, "0");
    if (els.m) els.m.textContent = String(m).padStart(2, "0");
    if (els.s) els.s.textContent = String(s).padStart(2, "0");
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

// Autoplay mejorado sin forzar reflow ni scrollIntoView
// Usa IntersectionObserver para reproducir cuando el video sea visible.
(function () {
  const video = document.querySelector(".hero__video video");
  if (!video) return;
  video.setAttribute("playsinline", "");
  // Intento diferido (por si el usuario ya está arriba del todo)
  function attemptPlay() {
    const p = video.play();
    if (p && typeof p.then === "function") {
      p.catch(() => showManualButton());
    }
  }
  function showManualButton() {
    if (video.dataset.manualBtn) return;
    video.dataset.manualBtn = "1";
    const btn = document.createElement("button");
    btn.textContent = "▶ Reproducir video";
    btn.style.cssText =
      "margin-top:.75rem;background:#ff6d4f;color:#fff;border:none;border-radius:30px;padding:.7rem 1.2rem;font-weight:600;cursor:pointer;font-size:.8rem;box-shadow:0 4px 14px -6px rgba(0,0,0,.25);";
    btn.addEventListener("click", () => {
      video.play();
      btn.remove();
    });
    const fig = video.closest(".hero__video");
    if (fig) fig.appendChild(btn);
  }
  // Observer evita medir manualmente layout (reduce riesgo de forced reflow largo)
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            attemptPlay();
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(video);
  } else {
    // Fallback simple
    setTimeout(attemptPlay, 1500);
  }
})();
