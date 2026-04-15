/* FRQNCY shared mobile nav — injects a hamburger + drawer into any page
   that has <nav> with <ul class="nav-links">. Safe to load on every page. */
(function () {
  if (window.__frqncyMobileNavInit) return;
  window.__frqncyMobileNavInit = true;

  function init() {
    var nav = document.querySelector('nav');
    var navLinks = document.querySelector('nav .nav-links');
    if (!nav || !navLinks) return;
    if (document.getElementById('frqncy-hamburger')) return;

    // Detect dark-nav pages (index, start-here, explore have dark translucent bg)
    var navBg = getComputedStyle(nav).backgroundColor || '';
    var isDark = /rgba?\(\s*(0|1\d|2\d|3\d|4\d)/.test(navBg) && !/255/.test(navBg);
    var barColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(11,28,61,0.8)';
    var drawerBg = isDark ? 'rgba(11,28,61,0.98)' : 'rgba(255,255,255,0.98)';
    var linkColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(11,28,61,0.85)';

    var style = document.createElement('style');
    style.id = 'frqncy-mobile-nav-style';
    style.textContent = [
      '#frqncy-hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:8px;margin-left:auto;z-index:1002;position:relative;}',
      '#frqncy-hamburger span{display:block;width:22px;height:1px;background:' + barColor + ';transition:all 0.25s;}',
      '#frqncy-hamburger.open span:nth-child(1){transform:translateY(6px) rotate(45deg);}',
      '#frqncy-hamburger.open span:nth-child(2){opacity:0;}',
      '#frqncy-hamburger.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg);}',
      '#frqncy-mobile-menu{display:none;position:fixed;inset:0;background:' + drawerBg + ';backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:1001;flex-direction:column;align-items:center;justify-content:center;gap:32px;padding:80px 24px 40px;}',
      '#frqncy-mobile-menu.open{display:flex;}',
      '#frqncy-mobile-menu a{font-family:"Jost",sans-serif;font-size:13px;font-weight:300;letter-spacing:0.28em;text-transform:uppercase;color:' + linkColor + ';text-decoration:none;transition:color 0.2s;}',
      '#frqncy-mobile-menu a:hover,#frqncy-mobile-menu a.active{color:#C4973A;}',
      'body.frqncy-menu-open{overflow:hidden;}',
      '@media (max-width:768px){#frqncy-hamburger{display:flex;}}'
    ].join('');
    document.head.appendChild(style);

    // Build hamburger button
    var btn = document.createElement('button');
    btn.id = 'frqncy-hamburger';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(btn);

    // Build drawer by cloning nav-links <a>s
    var drawer = document.createElement('div');
    drawer.id = 'frqncy-mobile-menu';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Navigation');
    var anchors = navLinks.querySelectorAll('a');
    anchors.forEach(function (a) {
      var link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent.trim();
      if (a.classList.contains('active')) link.classList.add('active');
      link.addEventListener('click', close);
      drawer.appendChild(link);
    });
    document.body.appendChild(drawer);

    function open() {
      drawer.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('frqncy-menu-open');
    }
    function close() {
      drawer.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('frqncy-menu-open');
    }
    btn.addEventListener('click', function () {
      drawer.classList.contains('open') ? close() : open();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
