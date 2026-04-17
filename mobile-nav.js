/* FRQNCY shared mobile nav — injects a hamburger + drawer into any page
   that has <nav> with <ul class="nav-links">. Supports dropdown menus
   (.nav-dd) as accordion sections. Safe to load on every page. */
(function () {
  if (window.__frqncyMobileNavInit) return;
  window.__frqncyMobileNavInit = true;

  function init() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    if (document.getElementById('frqncy-hamburger')) return;

    var navLinks = document.querySelector('nav .nav-links');

    // Detect dark-nav pages
    var navBg = getComputedStyle(nav).backgroundColor || '';
    var isDark = /rgba?\(\s*(0|1\d|2\d|3\d|4\d)/.test(navBg) && !/255/.test(navBg);
    var barColor = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(11,28,61,0.8)';
    var drawerBg = isDark ? 'rgba(11,28,61,0.98)' : 'rgba(255,255,255,0.98)';
    var linkColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(11,28,61,0.85)';
    var dimColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(11,28,61,0.4)';
    var accentColor = '#C4973A';

    var style = document.createElement('style');
    style.id = 'frqncy-mobile-nav-style';
    style.textContent = [
      '#frqncy-hamburger{display:none;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:8px;margin-left:auto;z-index:1002;position:relative;}',
      '#frqncy-hamburger span{display:block;width:22px;height:1px;background:' + barColor + ';transition:all 0.25s;}',
      '#frqncy-hamburger.open span:nth-child(1){transform:translateY(6px) rotate(45deg);}',
      '#frqncy-hamburger.open span:nth-child(2){opacity:0;}',
      '#frqncy-hamburger.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg);}',
      '#frqncy-mobile-menu{display:none;position:fixed;inset:0;background:' + drawerBg + ';backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:1001;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:80px 24px 40px;overflow-y:auto;}',
      '#frqncy-mobile-menu.open{display:flex;}',
      '#frqncy-mobile-menu a,#frqncy-mobile-menu .mob-dd-trigger{font-family:"Jost",sans-serif;font-size:13px;font-weight:300;letter-spacing:0.28em;text-transform:uppercase;color:' + linkColor + ';text-decoration:none;transition:color 0.2s;padding:14px 0;display:block;text-align:center;width:100%;max-width:300px;}',
      '#frqncy-mobile-menu a:hover,#frqncy-mobile-menu a.active{color:' + accentColor + ';}',
      /* Accordion trigger */
      '.mob-dd-trigger{background:none;border:none;cursor:pointer;position:relative;}',
      '.mob-dd-arrow{display:inline-block;font-size:8px;margin-left:6px;transition:transform 0.25s;opacity:0.5;}',
      '.mob-dd-trigger.open .mob-dd-arrow{transform:rotate(180deg);}',
      /* Accordion content */
      '.mob-dd-items{max-height:0;overflow:hidden;transition:max-height 0.3s ease;width:100%;display:flex;flex-direction:column;align-items:center;}',
      '.mob-dd-items.open{max-height:300px;}',
      '.mob-dd-items a{font-size:11px !important;letter-spacing:0.2em !important;padding:10px 0 !important;color:' + dimColor + ' !important;}',
      '.mob-dd-items a:hover{color:' + accentColor + ' !important;}',
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

    // Build drawer
    var drawer = document.createElement('div');
    drawer.id = 'frqncy-mobile-menu';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Navigation');

    if (navLinks) {
      // Clone links from existing nav-links
      var items = navLinks.children; // <li> elements
      for (var i = 0; i < items.length; i++) {
        var li = items[i];
        if (li.classList.contains('nav-dd')) {
          // Dropdown → accordion
          var triggerA = li.querySelector('a');
          var menuDiv = li.querySelector('.nav-dd-menu');
          var triggerBtn = document.createElement('button');
          triggerBtn.className = 'mob-dd-trigger';
          triggerBtn.textContent = triggerA ? triggerA.textContent.trim() : '';
          triggerBtn.innerHTML += ' <span class="mob-dd-arrow">▾</span>';

          var accContent = document.createElement('div');
          accContent.className = 'mob-dd-items';
          if (menuDiv) {
            var subLinks = menuDiv.querySelectorAll('a');
            subLinks.forEach(function (sa) {
              var link = document.createElement('a');
              link.href = sa.getAttribute('href');
              var label = sa.querySelector('.dd-label');
              link.textContent = label ? label.textContent.trim() : sa.textContent.trim();
              link.addEventListener('click', closeDrawer);
              accContent.appendChild(link);
            });
          }

          triggerBtn.addEventListener('click', function (acc) {
            return function () {
              var isOpen = acc.classList.contains('open');
              drawer.querySelectorAll('.mob-dd-items.open').forEach(function (el) { el.classList.remove('open'); });
              drawer.querySelectorAll('.mob-dd-trigger.open').forEach(function (el) { el.classList.remove('open'); });
              if (!isOpen) {
                acc.classList.add('open');
                this.classList.add('open');
              }
            };
          }(accContent));

          drawer.appendChild(triggerBtn);
          drawer.appendChild(accContent);
        } else {
          var a = li.querySelector('a');
          if (a) {
            var link = document.createElement('a');
            link.href = a.getAttribute('href');
            link.textContent = a.textContent.trim();
            if (a.classList.contains('active')) link.classList.add('active');
            link.addEventListener('click', closeDrawer);
            drawer.appendChild(link);
          }
        }
      }
    } else {
      // Fallback: inject standard nav links for pages without .nav-links
      // Detect depth from site root by checking logo href or script src
      var base = '';
      var logoLink = nav.querySelector('a[class*="logo"]') || nav.querySelector('a');
      if (logoLink) {
        var h = logoLink.getAttribute('href') || '';
        if (h.indexOf('../../') === 0) base = '../../';
        else if (h.indexOf('../') === 0) base = '../';
      }
      // Also detect from mobile-nav.js script src
      if (!base) {
        var scripts = document.querySelectorAll('script[src*="mobile-nav"]');
        scripts.forEach(function(s) {
          var src = s.getAttribute('src') || '';
          if (src.indexOf('../../../') === 0) base = '../../../';
          else if (src.indexOf('../../') === 0) base = '../../';
          else if (src.indexOf('../') === 0) base = '../';
        });
      }
      var fallbackLinks = [
        { label: 'Home', href: base + 'index.html' },
        { label: 'Explore', href: base + 'v2/explore.html' },
        { label: 'Watch', href: base + 'v2/watch/index.html' },
        { label: 'Courses', href: base + 'v2/courses/index.html' },
        { label: 'Search', href: base + 'search.html' },
        { label: 'About', href: base + 'about.html' },
        { label: 'Podcast', href: base + 'podcast.html' },
        { label: 'Space', href: base + 'space.html' },
        { label: 'Chart', href: base + 'chart.html' },
        { label: 'People', href: base + 'v2/people/index.html' },
        { label: 'Crypto', href: base + 'v2/crypto/index.html' },
        { label: 'Fund', href: base + 'v2/fund/index.html' },
        { label: 'My FRQNCY', href: base + 'my-frqncy.html' }
      ];
      fallbackLinks.forEach(function(item) {
        var link = document.createElement('a');
        link.href = item.href;
        link.textContent = item.label;
        link.addEventListener('click', closeDrawer);
        drawer.appendChild(link);
      });
    }
    document.body.appendChild(drawer);

    function openDrawer() {
      drawer.classList.add('open');
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('frqncy-menu-open');
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('frqncy-menu-open');
    }
    btn.addEventListener('click', function () {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
