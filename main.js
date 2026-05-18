(function () {
  "use strict";

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); };
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  // ── Mouse gradient mesh ────────────────────────────────────────────────────
  function initMouseGradient() {
    var tx = 50, ty = 50, mx = 50, my = 50;
    var root = document.documentElement;
    document.addEventListener("mousemove", function (e) {
      tx = (e.clientX / innerWidth) * 100;
      ty = (e.clientY / innerHeight) * 100;
    }, { passive: true });
    function frame() {
      mx += (tx - mx) * 0.055;
      my += (ty - my) * 0.055;
      root.style.setProperty("--mx", mx.toFixed(2) + "%");
      root.style.setProperty("--my", my.toFixed(2) + "%");
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ── Custom cursor ──────────────────────────────────────────────────────────
  function initCursor() {
    var cursor = $("[data-cursor-root]");
    if (!cursor || !fineHover) return;
    document.documentElement.classList.add("has-cursor");
    var ring = $(".cursor-ring", cursor);
    var dot  = $(".cursor-dot",  cursor);
    var tx = 0, ty = 0, rx = 0, ry = 0, firstMove = false;

    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (dot) dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
      if (!firstMove) {
        firstMove = true;
        rx = tx; ry = ty;
        if (ring) ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
        cursor.classList.add("is-ready");
      }
    }, { passive: true });

    (function tick() {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      if (ring) ring.style.transform = "translate3d(" + rx.toFixed(2) + "px," + ry.toFixed(2) + "px,0)";
      requestAnimationFrame(tick);
    })();

    var HOVERABLES = "a, button, .btn, .craft-card, [data-cursor]";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(HOVERABLES)) cursor.classList.add("is-interactive");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(HOVERABLES) && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HOVERABLES))) {
        cursor.classList.remove("is-interactive");
      }
    });
  }

  // ── Nav on scroll ──────────────────────────────────────────────────────────
  function initNav() {
    var nav = $(".nav");
    if (!nav) return;
    function update() { nav.classList.toggle("is-scrolled", scrollY > 60); }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // ── Mobile nav ─────────────────────────────────────────────────────────────
  function initMobileNav() {
    var btn     = $(".nav-hamburger");
    var overlay = $(".nav-mobile");
    if (!btn || !overlay) return;
    var open = false;
    btn.addEventListener("click", function () {
      open = !open;
      overlay.setAttribute("aria-hidden", String(!open));
      btn.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    $$(".nav-mobile-link").forEach(function (link) {
      link.addEventListener("click", function () {
        open = false;
        overlay.setAttribute("aria-hidden", "true");
        btn.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) {
        open = false;
        overlay.setAttribute("aria-hidden", "true");
        btn.classList.remove("is-open");
        document.body.style.overflow = "";
        btn.focus();
      }
    });
  }

  // ── Scroll progress ────────────────────────────────────────────────────────
  function initScrollProgress() {
    var bar = $("[data-scroll-progress]");
    if (!bar) return;
    var raf = null;
    function update() {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
      raf = null;
    }
    window.addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  // ── Scroll reveals ─────────────────────────────────────────────────────────
  function initReveals() {
    var els = $$("[data-reveal]");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    els.forEach(function (el) { io.observe(el); });

    // 6s safety net
    setTimeout(function () {
      $$("[data-reveal]:not(.is-revealed)").forEach(function (el) {
        if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-revealed");
      });
    }, 6000);
  }

  // ── Hero name clip-reveal ──────────────────────────────────────────────────
  function initHeroName() {
    var lines = $$(".name-inner");
    if (!lines.length) return;
    if (window.gsap) {
      gsap.from(lines, {
        y: "105%",
        duration: 1.25,
        stagger: 0.16,
        ease: "expo.out",
        delay: 0.2,
      });
      gsap.to(".hero-kicker, .hero-tagline, .hero-actions, .hero-location", {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.85,
        clearProps: "transform",
      });
    } else {
      // Fallback without GSAP
      lines.forEach(function (el) { el.style.transform = "translateY(0)"; });
      $$(".hero-kicker, .hero-tagline, .hero-actions, .hero-location").forEach(function (el) {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    }
  }

  // ── Hero photo parallax ────────────────────────────────────────────────────
  function initHeroParallax() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var photo = $(".hero-photo");
    if (!photo || window.innerWidth < 960) return;

    gsap.to(photo, {
      yPercent: 14, ease: "none",
      scrollTrigger: {
        trigger: ".hero", start: "top top", end: "bottom top", scrub: true,
      },
    });

    gsap.to(".hero-left", {
      opacity: 0, y: -40, ease: "none",
      scrollTrigger: {
        trigger: ".hero", start: "55% top", end: "bottom top", scrub: .6,
      },
    });
  }

  // ── Count-up stats ─────────────────────────────────────────────────────────
  function initCountUp() {
    $$("[data-count-to]").forEach(function (el) {
      var target = parseFloat(el.dataset.countTo);
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(el);
          if (window.gsap) {
            var obj = { v: 0 };
            gsap.to(obj, {
              v: target, duration: 1.9, ease: "power2.out",
              onUpdate: function () { el.textContent = Math.floor(obj.v).toString(); },
              onComplete: function () { el.textContent = target.toString(); },
            });
          }
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  // ── Tilt on craft cards ────────────────────────────────────────────────────
  function initTilt() {
    if (!fineHover) return;
    $$(".craft-card").forEach(function (card) {
      var MAX = 5;
      var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
      card.classList.add("has-tilt");

      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width  - 0.5;
        var py = (e.clientY - r.top)  / r.height - 0.5;
        tx = -py * MAX; ty = px * MAX;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      card.addEventListener("mouseleave", function () {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
      function loop() {
        cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
        card.style.setProperty("--rx", cx.toFixed(2) + "deg");
        card.style.setProperty("--ry", cy.toFixed(2) + "deg");
        raf = (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05)
          ? requestAnimationFrame(loop) : null;
      }
    });
  }

  // ── Scramble effect on hover (nav logo + contact email) ───────────────────
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  function initScramble() {
    $$("[data-scramble]").forEach(function (el) {
      var original = el.textContent;
      var animating = false;
      el.addEventListener("mouseenter", function () {
        if (animating) return;
        animating = true;
        var chars = original.split("");
        var delays = chars.map(function (_, i) { return 50 + i * 30 + Math.random() * 60; });
        var start = performance.now();
        function tick(now) {
          var elapsed = now - start;
          el.textContent = chars.map(function (c, i) {
            if (c === " " || c === "." || c === "@") return c;
            if (elapsed < delays[i]) return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            return c;
          }).join("");
          if (chars.some(function (c, i) { return c !== " " && c !== "." && c !== "@" && elapsed < delays[i]; })) {
            requestAnimationFrame(tick);
          } else { el.textContent = original; animating = false; }
        }
        requestAnimationFrame(tick);
      });
    });
  }

  // ── Smooth anchor scrolling ────────────────────────────────────────────────
  function initSmoothAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + scrollY - 80,
        behavior: "smooth",
      });
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  function boot() {
    safe(initMouseGradient,  "mouseGradient");
    safe(initCursor,         "cursor");
    safe(initNav,            "nav");
    safe(initMobileNav,      "mobileNav");
    safe(initScrollProgress, "scrollProgress");
    safe(initReveals,        "reveals");
    safe(initCountUp,        "countUp");
    safe(initTilt,           "tilt");
    safe(initScramble,       "scramble");
    safe(initSmoothAnchors,  "smoothAnchors");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroName,      "heroName");
      safe(initHeroParallax,  "heroParallax");
    } else {
      safe(initHeroName, "heroNameFallback");
    }

    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
