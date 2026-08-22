/* WaterMax · интерактив: пузырьки, погружение, слайдер чистоты */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── шапка: фон при скролле ── */
  var topbar = document.getElementById("topbar");
  function onScrollTopbar() {
    topbar.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  onScrollTopbar();

  /* ── мобильное меню ── */
  var burger = document.getElementById("burger");
  var mobmenu = document.getElementById("mobmenu");
  function closeMenu() {
    burger.classList.remove("is-open");
    mobmenu.classList.remove("is-open");
    mobmenu.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var open = !mobmenu.classList.contains("is-open");
    burger.classList.toggle("is-open", open);
    mobmenu.classList.toggle("is-open", open);
    mobmenu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  mobmenu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ── появление блоков ── */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ── canvas: пузырьки в hero ── */
  var canvas = document.getElementById("bubbleCanvas");
  var heroVisible = true;
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, bubbles = [], raf = null;

    function sizeCanvas() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeBubble(startAnywhere) {
      var r = 1.5 + Math.random() * 4.5;
      return {
        x: Math.random() * W,
        y: startAnywhere ? Math.random() * H : H + r * 2,
        r: r,
        v: 0.25 + Math.random() * 0.7,
        drift: (Math.random() - 0.5) * 0.35,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.15 + Math.random() * 0.35
      };
    }

    function initBubbles() {
      var count = Math.round(Math.min(30, Math.max(14, W / 30)));
      bubbles = [];
      for (var i = 0; i < count; i++) bubbles.push(makeBubble(true));
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        b.y -= b.v;
        b.phase += 0.02;
        b.x += Math.sin(b.phase) * 0.3 + b.drift;
        if (b.y < -b.r * 2) bubbles[i] = makeBubble(false);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(11,111,208," + b.alpha + ")";
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + b.alpha * 1.4 + ")";
        ctx.fill();
      }
      raf = heroVisible ? requestAnimationFrame(tick) : null;
    }

    function startLoop() {
      if (raf === null && heroVisible) raf = requestAnimationFrame(tick);
    }

    sizeCanvas();
    initBubbles();
    startLoop();

    var resizeT;
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { sizeCanvas(); initBubbles(); }, 180);
    });

    /* пауза, когда hero не на экране */
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      if (heroVisible) startLoop();
    }, { threshold: 0.02 }).observe(canvas.parentElement);

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) startLoop();
    });
  }

  /* ── капля-прогресс скролла ── */
  var meter = document.getElementById("dropmeter");
  var meterFill = document.getElementById("meterFill");
  var pipeFill = document.getElementById("pipeFill");
  var stepsBox = document.querySelector(".steps");
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      onScrollTopbar();

      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;

      /* капля: вода поднимается (y от 48 до 0) */
      if (meterFill) meterFill.setAttribute("y", String(48 - 48 * p));
      if (meter) meter.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.5);

      /* труба в «как подобрать»: заполняется по мере прохождения секции */
      if (pipeFill && stepsBox) {
        var r = stepsBox.getBoundingClientRect();
        var vh = window.innerHeight;
        var prog = (vh * 0.8 - r.top) / (r.height + vh * 0.3);
        prog = Math.max(0, Math.min(1, prog));
        pipeFill.style.strokeDashoffset = String(100 - prog * 100);
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── форма → WhatsApp ── */
  var form = document.getElementById("leadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var phone = document.getElementById("fPhone").value.trim();
      var topic = document.getElementById("fTopic").value;
      var lines = ["Здравствуйте! Заявка с сайта WaterMax."];
      if (name) lines.push("Имя: " + name);
      if (phone) lines.push("Телефон: " + phone);
      lines.push("Интересует: " + topic);
      var url = "https://wa.me/77021212179?text=" + encodeURIComponent(lines.join("\n"));
      fireConversion("form_submit");
      window.open(url, "_blank", "noopener");
    });
  }

  /* ── Google Ads конверсии (AW-18403264659) ── */
  /* Анти-бот: считаем только реального пользователя (боты кликают без человеческих жестов) */
  var humanSeen = false;
  ["pointermove", "pointerdown", "touchstart", "scroll", "keydown", "wheel"].forEach(function (ev) {
    window.addEventListener(ev, function () { humanSeen = true; }, { once: true, passive: true });
  });
  function isLikelyBot() {
    return !!navigator.webdriver || !humanSeen;
  }

  /* Маппинг событие → конверсия. Дедуп: 1 раз за сессию. Только для людей. */
  var CONVERSIONS = {
    form_submit:    "AW-18403264659/_phNCNDy5-UcEJORrsdE", // Отправка формы для потенциальных клиентов
    phone_click:    "AW-18403264659/cSrFCIrF9uUcEJORrsdE", // Интерактивные номера телефонов
    whatsapp_click: "AW-18403264659/E7-gCODz5-UcEJORrsdE"  // Контакт (WhatsApp)
  };
  function fireConversion(eventName) {
    var sendTo = CONVERSIONS[eventName];
    if (!sendTo) return;
    if (typeof gtag !== "function") return;
    if (isLikelyBot()) return;
    try {
      var k = "wm_conv_" + eventName;
      if (sessionStorage.getItem(k)) return;   // уже отправляли в этой сессии
      sessionStorage.setItem(k, "1");
    } catch (e) { /* приватный режим — просто отправим один раз без памяти */ }
    gtag("event", "conversion", { "send_to": sendTo, "value": 1.0, "currency": "USD" });
  }

  document.addEventListener("click", function (e) {
    if (!e.isTrusted) return;                  // синтетический клик бота — игнор
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (href.indexOf("tel:") === 0) fireConversion("phone_click");
    else if (href.indexOf("wa.me") !== -1 || href.indexOf("whatsapp") !== -1) fireConversion("whatsapp_click");
  });
})();
