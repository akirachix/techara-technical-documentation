/* GridFit header enhancements: brand label, top navigation, Ctrl+K search hint.
   Works with Material's instant navigation (re-runs via document$). */
(function () {
  var LINKS = [
    ["Home", ""], ["Overview", "overview/"], ["Architecture", "architecture/"], ["Backend", "backend-api/"],
    ["Frontend", "frontend-web/"], ["Security", "security/"], ["Deployment", "deployment/"]
  ];

  function init() {
    var inner = document.querySelector(".md-header__inner");
    var logo = inner && inner.querySelector(".md-logo");
    if (!inner || !logo) return;
    var base = new URL(logo.getAttribute("href"), location.href);
    if (!/\/$/.test(base.pathname)) base.pathname = base.pathname.replace(/[^/]*$/, "");

    // Switch the header logo to match the selected color theme.
    var logoImage = logo.querySelector("img");

    function updateThemeLogo() {
      var isLight = document.body.getAttribute("data-md-color-scheme") === "default";
      var filename = isLight
        ? "assets/images/gridfit-mark-light.png"
        : "assets/images/gridfit-mark-white.svg";

      if (logoImage) {
        logoImage.src = new URL(filename, base).href;
      }

      var footerLogo = document.querySelector(".gf-footer__logo img");
      if (footerLogo) {
        footerLogo.src = new URL(filename, base).href;
      }
    }

    updateThemeLogo();

    if (!logo.dataset.themeLogoBound) {
      logo.dataset.themeLogoBound = "true";

      var themeObserver = new MutationObserver(updateThemeLogo);
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-md-color-scheme"]
      });
    }

    if (!inner.querySelector(".gf-brand")) {
      var brand = document.createElement("a");
      brand.className = "gf-brand";
      brand.href = base.href;
      brand.innerHTML = '<span class="gf-wordmark"><b>Grid</b>Fit</span>' +
        '<span class="gf-brand__div"></span><span class="gf-brand__label">Technical Documentation</span>';
      logo.insertAdjacentElement("afterend", brand);
    }

    var nav = inner.querySelector(".gf-topnav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.className = "gf-topnav";
      nav.setAttribute("aria-label", "Primary");
      LINKS.forEach(function (l) {
        var a = document.createElement("a");
        a.textContent = l[0];
        a.href = new URL(l[1], base).href;
        nav.appendChild(a);
      });
      inner.querySelector(".gf-brand").insertAdjacentElement("afterend", nav);
    }
    var here = location.pathname.replace(/index\.html$/, "");
    var isHome = here === base.pathname;
    nav.querySelectorAll("a").forEach(function (a) {
      var p = new URL(a.href).pathname;
      var on = a.textContent === "Home" ? isHome : (!isHome && here.indexOf(p) === 0);
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });

    var form = inner.querySelector(".md-search__form");
    if (form && !form.querySelector(".gf-kbd")) {
      var k = document.createElement("span");
      k.className = "gf-kbd"; k.setAttribute("aria-hidden", "true");
      k.innerHTML = "<kbd>Ctrl</kbd><kbd>K</kbd>";
      form.appendChild(k);
    }
  }

  if (!window.__gfKeys) {
    window.__gfKeys = true;
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        var t = document.querySelector("[data-md-toggle=search]");
        var i = document.querySelector(".md-search__input");
        if (!t || !i) return;
        e.preventDefault();
        t.checked = true; t.dispatchEvent(new Event("change"));
        setTimeout(function () { i.focus(); i.select(); }, 50);
      }
    });
  }

  if (window.document$ && window.document$.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
