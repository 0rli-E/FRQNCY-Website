/* FRQNCY homepage logic — extracted from index.html */
    // =====================
    // SHARED UTILITIES
    // =====================

    // Visibility — pause animations when tab is hidden (saves CPU/battery)
    let pageVisible = !document.hidden;
    document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; });

    // Scroll-lock counter — prevents hamburger and subscribe overlay from
    // fighting over body.style.overflow when both are active simultaneously
    let _overflowLocks = 0;
    function lockBody()   { if (++_overflowLocks === 1) document.body.style.overflow = 'hidden'; }
    function unlockBody() { if (--_overflowLocks <= 0) { _overflowLocks = 0; document.body.style.overflow = ''; } }

    // =====================
    // PARTICLES
    // =====================
    (function () {
      const canvas = document.getElementById('particles-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      let particles = [];

      function resize() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
      window.addEventListener('resize', resize, { passive: true });
      resize();

      function Particle() { this.reset(true); }
      Particle.prototype.reset = function (scatter) {
        this.x       = Math.random() * canvas.width;
        this.y       = scatter ? Math.random() * canvas.height : canvas.height + 10;
        this.size    = Math.random() * 1.8 + 0.4;
        this.speed   = Math.random() * 0.35 + 0.1;
        this.opacity = Math.random() * 0.35 + 0.1;
        this.drift   = (Math.random() - 0.5) * 0.25;
      };
      Particle.prototype.update = function () {
        this.y       -= this.speed;
        this.x       += this.drift;
        this.opacity -= 0.0008;
        if (this.y < -10 || this.opacity <= 0) this.reset(false);
      };

      for (let i = 0; i < 70; i++) particles.push(new Particle());

      (function animate() {
        if (pageVisible) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach(p => {
            p.update();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(196, 151, 58, ${p.opacity})`;
            ctx.fill();
          });
        }
        requestAnimationFrame(animate);
      })();
    })();

    // =====================
    // SUBSCRIBE OVERLAY  (with localStorage cookie)
    // =====================
    const POPUP_KEY = 'frqncy_popup_v2';
    const POPUP_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    function popupSeen() {
      try {
        const raw = localStorage.getItem(POPUP_KEY);
        if (!raw) return false;
        const { ts, reason } = JSON.parse(raw);
        // After subscribing, suppress permanently; after dismissing, 7 days
        if (reason === 'subscribed') return true;
        return (Date.now() - ts) < POPUP_TTL;
      } catch { return false; }
    }
    function markPopupSeen(reason) {
      try { localStorage.setItem(POPUP_KEY, JSON.stringify({ ts: Date.now(), reason })); } catch {}
    }

    let subscribeShown = false;

    function showSubscribe() {
      if (popupSeen()) { subscribeShown = true; return; }
      const overlay = document.getElementById('subscribe-overlay');
      if (!overlay) return;
      overlay.classList.add('visible');
      lockBody();
    }
    function dismissSubscribe() {
      const overlay = document.getElementById('subscribe-overlay');
      if (!overlay) return;
      overlay.classList.remove('visible');
      unlockBody();
      subscribeShown = true;
      markPopupSeen('dismissed');
    }
    async function handleSubscribe(e, form) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const email = input.value.trim();
      const btn   = form.querySelector('button[type="submit"]');

      // Determine which form (overlay vs contact section)
      const isOverlay = form.id === 'subscribe-form-overlay';
      const successEl = document.getElementById(isOverlay ? 'subscribe-success-overlay' : 'subscribe-success-contact');
      const errorEl   = document.getElementById(isOverlay ? 'subscribe-error-overlay'   : 'subscribe-error-contact');

      // Client-side email validation (we can't read Substack's response due to no-cors)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.style.display = 'block';
        input.focus();
        return;
      }

      // Loading state
      const origText = btn.textContent;
      btn.textContent = '···';
      btn.disabled = true;
      errorEl.style.display = 'none';

      try {
        // Submit to Substack — fire-and-forget (no-cors).
        // Substack receives the email and sends its confirmation email to the user.
        await fetch('https://frqncy.substack.com/api/v1/free', {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            first_url: window.location.href,
            first_referrer: document.referrer || '',
            current_url: window.location.href,
            current_referrer: document.referrer || '',
            referral_code: '',
            source: 'frqncy.network',
            domain: 'frqncy.substack.com'
          }),
        });

        form.style.display = 'none';
        successEl.style.display = 'block';
        markPopupSeen('subscribed'); // suppress permanently after subscribing
        // Auto-dismiss overlay after 2s
        if (isOverlay) setTimeout(dismissSubscribe, 2000);
      } catch (err) {
        errorEl.textContent = 'Connection error. Please try again.';
        errorEl.style.display = 'block';
        btn.textContent = origText;
        btn.disabled = false;
      }
    }

    // Trigger overlay on scroll past intro
    window.addEventListener('scroll', function () {
      if (!subscribeShown && window.scrollY > window.innerHeight * 0.55) {
        showSubscribe();
        subscribeShown = true;
      }
    }, { passive: true });

    // =====================
    // SCROLL REVEAL
    // =====================
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObserver.observe(el));

    // =====================
    // HAMBURGER MENU
    // =====================
    (function() {
      const hamburger = document.getElementById('nav-hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      if (!hamburger || !mobileMenu) return;

      function openMenu() {
        hamburger.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('open');
        mobileMenu.setAttribute('aria-hidden', 'false');
        lockBody();
      }
      function closeMenu() {
        if (!mobileMenu.classList.contains('open')) return; // already closed
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
        unlockBody();
      }

      hamburger.addEventListener('click', () => {
        mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
      });

      // Close on any link click
      mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

      // Close on outside tap
      document.addEventListener('click', e => {
        if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && e.target !== hamburger && !hamburger.contains(e.target)) {
          closeMenu();
        }
      });

      // Close on Escape
      document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    })();

    // =====================
    // NAV BEHAVIOR
    // =====================
    // light-intro is also dark (#050810) — keep nav text white there too
    const darkSections = ['light-intro', 'bubble-section', 'contact-section'];
    function updateNav() {
      const nav   = document.getElementById('main-nav');
      const scrolled = window.scrollY > 80;
      nav.classList.toggle('scrolled', scrolled);

      const midY = window.scrollY + window.innerHeight / 3;
      const overDark = darkSections.some(id => {
        const el = document.getElementById(id);
        if (!el) return false;
        return midY >= el.offsetTop && midY <= el.offsetTop + el.offsetHeight;
      });
      nav.classList.toggle('over-dark', overDark);
    }
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();


/* ── D3 loader + network map ── */
  (function(){
    function _loadScript(src, ok, fail) {
      var s = document.createElement('script');
      s.onload = ok; s.onerror = fail; s.src = src;
      document.head.appendChild(s);
    }
    function _showMapError() {
      var c = document.getElementById('nm-container');
      if (c) c.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(196,151,58,0.6);font-family:Jost,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">Network map requires an internet connection</div>';
      console.error('FRQNCY: D3 failed to load from all CDNs');
    }
    _loadScript(
      'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js',
      _initNetworkMap,
      function() {
        // cdnjs failed, trying jsDelivr fallback
        _loadScript('https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js', _initNetworkMap, _showMapError);
      }
    );
  })();

  function _initNetworkMap() {
    // Hide loading indicator once D3 is ready
    var _nmLoad = document.getElementById('nm-loading');
    if (_nmLoad) _nmLoad.remove();
    // =====================
    // NETWORK MAP (inlined)
    // =====================
    (function(){
    const NM_NODES=[
      {id:"frqncy",label:"FRQNCY",type:"core",r:52,desc:"The living network of consciousness"},
      {id:"network-state",label:"Network State",type:"main",r:30,desc:"The sovereign community"},
      {id:"fund",label:"Fund",type:"main",r:29,desc:"Capital allocation"},
      {id:"education",label:"Education",type:"main",r:30,desc:"Transmitting what's known"},
      {id:"research",label:"Research",type:"main",r:29,desc:"Exploring what isn't known yet"},
      {id:"media",label:"Media",type:"main",r:29,desc:"Spreading the signal"},
      {id:"builder",label:"Builder",type:"main",r:30,desc:"Creating products, tools, experiences"},
      {id:"d-sciences",label:"Sciences",type:"cluster",r:24,desc:"Empirical exploration of reality"},
      {id:"d-tech",label:"Technology",type:"cluster",r:24,desc:"Tools shaping the future"},
      {id:"d-arts",label:"Arts & Culture",type:"cluster",r:23,desc:"Expression of the human spirit"},
      {id:"d-nature",label:"Nature & Cosmos",type:"cluster",r:24,desc:"The living systems of existence"},
      {id:"d-business",label:"Business",type:"cluster",r:22,desc:"Regenerative enterprise and social models"},
      {id:"d-money",label:"Money",type:"cluster",r:23,desc:"Capital, crypto, and the new financial layer"},
      {id:"d-meta",label:"Metaphysics",type:"cluster",r:25,desc:"The architecture of reality"},
      {id:"d-lifestyle",label:"Lifestyle",type:"cluster",r:22,desc:"Conscious ways of living"},
      {id:"d-creation",label:"Creation",type:"cluster",r:23,desc:"Building what has never existed"},
      {id:"d-wellbeing",label:"Well-being",type:"cluster",r:24,desc:"Healing and wholeness"},
      {id:"d-society",label:"Society & Networks",type:"cluster",r:23,desc:"Collective human systems"},
      {id:"d-communication",label:"Communication",type:"cluster",r:23,desc:"How humans connect and express meaning"},
      {id:"d-energy",label:"Energy",type:"cluster",r:23,desc:"The forces and resources that power existence"},
      {id:"d-food",label:"Food & Agriculture",type:"cluster",r:23,desc:"Growing, sharing and consuming nourishment"},
      {id:"d-play",label:"Play & Recreation",type:"cluster",r:22,desc:"Joy, games, sports and leisure"},
      {id:"t-quantum",label:"Quantum Physics",type:"topic",r:14},
      {id:"t-neuro",label:"Neuroscience",type:"topic",r:14},
      {id:"t-bio",label:"Biology",type:"topic",r:13},
      {id:"t-psych",label:"Psychology",type:"topic",r:14},
      {id:"t-med",label:"Medicine",type:"topic",r:13},
      {id:"t-math",label:"Mathematics",type:"topic",r:13},
      {id:"t-astrophys",label:"Astrophysics",type:"topic",r:14},
      {id:"t-ecology",label:"Ecology",type:"topic",r:13},
      {id:"t-genetics",label:"Genetics",type:"topic",r:13},
      {id:"t-chemistry",label:"Chemistry",type:"topic",r:12},
      {id:"t-ai",label:"Artificial Intelligence",type:"topic",r:16},
      {id:"t-blockchain",label:"Blockchain",type:"topic",r:15},
      {id:"t-decentral",label:"Decentralized Networks",type:"topic",r:15},
      {id:"t-arvr",label:"AR / VR",type:"topic",r:13},
      {id:"t-biotech",label:"Biotechnology",type:"topic",r:14},
      {id:"t-robotics",label:"Robotics",type:"topic",r:13},
      {id:"t-web3",label:"Web3",type:"topic",r:15},
      {id:"t-quantcomp",label:"Quantum Computing",type:"topic",r:14},
      {id:"t-cybersec",label:"Cybersecurity",type:"topic",r:13},
      {id:"t-music",label:"Music",type:"topic",r:16},
      {id:"t-visual",label:"Visual Art",type:"topic",r:14},
      {id:"t-film",label:"Film",type:"topic",r:13},
      {id:"t-poetry",label:"Poetry",type:"topic",r:13},
      {id:"t-dance",label:"Dance",type:"topic",r:13},
      {id:"t-archit",label:"Architecture",type:"topic",r:13},
      {id:"t-fashion",label:"Fashion",type:"topic",r:12},
      {id:"t-story",label:"Storytelling",type:"topic",r:14},
      {id:"t-photo",label:"Photography",type:"topic",r:12},
      {id:"t-theater",label:"Theater",type:"topic",r:12},
      {id:"t-sacredgeo",label:"Sacred Geometry",type:"topic",r:15},
      {id:"t-astrology",label:"Astrology",type:"topic",r:14},
      {id:"t-climate",label:"Climate",type:"topic",r:14},
      {id:"t-biodivers",label:"Biodiversity",type:"topic",r:13},
      {id:"t-oceans",label:"Oceans",type:"topic",r:13},
      {id:"t-forests",label:"Forests",type:"topic",r:13},
      {id:"t-cosmos",label:"Stars & Planets",type:"topic",r:14},
      {id:"t-efields",label:"Energy Fields",type:"topic",r:14},
      {id:"t-cycles",label:"Seasons & Cycles",type:"topic",r:13},
      {id:"t-defi",label:"DeFi",type:"topic",r:15},
      {id:"t-impact",label:"Impact Investing",type:"topic",r:14},
      {id:"t-socialent",label:"Social Enterprise",type:"topic",r:14},
      {id:"t-circular",label:"Circular Economy",type:"topic",r:14},
      {id:"t-conscap",label:"Conscious Capital",type:"topic",r:14},
      {id:"t-regenbiz",label:"Regenerative Business",type:"topic",r:14},
      {id:"t-dao",label:"DAOs",type:"topic",r:13},
      {id:"t-crypto",label:"Cryptocurrency",type:"topic",r:15},
      {id:"t-wealth-mind",label:"Prosperity Mindset",type:"topic",r:13},
      {id:"t-oneness",label:"Oneness",type:"topic",r:16},
      {id:"t-source",label:"Source Energy",type:"topic",r:15},
      {id:"t-soul",label:"Soul Purpose",type:"topic",r:14},
      {id:"t-akashic",label:"Akashic Records",type:"topic",r:14},
      {id:"t-dims",label:"Higher Dimensions",type:"topic",r:14},
      {id:"t-sync",label:"Synchronicity",type:"topic",r:13},
      {id:"t-saclaw",label:"Sacred Law",type:"topic",r:13},
      {id:"t-merkaba",label:"Merkaba",type:"topic",r:13},
      {id:"t-vibration",label:"Vibration & Frequency",type:"topic",r:15},
      {id:"t-nutrition",label:"Nutrition",type:"topic",r:13},
      {id:"t-movement",label:"Movement",type:"topic",r:13},
      {id:"t-sleep",label:"Sleep",type:"topic",r:12},
      {id:"t-plantmed",label:"Plant Medicine",type:"topic",r:14},
      {id:"t-community",label:"Community Living",type:"topic",r:14},
      {id:"t-minimalism",label:"Minimalism",type:"topic",r:13},
      {id:"t-detox",label:"Digital Detox",type:"topic",r:12},
      {id:"t-sustliving",label:"Sustainable Living",type:"topic",r:14},
      {id:"t-proddesign",label:"Product Design",type:"topic",r:13},
      {id:"t-systems",label:"Systems Thinking",type:"topic",r:14},
      {id:"t-opensource",label:"Open Source",type:"topic",r:14},
      {id:"t-cocreate",label:"Co-creation",type:"topic",r:14},
      {id:"t-proto",label:"Prototyping",type:"topic",r:13},
      {id:"t-emergence",label:"Emergence",type:"topic",r:14},
      {id:"t-biomimicry",label:"Biomimicry",type:"topic",r:14},
      {id:"t-futuretech",label:"Future of Work",type:"topic",r:13},
      {id:"t-meditation",label:"Meditation",type:"topic",r:16},
      {id:"t-soundheal",label:"Sound Healing",type:"topic",r:15},
      {id:"t-breathwork",label:"Breathwork",type:"topic",r:14},
      {id:"t-somatic",label:"Somatic Therapy",type:"topic",r:14},
      {id:"t-energyheal",label:"Energy Healing",type:"topic",r:14},
      {id:"t-yoga",label:"Yoga",type:"topic",r:14},
      {id:"t-mentalhlth",label:"Mental Health",type:"topic",r:14},
      {id:"t-trauma",label:"Trauma Healing",type:"topic",r:14},
      {id:"t-governance",label:"Global Governance",type:"topic",r:14},
      {id:"t-indigenous",label:"Indigenous Wisdom",type:"topic",r:15},
      {id:"t-collective",label:"Collective Intelligence",type:"topic",r:15},
      {id:"t-socialmov",label:"Social Movements",type:"topic",r:14},
      {id:"t-peace",label:"Peace Building",type:"topic",r:14},
      {id:"t-futurecity",label:"Future Cities",type:"topic",r:14},
      {id:"t-edusystem",label:"Education Systems",type:"topic",r:14},
      {id:"t-diaspora",label:"Global Diaspora",type:"topic",r:13},
      {id:"t-language",label:"Language & Linguistics",type:"topic",r:14},
      {id:"t-speaking",label:"Public Speaking",type:"topic",r:13},
      {id:"t-dialogue",label:"Dialogue & Debate",type:"topic",r:13},
      {id:"t-journalism",label:"Journalism",type:"topic",r:14},
      {id:"t-socialmedia",label:"Social Media",type:"topic",r:14},
      {id:"t-nvc",label:"Nonviolent Communication",type:"topic",r:13},
      {id:"t-translation",label:"Translation",type:"topic",r:12},
      {id:"t-broadcasting",label:"Broadcasting",type:"topic",r:13},
      {id:"t-renewable",label:"Renewable Energy",type:"topic",r:15},
      {id:"t-solar",label:"Solar Energy",type:"topic",r:14},
      {id:"t-wind",label:"Wind Energy",type:"topic",r:13},
      {id:"t-geothermal",label:"Geothermal",type:"topic",r:13},
      {id:"t-storage",label:"Energy Storage",type:"topic",r:13},
      {id:"t-bioenergy",label:"Bioenergy",type:"topic",r:13},
      {id:"t-gridtech",label:"Grid Technology",type:"topic",r:13},
      {id:"t-energypolicy",label:"Energy Policy",type:"topic",r:13},
      {id:"t-regenfarm",label:"Regenerative Farming",type:"topic",r:14},
      {id:"t-permaculture",label:"Permaculture",type:"topic",r:14},
      {id:"t-foodsystems",label:"Food Systems",type:"topic",r:14},
      {id:"t-urbanfarm",label:"Urban Farming",type:"topic",r:13},
      {id:"t-fermentation",label:"Fermentation",type:"topic",r:12},
      {id:"t-foodsov",label:"Food Sovereignty",type:"topic",r:13},
      {id:"t-cuisine",label:"Cuisine & Culture",type:"topic",r:14},
      {id:"t-aquaculture",label:"Aquaculture",type:"topic",r:12},
      {id:"t-sports",label:"Sports & Athletics",type:"topic",r:15},
      {id:"t-gaming",label:"Games & Gaming",type:"topic",r:14},
      {id:"t-outdoor",label:"Outdoor Adventure",type:"topic",r:13},
      {id:"t-esports",label:"Esports",type:"topic",r:13},
      {id:"t-leisure",label:"Leisure & Rest",type:"topic",r:13},
      {id:"t-humor",label:"Humor & Comedy",type:"topic",r:13},
      {id:"t-festivals",label:"Festivals & Events",type:"topic",r:14},
      {id:"t-playcreat",label:"Play & Creativity",type:"topic",r:13},
    ];

    const NM_RAW=[
      ["frqncy","network-state"],["frqncy","fund"],["frqncy","education"],["frqncy","research"],["frqncy","media"],["frqncy","builder"],
      ["frqncy","d-sciences"],["frqncy","d-tech"],["frqncy","d-arts"],["frqncy","d-nature"],["frqncy","d-business"],["frqncy","d-money"],
      ["frqncy","d-meta"],["frqncy","d-lifestyle"],["frqncy","d-creation"],["frqncy","d-wellbeing"],["frqncy","d-society"],
      ["network-state","d-tech"],["network-state","d-society"],["network-state","d-business"],["network-state","d-money"],["network-state","d-creation"],
      ["fund","d-business"],["fund","d-money"],["fund","d-tech"],["fund","d-creation"],["fund","d-society"],
      ["education","d-sciences"],["education","d-arts"],["education","d-creation"],["education","d-society"],
      ["research","d-sciences"],["research","d-meta"],["research","d-nature"],["research","d-tech"],
      ["media","d-arts"],["media","d-communication"],["media","d-society"],["media","d-tech"],
      ["builder","d-creation"],["builder","d-tech"],["builder","d-business"],["builder","d-money"],["builder","d-society"],
      ["d-sciences","t-quantum"],["d-sciences","t-neuro"],["d-sciences","t-bio"],["d-sciences","t-psych"],
      ["d-sciences","t-med"],["d-sciences","t-math"],["d-sciences","t-astrophys"],["d-sciences","t-ecology"],
      ["d-sciences","t-genetics"],["d-sciences","t-chemistry"],
      ["d-tech","t-ai"],["d-tech","t-blockchain"],["d-tech","t-decentral"],["d-tech","t-arvr"],
      ["d-tech","t-biotech"],["d-tech","t-robotics"],["d-tech","t-web3"],["d-tech","t-quantcomp"],["d-tech","t-cybersec"],
      ["d-arts","t-music"],["d-arts","t-visual"],["d-arts","t-film"],["d-arts","t-poetry"],["d-arts","t-dance"],
      ["d-arts","t-archit"],["d-arts","t-fashion"],["d-arts","t-story"],["d-arts","t-photo"],["d-arts","t-theater"],
      ["d-nature","t-sacredgeo"],["d-nature","t-astrology"],["d-nature","t-climate"],["d-nature","t-biodivers"],
      ["d-nature","t-oceans"],["d-nature","t-forests"],["d-nature","t-cosmos"],["d-nature","t-efields"],["d-nature","t-cycles"],
      ["d-business","t-socialent"],["d-business","t-circular"],["d-business","t-regenbiz"],
      ["d-money","t-defi"],["d-money","t-impact"],["d-money","t-conscap"],["d-money","t-dao"],["d-money","t-crypto"],["d-money","t-wealth-mind"],
      ["d-meta","t-oneness"],["d-meta","t-source"],["d-meta","t-soul"],["d-meta","t-akashic"],
      ["d-meta","t-dims"],["d-meta","t-sync"],["d-meta","t-saclaw"],["d-meta","t-merkaba"],["d-meta","t-vibration"],
      ["d-lifestyle","t-nutrition"],["d-lifestyle","t-movement"],["d-lifestyle","t-sleep"],["d-lifestyle","t-plantmed"],
      ["d-lifestyle","t-community"],["d-lifestyle","t-minimalism"],["d-lifestyle","t-detox"],["d-lifestyle","t-sustliving"],
      ["d-creation","t-proddesign"],["d-creation","t-systems"],["d-creation","t-opensource"],["d-creation","t-cocreate"],
      ["d-creation","t-proto"],["d-creation","t-emergence"],["d-creation","t-biomimicry"],["d-creation","t-futuretech"],
      ["d-wellbeing","t-meditation"],["d-wellbeing","t-soundheal"],["d-wellbeing","t-breathwork"],["d-wellbeing","t-somatic"],
      ["d-wellbeing","t-energyheal"],["d-wellbeing","t-yoga"],["d-wellbeing","t-mentalhlth"],["d-wellbeing","t-trauma"],
      ["d-society","t-governance"],["d-society","t-indigenous"],["d-society","t-collective"],["d-society","t-socialmov"],
      ["d-society","t-peace"],["d-society","t-futurecity"],["d-society","t-edusystem"],["d-society","t-diaspora"],
      ["t-quantum","t-oneness"],["t-quantum","t-vibration"],
      ["t-neuro","t-meditation"],["t-neuro","t-trauma"],["t-neuro","t-psych"],
      ["t-psych","t-mentalhlth"],["t-psych","t-trauma"],["t-psych","t-somatic"],
      ["t-bio","t-ecology"],["t-genetics","t-biotech"],["t-med","t-mentalhlth"],
      ["t-ai","t-systems"],["t-ai","t-collective"],["t-ai","t-futuretech"],
      ["t-blockchain","t-defi"],["t-blockchain","t-dao"],
      ["t-web3","t-decentral"],["t-web3","t-dao"],
      ["fund","t-blockchain"],["fund","t-defi"],["fund","t-web3"],["fund","t-dao"],["fund","t-conscap"],
      ["t-music","t-soundheal"],["t-music","t-vibration"],
      ["t-sacredgeo","t-merkaba"],["t-sacredgeo","t-dims"],["t-sacredgeo","t-math"],
      ["t-astrology","t-cycles"],["t-cosmos","t-astrophys"],
      ["t-indigenous","t-saclaw"],["t-indigenous","t-ecology"],["t-indigenous","t-story"],
      ["t-plantmed","t-energyheal"],["t-plantmed","t-med"],
      ["t-yoga","t-movement"],["t-yoga","t-breathwork"],
      ["t-community","t-cocreate"],["t-community","t-peace"],
      ["t-emergence","t-systems"],["t-biomimicry","t-ecology"],
      ["t-sustliving","t-circular"],["t-regenbiz","t-sustliving"],
      ["t-conscap","t-impact"],["t-conscap","t-regenbiz"],
      ["t-collective","t-cocreate"],["t-collective","t-governance"],
      ["t-futurecity","t-archit"],["t-futurecity","t-systems"],
      ["t-source","t-efields"],["t-source","t-vibration"],
      ["t-oneness","t-collective"],["t-oneness","t-source"],
      ["t-soul","t-sync"],["t-soul","t-source"],
      ["t-edusystem","t-collective"],["t-opensource","t-decentral"],
      ["t-diaspora","t-socialmov"],["t-diaspora","t-community"],
      ["t-detox","t-minimalism"],["t-dance","t-movement"],
      ["t-efields","t-energyheal"],["t-efields","t-vibration"],
      ["t-archit","t-sacredgeo"],["t-story","t-film"],["t-poetry","t-story"],
      ["frqncy","d-communication"],["frqncy","d-energy"],["frqncy","d-food"],["frqncy","d-play"],
      ["d-communication","t-language"],["d-communication","t-speaking"],["d-communication","t-dialogue"],
      ["d-communication","t-journalism"],["d-communication","t-socialmedia"],["d-communication","t-nvc"],
      ["d-communication","t-translation"],["d-communication","t-broadcasting"],
      ["d-energy","t-renewable"],["d-energy","t-solar"],["d-energy","t-wind"],["d-energy","t-geothermal"],
      ["d-energy","t-storage"],["d-energy","t-bioenergy"],["d-energy","t-gridtech"],["d-energy","t-energypolicy"],
      ["d-food","t-regenfarm"],["d-food","t-permaculture"],["d-food","t-foodsystems"],["d-food","t-urbanfarm"],
      ["d-food","t-fermentation"],["d-food","t-foodsov"],["d-food","t-cuisine"],["d-food","t-aquaculture"],
      ["d-play","t-sports"],["d-play","t-gaming"],["d-play","t-outdoor"],["d-play","t-esports"],
      ["d-play","t-leisure"],["d-play","t-humor"],["d-play","t-festivals"],["d-play","t-playcreat"],
      ["t-regenfarm","t-ecology"],["t-permaculture","t-ecology"],["t-permaculture","t-sustliving"],
      ["t-foodsystems","t-circular"],["t-foodsov","t-indigenous"],["t-urbanfarm","t-futurecity"],
      ["t-renewable","t-climate"],["t-solar","t-renewable"],["t-wind","t-renewable"],["t-bioenergy","t-renewable"],
      ["t-energypolicy","t-governance"],["t-gridtech","t-systems"],["t-storage","t-gridtech"],
      ["t-language","t-story"],["t-journalism","t-socialmov"],["t-nvc","t-peace"],
      ["t-socialmedia","t-collective"],["t-dialogue","t-peace"],["t-broadcasting","t-journalism"],
      ["t-sports","t-movement"],["t-festivals","t-community"],["t-gaming","t-ai"],
      ["t-esports","t-gaming"],["t-playcreat","t-cocreate"],["t-outdoor","t-ecology"],
      ["t-leisure","t-mentalhlth"],["t-humor","t-story"],
    ];
    const NM_LINKS=NM_RAW.map(([s,t])=>({source:s,target:t}));

    const nmContainer=document.getElementById('nm-container');
    const nmCanvas=document.getElementById('nm-fx');
    const nmCtx=nmCanvas.getContext('2d');

    /* Update hint text for touch devices */
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const nmHint = document.getElementById('nm-hint');
      if (nmHint) nmHint.textContent = 'TAP TO EXPLORE · PINCH TO ZOOM · DRAG TO PAN';
    }

    function nmResize(){
      nmCanvas.width=nmContainer.offsetWidth;
      nmCanvas.height=nmContainer.offsetHeight;
      // Re-centre force simulation when container dimensions change
      // (guard against temporal dead zone — nmSim is declared further down)
      try {
        if(nmSim) nmSim.force('center',d3.forceCenter(NM_W()/2,NM_H()/2).strength(0.04)).alpha(0.25).restart();
      } catch(_) { /* nmSim not yet initialized — safe to skip */ }
    }
    nmResize();
    window.addEventListener('resize',nmResize,{passive:true});

    const NM_W=()=>nmContainer.offsetWidth;
    const NM_H=()=>nmContainer.offsetHeight;

    /* Background stars */
    const NM_STARS=[];
    for(let i=0;i<120;i++) NM_STARS.push({
      x:Math.random()*2000,y:Math.random()*800,
      r:Math.random()*1.3+0.2,base:Math.random()*0.45+0.08,phase:Math.random()*Math.PI*2
    });

    /* D3 SVG setup */
    const nmSvg=d3.select('#nm-svg');
    const nmDefs=d3.select('#nm-svg-defs');
    [
      {id:'nm-g-core',c1:'#F4DC88',c2:'#A06818'},
      {id:'nm-g-main',c1:'#5A8AFF',c2:'#122878'},
      {id:'nm-g-cluster',c1:'#3062C8',c2:'#081640'},
      {id:'nm-g-topic',c1:'#213E88',c2:'#060E24'},
    ].forEach(g=>{
      const gr=nmDefs.append('radialGradient').attr('id',g.id).attr('cx','38%').attr('cy','30%');
      gr.append('stop').attr('offset','0%').attr('stop-color',g.c1);
      gr.append('stop').attr('offset','100%').attr('stop-color',g.c2);
    });

    let nmZoom={x:0,y:0,k:1};
    const nmZoomG=nmSvg.append('g');
    nmSvg.call(d3.zoom().scaleExtent([0.1,4]).on('zoom',e=>{
      nmZoomG.attr('transform',e.transform);
      nmZoom=e.transform;
    }));

    let nmSim=d3.forceSimulation(NM_NODES)
      .force('link',d3.forceLink(NM_LINKS).id(d=>d.id)
        .distance(d=>{
          const s=d.source.type||'topic',t=d.target.type||'topic';
          if(s==='core'||t==='core') return (t==='main'||s==='main')?210:258;
          if(s==='main'||t==='main') return 178;
          if(s==='cluster'||t==='cluster') return (t==='topic'||s==='topic')?112:148;
          return 84;
        })
        .strength(d=>{
          const s=d.source.type||'topic',t=d.target.type||'topic';
          if(s==='core'||t==='core') return 0.55; return 0.38;
        })
      )
      .force('charge',d3.forceManyBody().strength(d=>{
        switch(d.type){case 'core':return -1600;case 'main':return -750;case 'cluster':return -400;default:return -130;}
      }).theta(0.9))
      .force('center',d3.forceCenter(NM_W()/2,NM_H()/2).strength(0.04))
      .force('collide',d3.forceCollide(d=>d.r+8).strength(0.6).iterations(1))
      .alphaDecay(0.03).velocityDecay(0.45);

    const nmNodeById={};
    NM_NODES.forEach(n=>{ nmNodeById[n.id]=n; });

    /* 1000 human stars */
    const nmTopicPool=NM_NODES.filter(n=>n.type==='topic'||n.type==='cluster');
    function srand(seed){ let x=seed; return ()=>{ x=((x^(x<<13))^(x>>7)^(x<<17))>>>0; return (x%100000)/100000; }; }
    const NM_HUMANS=[];
    for(let i=0;i<1000;i++){
      const rnd=srand(i*31337+i*i+1);
      const anchor=nmTopicPool[Math.floor(rnd()*nmTopicPool.length)];
      const dist=anchor.r+8+rnd()*55;
      const angle=rnd()*Math.PI*2;
      NM_HUMANS.push({
        anchorId:anchor.id,
        ox:Math.cos(angle)*dist, oy:Math.sin(angle)*dist,
        r:0.7+rnd()*0.8, baseAlpha:0.55+rnd()*0.40,
        phase:rnd()*Math.PI*2, speed:1.4+rnd()*1.2,
        lineAlpha:0.04+rnd()*0.06, showLine:rnd()<0.45,
      });
    }

    /* SVG nodes */
    const nmNodeG=nmZoomG.append('g');
    const nmNodeSel=nmNodeG.selectAll('g.node').data(NM_NODES).join('g').attr('class','node').style('cursor','pointer');
    nmNodeSel.append('circle')
      .attr('r',d=>d.r)
      .attr('fill',d=>d.type==='cluster'?'url(#nm-g-cluster)':d.type==='topic'?'url(#nm-g-topic)':`url(#nm-g-${d.type})`)
      .attr('stroke',d=>d.type==='core'?'#E0C06A':d.type==='main'?'#4A7AE8':d.type==='cluster'?'#2952B3':'#1A3A8F')
      .attr('stroke-width',d=>d.type==='core'?2.5:1);
    nmNodeSel.filter(d=>d.type!=='dot').append('text')
      .attr('text-anchor','middle').attr('dominant-baseline','central')
      .attr('fill',d=>d.type==='core'?'#0A1220':d.type==='main'?'#FFFFFF':d.type==='cluster'?'#E8C97D':'rgba(172,202,255,0.88)')
      .attr('font-family',d=>(d.type==='core'||d.type==='main')?'Cormorant,Georgia,serif':"'Jost',sans-serif")
      .attr('font-size',d=>d.type==='core'?'15px':d.type==='main'?'10.5px':d.type==='cluster'?'9.5px':'8px')
      .attr('font-weight',d=>d.type==='core'?'500':'300')
      .attr('letter-spacing',d=>d.type==='core'?'0.18em':'0.04em')
      .attr('pointer-events','none')
      .each(function(d){
        const el=d3.select(this);
        if(d.type==='topic'&&d.label.length>14){
          const w=d.label.split(' '),m=Math.ceil(w.length/2);
          el.append('tspan').attr('x',0).attr('dy','-0.5em').text(w.slice(0,m).join(' '));
          el.append('tspan').attr('x',0).attr('dy','1em').text(w.slice(m).join(' '));
        } else { el.text(d.label); }
      });
    const NM_URL={
      "network-state":"v2/network-state/index.html","fund":"v2/fund/index.html","education":"v2/education/index.html","research":"v2/research/index.html","media":"v2/media/index.html","builder":"v2/builder/index.html",
      "d-sciences":"v2/sciences/index.html","d-tech":"v2/technology/index.html","d-arts":"v2/arts/index.html","d-nature":"v2/nature/index.html","d-business":"v2/business/index.html","d-money":"v2/money/index.html","d-meta":"v2/metaphysics/index.html","d-lifestyle":"v2/lifestyle/index.html","d-creation":"v2/creation/index.html","d-wellbeing":"v2/wellbeing/index.html","d-society":"v2/society/index.html","d-communication":"v2/communication/index.html","d-energy":"v2/energy/index.html","d-food":"v2/food/index.html","d-play":"v2/play/index.html",
      "t-quantum":"v2/quantum/index.html","t-neuro":"v2/neuroscience/index.html","t-bio":"v2/biology/index.html","t-psych":"v2/psychology/index.html","t-med":"v2/medicine/index.html","t-math":"v2/mathematics/index.html","t-astrophys":"v2/astrophysics/index.html","t-ecology":"v2/ecology/index.html","t-genetics":"v2/genetics/index.html","t-chemistry":"v2/chemistry/index.html",
      "t-ai":"v2/artificial-intelligence/index.html","t-blockchain":"v2/blockchain/index.html","t-decentral":"v2/decentralized-networks/index.html","t-arvr":"v2/ar-vr/index.html","t-biotech":"v2/biotechnology/index.html","t-robotics":"v2/robotics/index.html","t-web3":"v2/web3/index.html","t-quantcomp":"v2/quantum-computing/index.html","t-cybersec":"v2/cybersecurity/index.html",
      "t-music":"v2/music/index.html","t-visual":"v2/visual-art/index.html","t-film":"v2/film/index.html","t-poetry":"v2/poetry/index.html","t-dance":"v2/dance/index.html","t-archit":"v2/architecture/index.html","t-fashion":"v2/fashion/index.html","t-story":"v2/storytelling/index.html","t-photo":"v2/photography/index.html","t-theater":"v2/theater/index.html",
      "t-sacredgeo":"v2/sacred-geometry/index.html","t-astrology":"v2/astrology/index.html","t-climate":"v2/climate/index.html","t-biodivers":"v2/biodiversity/index.html","t-oceans":"v2/oceans/index.html","t-forests":"v2/forests/index.html","t-cosmos":"v2/cosmos/index.html","t-efields":"v2/energy-fields/index.html","t-cycles":"v2/natural-cycles/index.html",
      "t-defi":"v2/defi/index.html","t-impact":"v2/impact-investing/index.html","t-socialent":"v2/social-enterprise/index.html","t-circular":"v2/circular-economy/index.html","t-conscap":"v2/conscious-capital/index.html","t-regenbiz":"v2/regenerative-business/index.html","t-dao":"v2/dao/index.html","t-crypto":"v2/cryptocurrency/index.html","t-wealth-mind":"v2/prosperity-mindset/index.html",
      "t-oneness":"v2/oneness/index.html","t-source":"v2/source/index.html","t-soul":"v2/soul/index.html","t-akashic":"v2/akashic-records/index.html","t-dims":"v2/dimensions/index.html","t-sync":"v2/synchronicity/index.html","t-saclaw":"v2/sacred-law/index.html","t-merkaba":"v2/merkaba/index.html","t-vibration":"v2/vibration/index.html",
      "t-nutrition":"v2/nutrition/index.html","t-movement":"v2/movement/index.html","t-sleep":"v2/sleep/index.html","t-plantmed":"v2/plant-medicine/index.html","t-community":"v2/community/index.html","t-minimalism":"v2/minimalism/index.html","t-detox":"v2/detox/index.html","t-sustliving":"v2/sustainable-living/index.html",
      "t-proddesign":"v2/product-design/index.html","t-systems":"v2/systems-thinking/index.html","t-opensource":"v2/open-source/index.html","t-cocreate":"v2/co-creation/index.html","t-proto":"v2/prototyping/index.html","t-emergence":"v2/emergence/index.html","t-biomimicry":"v2/biomimicry/index.html","t-futuretech":"v2/future-tech/index.html",
      "t-meditation":"v2/meditation/index.html","t-soundheal":"v2/sound-healing/index.html","t-breathwork":"v2/breathwork/index.html","t-somatic":"v2/somatic-therapy/index.html","t-energyheal":"v2/energy-healing/index.html","t-yoga":"v2/yoga/index.html","t-mentalhlth":"v2/mental-health/index.html","t-trauma":"v2/trauma/index.html",
      "t-governance":"v2/governance/index.html","t-indigenous":"v2/indigenous-wisdom/index.html","t-collective":"v2/collective-intelligence/index.html","t-socialmov":"v2/social-movements/index.html","t-peace":"v2/peace/index.html","t-futurecity":"v2/future-cities/index.html","t-edusystem":"v2/education-systems/index.html","t-diaspora":"v2/diaspora/index.html",
      "t-language":"v2/language/index.html","t-speaking":"v2/public-speaking/index.html","t-dialogue":"v2/dialogue/index.html","t-journalism":"v2/journalism/index.html","t-socialmedia":"v2/social-media/index.html","t-nvc":"v2/nonviolent-communication/index.html","t-translation":"v2/translation/index.html","t-broadcasting":"v2/broadcasting/index.html",
      "t-renewable":"v2/renewable-energy/index.html","t-solar":"v2/solar/index.html","t-wind":"v2/wind-energy/index.html","t-geothermal":"v2/geothermal/index.html","t-storage":"v2/energy-storage/index.html","t-bioenergy":"v2/bioenergy/index.html","t-gridtech":"v2/grid-technology/index.html","t-energypolicy":"v2/energy-policy/index.html",
      "t-regenfarm":"v2/regenerative-farming/index.html","t-permaculture":"v2/permaculture/index.html","t-foodsystems":"v2/food-systems/index.html","t-urbanfarm":"v2/urban-farming/index.html","t-fermentation":"v2/fermentation/index.html","t-foodsov":"v2/food-sovereignty/index.html","t-cuisine":"v2/cuisine/index.html","t-aquaculture":"v2/aquaculture/index.html",
      "t-sports":"v2/sports/index.html","t-gaming":"v2/games-gaming/index.html","t-outdoor":"v2/outdoor-adventure/index.html","t-esports":"v2/esports/index.html","t-leisure":"v2/leisure-rest/index.html","t-humor":"v2/humor-comedy/index.html","t-festivals":"v2/festivals-events/index.html","t-playcreat":"v2/play-creativity/index.html"
    };
    let nmWasDragged=false;
    nmNodeSel.call(d3.drag()
      .on('start',(e,d)=>{ nmWasDragged=false; if(!e.active) nmSim.alphaTarget(0.3).restart(); d.fx=d.x; d.fy=d.y; })
      .on('drag',(e,d)=>{ nmWasDragged=true; d.fx=e.x; d.fy=e.y; })
      .on('end',(e,d)=>{ if(!e.active) nmSim.alphaTarget(0); d.fx=null; d.fy=null; })
    );
    nmSim.on('tick',()=>{ nmNodeSel.attr('transform',d=>`translate(${d.x},${d.y})`); });

    /* Hover / tooltip */
    const nmTip=document.getElementById('nm-tooltip');
    let nmHovered=null;
    nmNodeSel
      .on('mouseover',(e,d)=>{
        const conn=new Set([d.id]);
        NM_LINKS.forEach(l=>{
          const s=typeof l.source==='object'?l.source.id:l.source;
          const t=typeof l.target==='object'?l.target.id:l.target;
          if(s===d.id) conn.add(t); if(t===d.id) conn.add(s);
        });
        nmHovered=conn;
        nmNodeSel.style('opacity',n=>conn.has(n.id)?1:0.05);
        nmTip.querySelector('.nm-tip-title').textContent=d.label;
        const clickHint=NM_URL[d.id]?' · click to explore':'';
        nmTip.querySelector('.nm-tip-type').textContent=(d.desc||'')+' · '+({core:'FRQNCY CORE',main:'PILLAR',cluster:'DOMAIN',topic:'TOPIC'}[d.type]||'')+clickHint;
        nmTip.style.opacity=1;
      })
      .on('mousemove',e=>{
        const rect=nmContainer.getBoundingClientRect();
        nmTip.style.left=(e.clientX-rect.left+14)+'px';
        nmTip.style.top=(e.clientY-rect.top-14)+'px';
      })
      .on('mouseout',()=>{ nmTip.style.opacity=0; nmHovered=null; nmNodeSel.style('opacity',1); })
      .on('click',(event,d)=>{
        if(nmWasDragged){ nmWasDragged=false; return; }
        if(event.defaultPrevented) return;
        event.stopPropagation();
        const url=NM_URL[d.id];
        if(url) window.location.assign(url);
      })
      .style('cursor',d=>NM_URL[d.id]?'pointer':'default');

    /* Render loop */
    const nmParticles=[];
    let nmDashOff=0,nmLastMajor=0,nmLastDot=0;
    const nmMajorLinks=NM_LINKS.filter(l=>{ const s=typeof l.source==='object'?l.source.type:null; return s==='core'||s==='main'; });

    function nmSpawn(fromDot){
      if(nmParticles.length>200) return; // cap to prevent unbounded growth
      if(fromDot){
        const h=NM_HUMANS[Math.floor(Math.random()*NM_HUMANS.length)];
        const a=nmNodeById[h.anchorId]; if(!a||a.x===undefined) return;
        const hx=a.x+h.ox,hy=a.y+h.oy,fwd=Math.random()>0.4;
        nmParticles.push({x1:fwd?hx:a.x,y1:fwd?hy:a.y,x2:fwd?a.x:hx,y2:fwd?a.y:hy,prog:0,speed:0.013+Math.random()*0.01,isDot:true});
      } else {
        const l=nmMajorLinks[Math.floor(Math.random()*nmMajorLinks.length)];
        const s=l.source,t=l.target; if(!s||!t||s.x===undefined) return;
        nmParticles.push({x1:s.x,y1:s.y,x2:t.x,y2:t.y,prog:0,speed:0.009+Math.random()*0.006,isDot:false});
      }
    }

    function nmRender(ts){
      requestAnimationFrame(nmRender);
      if(!pageVisible) return; // pause when tab is hidden
      const CW=nmCanvas.width,CH=nmCanvas.height;
      nmCtx.clearRect(0,0,CW,CH);

      const t=ts*0.0007;
      for(let i=0;i<NM_STARS.length;i++){
        const s=NM_STARS[i];
        const a=s.base*(0.65+0.35*Math.sin(t+s.phase));
        nmCtx.fillStyle=`rgba(255,255,255,${a.toFixed(2)})`;
        nmCtx.beginPath(); nmCtx.arc(s.x%CW,s.y%CH,s.r,0,Math.PI*2); nmCtx.fill();
      }

      if(ts-nmLastMajor>320){ nmSpawn(false); nmLastMajor=ts; }
      if(ts-nmLastDot>90){ nmSpawn(true); nmLastDot=ts; }

      const {x:zx,y:zy,k:zk}=nmZoom;
      nmCtx.save();
      nmCtx.translate(zx,zy); nmCtx.scale(zk,zk);

      nmCtx.setLineDash([]);
      nmCtx.strokeStyle='rgba(196,151,58,0.42)'; nmCtx.lineWidth=1.8;
      nmCtx.beginPath();
      NM_LINKS.forEach(l=>{ const s=l.source,t_=l.target; if(!s||!t_||s.x===undefined) return; if(s.type!=='core'&&t_.type!=='core') return; if(nmHovered&&!nmHovered.has(s.id)&&!nmHovered.has(t_.id)) return; nmCtx.moveTo(s.x,s.y); nmCtx.lineTo(t_.x,t_.y); });
      nmCtx.stroke();

      nmCtx.strokeStyle='rgba(74,122,232,0.25)'; nmCtx.lineWidth=1.1;
      nmCtx.beginPath();
      NM_LINKS.forEach(l=>{ const s=l.source,t_=l.target; if(!s||!t_||s.x===undefined) return; if((s.type!=='main'&&t_.type!=='main')||(s.type==='core'||t_.type==='core')) return; if(nmHovered&&!nmHovered.has(s.id)&&!nmHovered.has(t_.id)) return; nmCtx.moveTo(s.x,s.y); nmCtx.lineTo(t_.x,t_.y); });
      nmCtx.stroke();

      nmCtx.strokeStyle='rgba(41,82,179,0.13)'; nmCtx.lineWidth=0.55;
      nmCtx.beginPath();
      NM_LINKS.forEach(l=>{ const s=l.source,t_=l.target; if(!s||!t_||s.x===undefined) return; if(s.type==='core'||t_.type==='core'||s.type==='main'||t_.type==='main') return; if(nmHovered&&!nmHovered.has(s.id)&&!nmHovered.has(t_.id)) return; nmCtx.moveTo(s.x,s.y); nmCtx.lineTo(t_.x,t_.y); });
      nmCtx.stroke();

      NM_NODES.forEach(n=>{
        if(n.x == null) return;
        if(n.type==='core'){ const g=nmCtx.createRadialGradient(n.x,n.y,n.r*0.6,n.x,n.y,n.r*2.4); g.addColorStop(0,'rgba(196,151,58,0.2)'); g.addColorStop(1,'rgba(196,151,58,0)'); nmCtx.fillStyle=g; nmCtx.beginPath(); nmCtx.arc(n.x,n.y,n.r*2.4,0,Math.PI*2); nmCtx.fill(); }
        else if(n.type==='main'){ const g=nmCtx.createRadialGradient(n.x,n.y,n.r*0.5,n.x,n.y,n.r*1.9); g.addColorStop(0,'rgba(74,122,232,0.16)'); g.addColorStop(1,'rgba(74,122,232,0)'); nmCtx.fillStyle=g; nmCtx.beginPath(); nmCtx.arc(n.x,n.y,n.r*1.9,0,Math.PI*2); nmCtx.fill(); }
      });

      const lineGroups=[{a:0.10,lines:[]},{a:0.07,lines:[]},{a:0.04,lines:[]}];
      for(let i=0;i<NM_HUMANS.length;i++){
        const h=NM_HUMANS[i]; if(!h.showLine) continue;
        const a=nmNodeById[h.anchorId]; if(!a||a.x===undefined) continue;
        if(nmHovered&&!nmHovered.has(h.anchorId)) continue;
        const hx=a.x+h.ox,hy=a.y+h.oy;
        const g=h.lineAlpha>0.08?lineGroups[0]:h.lineAlpha>0.055?lineGroups[1]:lineGroups[2];
        g.lines.push(hx,hy,a.x,a.y);
      }
      nmCtx.lineWidth=0.4;
      lineGroups.forEach(g=>{ if(!g.lines.length) return; nmCtx.strokeStyle=`rgba(190,215,255,${g.a})`; nmCtx.beginPath(); for(let j=0;j<g.lines.length;j+=4){ nmCtx.moveTo(g.lines[j],g.lines[j+1]); nmCtx.lineTo(g.lines[j+2],g.lines[j+3]); } nmCtx.stroke(); });

      for(let i=0;i<NM_HUMANS.length;i++){
        const h=NM_HUMANS[i]; const a=nmNodeById[h.anchorId]; if(!a||a.x===undefined) continue;
        const hx=a.x+h.ox,hy=a.y+h.oy;
        const twinkle=0.55+0.45*Math.sin(ts*0.001*h.speed+h.phase);
        const dimmed=nmHovered&&!nmHovered.has(h.anchorId);
        const alpha=dimmed?0.02:h.baseAlpha*twinkle;
        nmCtx.fillStyle=`rgba(220,235,255,${(alpha*0.25).toFixed(2)})`;
        nmCtx.beginPath(); nmCtx.arc(hx,hy,h.r*3.5,0,Math.PI*2); nmCtx.fill();
      }
      for(let i=0;i<NM_HUMANS.length;i++){
        const h=NM_HUMANS[i]; const a=nmNodeById[h.anchorId]; if(!a||a.x===undefined) continue;
        const hx=a.x+h.ox,hy=a.y+h.oy;
        const twinkle=0.55+0.45*Math.sin(ts*0.001*h.speed+h.phase);
        const dimmed=nmHovered&&!nmHovered.has(h.anchorId);
        const alpha=dimmed?0.04:h.baseAlpha*twinkle;
        nmCtx.fillStyle=`rgba(255,255,255,${alpha.toFixed(2)})`;
        nmCtx.beginPath(); nmCtx.arc(hx,hy,h.r,0,Math.PI*2); nmCtx.fill();
      }

      for(let i=nmParticles.length-1;i>=0;i--){
        const p=nmParticles[i]; p.prog+=p.speed;
        if(p.prog>=1){ nmParticles.splice(i,1); continue; }
        const px=p.x1+(p.x2-p.x1)*p.prog,py=p.y1+(p.y2-p.y1)*p.prog;
        const fade=Math.min(p.prog*5,1)*Math.min((1-p.prog)*5,1);
        nmCtx.fillStyle=p.isDot?`rgba(210,230,255,${(0.75*fade).toFixed(2)})`:`rgba(240,210,95,${(0.9*fade).toFixed(2)})`;
        nmCtx.beginPath(); nmCtx.arc(px,py,p.isDot?1.0:2.0,0,Math.PI*2); nmCtx.fill();
      }

      nmCtx.restore();
    }
    requestAnimationFrame(nmRender);
    })();
  } // end _initNetworkMap
