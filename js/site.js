// Versnellingscoach: menu, contactbolletje, kopieerknoppen en rekentool.
// Geen externe afhankelijkheden, geen netwerkverkeer, geen opslag.
(function () {
  "use strict";

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

  /* Rekentool */
  var calc = document.querySelector("[data-calc]");
  if (!calc) return;
  var staffel;
  try { staffel = JSON.parse(calc.getAttribute("data-staffel")); } catch (_) { return; }
  var email = calc.getAttribute("data-email");
  var inWon = document.getElementById("aantal-woningen");
  var inPrijs = document.getElementById("verkoopprijs");
  var errWon = document.getElementById("fout-woningen");
  var errPrijs = document.getElementById("fout-prijs");
  var out = calc.querySelector("[data-calc-out]");
  var mailBtn = calc.querySelector("[data-calc-mail]");
  var nl = new Intl.NumberFormat("nl-NL");
  var euro = function (n) { return "€ " + nl.format(n); };
  var digits = function (s) { return s.replace(/\D/g, ""); };

  function lookup(won, prijs) {
    var rij = staffel.rijen.find(function (r) { return won >= r.van && (r.tot === null || won <= r.tot); });
    var kolom = prijs < staffel.prijsGrenzen[0] ? 0 : prijs < staffel.prijsGrenzen[1] ? 1 : 2;
    return rij ? rij.bedragen[kolom] : null;
  }
  function setError(input, el, msg) {
    el.textContent = msg || ""; el.hidden = !msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function update() {
    var w = parseInt(digits(inWon.value) || "0", 10);
    var p = parseInt(digits(inPrijs.value) || "0", 10);
    var okW = w >= 1 && w <= 20000;
    var okP = p >= 50000 && p <= 10000000;
    setError(inWon, errWon, okW ? "" : "Vul een aantal woningen in tussen 1 en 20.000.");
    setError(inPrijs, errPrijs, okP ? "" : "Vul een gemiddelde verkoopprijs in tussen € 50.000 en € 10.000.000.");
    if (!okW || !okP) { out.textContent = "€ –"; return; }
    var bedrag = lookup(w, p);
    out.textContent = euro(bedrag);
    var body = "Beste Versnellingscoach,\n\nIk wil graag ons woningbouwproject bespreken.\n\n" +
      "Aantal woningen: " + nl.format(w) + "\nGemiddelde verkoopprijs: " + euro(p) +
      "\nIndicatieve besparing volgens de rekentool: " + euro(bedrag) +
      "\n\nOrganisatie:\nProject:\nTelefoonnummer:\n";
    mailBtn.href = "mailto:" + email + "?subject=" + encodeURIComponent("Bespreek mijn woningbouwproject") + "&body=" + encodeURIComponent(body);
  }
  inWon.addEventListener("input", function () { inWon.value = digits(inWon.value).slice(0, 5); update(); });
  inPrijs.addEventListener("input", function () {
    var raw = digits(inPrijs.value).slice(0, 8);
    inPrijs.value = raw ? nl.format(parseInt(raw, 10)) : "";
    update();
  });
  update();
})();
