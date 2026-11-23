// Versnellingscoach: doorverwijzing, menu, contactbolletje, kopieerknoppen en rekentool.
// Geen externe afhankelijkheden, geen netwerkverkeer, geen opslag.
(function () {
  "use strict";

  /* Verhuisde pagina (/aanpak, /trainingen): doorsturen met behoud van #anker. Op Vercel gebeurt dit al met een 301. */
  var door = document.querySelector("[data-doorverwijzing]");
  if (door) { window.location.replace(door.href + window.location.hash); return; }

  /* Submenu Aanbod (desktop): openen met de knop, sluiten met Escape of klik erbuiten */
  var groepen = document.querySelectorAll("[data-nav-groep]");
  function sluitGroepen(behalve) {
    groepen.forEach(function (g) {
      if (g === behalve) return;
      g.classList.remove("open");
      var b = g.querySelector(".nav-sub-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }
  groepen.forEach(function (g) {
    var b = g.querySelector(".nav-sub-btn");
    if (!b) return;
    b.addEventListener("click", function () {
      var open = !g.classList.contains("open");
      sluitGroepen(g);
      g.classList.toggle("open", open);
      b.setAttribute("aria-expanded", String(open));
    });
    g.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && g.classList.contains("open")) { sluitGroepen(); b.focus(); e.stopPropagation(); }
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest("[data-nav-groep]")) sluitGroepen(); });

  /* Menu op kleine schermen */
  var menuBtn = document.querySelector(".menu-btn");
  var nav = document.getElementById("hoofdmenu");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); }
    });
  }

  /* Contactbolletje */
  var fabBtn = document.querySelector(".fab-toggle");
  var fabPanel = document.getElementById("contactpaneel");
  function closeFab(focus) {
    if (!fabPanel || fabPanel.hidden) return;
    fabPanel.hidden = true;
    fabBtn.setAttribute("aria-expanded", "false");
    if (focus) fabBtn.focus();
  }
  if (fabBtn && fabPanel) {
    fabBtn.addEventListener("click", function () {
      fabPanel.hidden = !fabPanel.hidden;
      fabBtn.setAttribute("aria-expanded", String(!fabPanel.hidden));
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeFab(true); });
    document.addEventListener("click", function (e) { if (!e.target.closest(".fab")) closeFab(false); });
  }

  /* Kopieerknoppen */
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var text = b.getAttribute("data-copy");
    function fallback() {
      var el = b.previousElementSibling;
      var r = document.createRange(); r.selectNodeContents(el);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      toast("Geselecteerd. Kopieer met Ctrl+C of Cmd+C.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("Gekopieerd"); }, fallback);
    } else { fallback(); }
  });

  /* Rekentool: keuze uit woningstaffels. Uitkomst en mailtekst per staffel komen uit de build (data-staffel). */
  var calc = document.querySelector("[data-calc]");
  if (!calc) return;
  var data;
  try { data = JSON.parse(calc.getAttribute("data-staffel")); } catch (_) { return; }
  var out = calc.querySelector("[data-calc-out]");
  var geen = calc.querySelector("[data-calc-geen]");
  var geenLink = calc.querySelector("[data-calc-geen-link]");
  var woningen = calc.querySelector("[data-calc-woningen]");
  var mailBtn = calc.querySelector("[data-calc-mail]");
  function update() {
    var gekozen = calc.querySelector('input[name="staffel"]:checked');
    var s = gekozen && (data.staffels || []).find(function (x) { return x.id === gekozen.value; });
    if (!s) return;
    if (s.bedrag) { out.textContent = s.bedrag; out.hidden = false; geen.hidden = true; }
    else { out.hidden = true; geen.hidden = false; geenLink.href = s.mail; }
    woningen.textContent = s.woningen;
    mailBtn.href = s.mail;
  }
  calc.querySelectorAll('input[name="staffel"]').forEach(function (r) { r.addEventListener("change", update); });
  update();
})();
