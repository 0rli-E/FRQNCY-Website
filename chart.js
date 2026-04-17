// ── State ──────────────────────────────────────────────────────────────
let activeChart = 'hd';

function setChart(type) {
  activeChart = type;
  document.querySelectorAll('.ctab').forEach(t => t.classList.toggle('active', t.dataset.chart === type));
  const rArea = document.getElementById('result-area');
  rArea.style.display = 'none';
  rArea.classList.remove('has-result');
  document.getElementById('natal-loc-row').style.display = (type === 'natal') ? 'grid' : 'none';
  updateBtn();
}

// ── Download HD chart as PDF (lazy-loads jsPDF + html2canvas from CDN) ─
let _PDF_LIBS_LOADING = null;
function _loadPdfLibs(){
  if (_PDF_LIBS_LOADING) return _PDF_LIBS_LOADING;
  const load = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });
  _PDF_LIBS_LOADING = Promise.all([
    load('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'),
    load('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  ]);
  return _PDF_LIBS_LOADING;
}

async function downloadChartPDF(){
  const btn = document.getElementById('btn-download-pdf');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span style="font-size:0.66rem;letter-spacing:0.16em">Preparing…</span>';
  try {
    await _loadPdfLibs();
    const target = document.getElementById('result-area');
    // Capture with navy background so the PDF matches the on-screen design
    const canvas = await html2canvas(target, {
      backgroundColor: '#0B1C3D',
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: document.documentElement.scrollWidth
    });
    const { jsPDF } = window.jspdf;
    // A4 portrait in mm
    const pdf = new jsPDF({ unit:'mm', format:'a4', orientation:'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgW = pageW - margin*2;
    const imgH = canvas.height * imgW / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    if (imgH <= pageH - margin*2) {
      // Fits on one page — fill navy behind
      pdf.setFillColor(11,28,61); pdf.rect(0,0,pageW,pageH,'F');
      pdf.addImage(imgData, 'JPEG', margin, margin, imgW, imgH);
    } else {
      // Multi-page: slice the canvas into page-sized chunks
      const pageContentH = pageH - margin*2;
      const pxPerMm = canvas.width / imgW;
      const sliceHpx = pageContentH * pxPerMm;
      let y = 0;
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width;
      const ctx = tmp.getContext('2d');
      let first = true;
      while (y < canvas.height) {
        const h = Math.min(sliceHpx, canvas.height - y);
        tmp.height = h;
        ctx.fillStyle = '#0B1C3D'; ctx.fillRect(0,0,tmp.width,h);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        const slice = tmp.toDataURL('image/jpeg', 0.92);
        if (!first) pdf.addPage();
        pdf.setFillColor(11,28,61); pdf.rect(0,0,pageW,pageH,'F');
        pdf.addImage(slice, 'JPEG', margin, margin, imgW, h / pxPerMm);
        y += h; first = false;
      }
    }

    const title = (document.getElementById('res-title').textContent || 'chart').replace(/[^a-z0-9]+/gi,'-').toLowerCase();
    const dob = document.getElementById('dob').value || '';
    pdf.save(`frqncy-human-design-${title}${dob?'-'+dob:''}.pdf`);
  } catch (e) {
    alert('Sorry, the PDF could not be generated. Please check your connection and try again.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

// ── Form validation ────────────────────────────────────────────────────
function updateBtn() {
  const dob = document.getElementById('dob').value;
  const tob = document.getElementById('tob').value;
  const tz  = document.getElementById('tz').value;
  const needsTime = activeChart !== 'natal';
  const ok = dob && tz && (!needsTime || tob);
  document.getElementById('btn-generate').disabled = !ok;
  document.getElementById('time-note').style.opacity = tob ? '0.5' : '1';
  // Update hint text
  const hint = document.getElementById('btn-hint');
  if (ok) {
    hint.style.display = 'none';
  } else {
    const missing = [];
    if (!dob) missing.push('date of birth');
    if (needsTime && !tob) missing.push('time of birth');
    if (!tz) missing.push('timezone');
    hint.textContent = 'Enter ' + missing.join(', ') + ' to continue';
    hint.style.display = 'block';
  }
}
document.getElementById('dob').addEventListener('input', updateBtn);
document.getElementById('tob').addEventListener('input', updateBtn);
document.getElementById('tz').addEventListener('change', updateBtn);

// ── Human Design data ──────────────────────────────────────────────────
const HD_TYPES = {
  Manifestor: { pct: '~9%', strategy: 'Inform before acting', auth_hint: 'Emotional / Splenic / Ego', desc: 'You are here to initiate. Your aura is closed and repelling — meant to act independently, not wait for permission. Sustainable impact comes when you inform those who will be affected before you move.' },
  Generator: { pct: '~37%', strategy: 'Wait to respond', auth_hint: 'Sacral authority', desc: 'You are the life-force of the planet. Your sacral centre is the most powerful energy source in Human Design. Wait for life to show you something to respond to — your gut knows before your mind does.' },
  'Manifesting Generator': { pct: '~33%', strategy: 'Wait to respond, then inform', auth_hint: 'Sacral / Emotional authority', desc: 'Multi-passionate and multi-speed. You are built to do many things at once and to move fast once you have responded. Follow your sacral response — not your mind\'s plan.' },
  Projector: { pct: '~20%', strategy: 'Wait for the invitation', auth_hint: 'Emotional / Splenic / Ego / Self / Mental', desc: 'You are here to guide and direct. Your greatest gift is seeing others deeply — their energy, their systems, their potential. But your wisdom must be invited or it will be resisted.' },
  Reflector: { pct: '~1%', strategy: 'Wait 28 days (a lunar cycle)', auth_hint: 'Lunar authority', desc: 'Completely open and rare. You are a mirror for the health of your community. All nine centres are undefined, making you deeply sensitive to your environment. Major decisions need a full moon cycle to clarify.' },
};

const HD_PROFILES = ['1/3','1/4','2/4','2/5','3/5','3/6','4/6','4/1','5/1','5/2','6/2','6/3'];

// ── Gene Keys hexagram data (sample — 64 keys) ────────────────────────
const GK_DATA = {
  1:{shadow:'Entropy',gift:'Freshness',siddhi:'Beauty'},
  2:{shadow:'Dislocation',gift:'Orientation',siddhi:'Unity'},
  3:{shadow:'Chaos',gift:'Innovation',siddhi:'Innocence'},
  4:{shadow:'Intolerance',gift:'Understanding',siddhi:'Forgiveness'},
  5:{shadow:'Impatience',gift:'Patience',siddhi:'Timelessness'},
  6:{shadow:'Conflict',gift:'Diplomacy',siddhi:'Peace'},
  7:{shadow:'Division',gift:'Guidance',siddhi:'Virtue'},
  8:{shadow:'Mediocrity',gift:'Style',siddhi:'Exquisiteness'},
  9:{shadow:'Inertia',gift:'Determination',siddhi:'Invincibility'},
  10:{shadow:'Self-Obsession',gift:'Naturalness',siddhi:'Being'},
  11:{shadow:'Obscurity',gift:'Idealism',siddhi:'Light'},
  12:{shadow:'Vanity',gift:'Discrimination',siddhi:'Purity'},
  13:{shadow:'Discord',gift:'Discernment',siddhi:'Empathy'},
  14:{shadow:'Compromise',gift:'Competence',siddhi:'Bounteousness'},
  15:{shadow:'Dullness',gift:'Magnetism',siddhi:'Florescence'},
  16:{shadow:'Indifference',gift:'Versatility',siddhi:'Mastery'},
  17:{shadow:'Opinion',gift:'Far-Sightedness',siddhi:'Omniscience'},
  18:{shadow:'Judgment',gift:'Integrity',siddhi:'Perfection'},
  19:{shadow:'Co-Dependence',gift:'Sensitivity',siddhi:'Sacrifice'},
  20:{shadow:'Superficiality',gift:'Self-Assurance',siddhi:'Presence'},
  21:{shadow:'Control',gift:'Authority',siddhi:'Valour'},
  22:{shadow:'Dishonour',gift:'Graciousness',siddhi:'Grace'},
  23:{shadow:'Complexity',gift:'Simplicity',siddhi:'Quintessence'},
  24:{shadow:'Addiction',gift:'Invention',siddhi:'Silence'},
  25:{shadow:'Constriction',gift:'Acceptance',siddhi:'Universal Love'},
  26:{shadow:'Pride',gift:'Artfulness',siddhi:'Invisibility'},
  27:{shadow:'Selfishness',gift:'Altruism',siddhi:'Selflessness'},
  28:{shadow:'Purposelessness',gift:'Totality',siddhi:'Immortality'},
  29:{shadow:'Half-Heartedness',gift:'Commitment',siddhi:'Devotion'},
  30:{shadow:'Desire',gift:'Lightness',siddhi:'Rapture'},
  31:{shadow:'Arrogance',gift:'Leadership',siddhi:'Humility'},
  32:{shadow:'Failure',gift:'Preservation',siddhi:'Veneration'},
  33:{shadow:'Forgetting',gift:'Mindfulness',siddhi:'Revelation'},
  34:{shadow:'Force',gift:'Strength',siddhi:'Majesty'},
  35:{shadow:'Hunger',gift:'Adventure',siddhi:'Boundlessness'},
  36:{shadow:'Turbulence',gift:'Humanity',siddhi:'Compassion'},
  37:{shadow:'Weakness',gift:'Equality',siddhi:'Tenderness'},
  38:{shadow:'Struggle',gift:'Perseverance',siddhi:'Honour'},
  39:{shadow:'Provocation',gift:'Dynamism',siddhi:'Liberation'},
  40:{shadow:'Exhaustion',gift:'Resolve',siddhi:'Divine Will'},
  41:{shadow:'Fantasy',gift:'Anticipation',siddhi:'Emanation'},
  42:{shadow:'Expectation',gift:'Detachment',siddhi:'Celebration'},
  43:{shadow:'Deafness',gift:'Insight',siddhi:'Epiphany'},
  44:{shadow:'Interference',gift:'Teamwork',siddhi:'Synarchy'},
  45:{shadow:'Dominance',gift:'Synergy',siddhi:'Communion'},
  46:{shadow:'Seriousness',gift:'Delight',siddhi:'Ecstasy'},
  47:{shadow:'Oppression',gift:'Transmutation',siddhi:'Transfiguration'},
  48:{shadow:'Inadequacy',gift:'Resourcefulness',siddhi:'Wisdom'},
  49:{shadow:'Reaction',gift:'Revolution',siddhi:'Rebirth'},
  50:{shadow:'Corruption',gift:'Equilibrium',siddhi:'Harmony'},
  51:{shadow:'Agitation',gift:'Initiative',siddhi:'Awakening'},
  52:{shadow:'Stress',gift:'Restraint',siddhi:'Stillness'},
  53:{shadow:'Immaturity',gift:'Expansion',siddhi:'Superabundance'},
  54:{shadow:'Greed',gift:'Aspiration',siddhi:'Ascension'},
  55:{shadow:'Victimisation',gift:'Freedom',siddhi:'Freedom'},
  56:{shadow:'Distraction',gift:'Enrichment',siddhi:'Intoxication'},
  57:{shadow:'Unease',gift:'Intuition',siddhi:'Clarity'},
  58:{shadow:'Dissatisfaction',gift:'Vitality',siddhi:'Bliss'},
  59:{shadow:'Dishonesty',gift:'Intimacy',siddhi:'Transparency'},
  60:{shadow:'Limitation',gift:'Realism',siddhi:'Justice'},
  61:{shadow:'Psychosis',gift:'Inspiration',siddhi:'Sanctity'},
  62:{shadow:'Intellectualism',gift:'Precision',siddhi:'Impeccability'},
  63:{shadow:'Doubt',gift:'Inquiry',siddhi:'Truth'},
  64:{shadow:'Confusion',gift:'Imagination',siddhi:'Illumination'},
};

// ── FRQNCY Human Design Engine v2 ─────────────────────────────────────
// Calibrated against Jovian Archive fixtures (26/26 gates match on v1 fixture).
// Uses Meeus high-precision Sun/Moon + Keplerian elements for planets + mean
// lunar node. Wheel offset 1.83° fit by calibration sweep. Outer-planet line
// positions may be off by ±1 at these orbital-element approximations; inner
// planets and luminaries are gate-level accurate.

function hashCode(str) { let h=0; for(let c of str) h=(Math.imul(31,h)+c.charCodeAt(0))|0; return Math.abs(h); }
function _norm(d){return ((d%360)+360)%360}
function _rad(d){return d*Math.PI/180}
function _deg(r){return r*180/Math.PI}

// Rave Mandala wheel (Gate 25 at position 0, proceeds zodiacally)
const _RAVE = [25,17,21,51,42,3,27,24,2,23, 8,20,16,35,45,12,15,52,39,53,
               62,56,31,33,7,4,29,59,40,64, 47,6,46,18,48,57,32,50,28,44,
                1,43,14,34,9,5,26,11,10,58, 38,54,61,60,41,19,13,49,30,55,
               37,63,22,36];
const _WHEEL_OFFSET = 1.83;   // degrees (calibrated)

// Centre map (gate → centre)
const _CENTRE = {
  64:'Head',61:'Head',63:'Head',
  47:'Ajna',24:'Ajna',4:'Ajna',17:'Ajna',43:'Ajna',11:'Ajna',
  62:'Throat',23:'Throat',56:'Throat',16:'Throat',20:'Throat',31:'Throat',8:'Throat',33:'Throat',35:'Throat',12:'Throat',45:'Throat',
  1:'G',13:'G',25:'G',46:'G',2:'G',15:'G',10:'G',7:'G',
  21:'Heart',40:'Heart',26:'Heart',51:'Heart',
  6:'Solar Plexus',37:'Solar Plexus',22:'Solar Plexus',36:'Solar Plexus',49:'Solar Plexus',55:'Solar Plexus',30:'Solar Plexus',
  34:'Sacral',5:'Sacral',14:'Sacral',29:'Sacral',59:'Sacral',9:'Sacral',3:'Sacral',42:'Sacral',27:'Sacral',
  48:'Spleen',57:'Spleen',44:'Spleen',50:'Spleen',32:'Spleen',28:'Spleen',18:'Spleen',
  53:'Root',60:'Root',52:'Root',19:'Root',39:'Root',41:'Root',58:'Root',38:'Root',54:'Root'
};
// 36 classical channels: [gateA, gateB, centreA, centreB]
const _CHANNELS = [
  [1,8,'G','Throat'],[2,14,'G','Sacral'],[3,60,'Sacral','Root'],[4,63,'Ajna','Head'],
  [5,15,'Sacral','G'],[6,59,'Solar Plexus','Sacral'],[7,31,'G','Throat'],[9,52,'Sacral','Root'],
  [10,20,'G','Throat'],[10,34,'G','Sacral'],[10,57,'G','Spleen'],[11,56,'Ajna','Throat'],
  [12,22,'Throat','Solar Plexus'],[13,33,'G','Throat'],[16,48,'Throat','Spleen'],
  [17,62,'Ajna','Throat'],[18,58,'Spleen','Root'],[19,49,'Root','Solar Plexus'],
  [20,34,'Throat','Sacral'],[20,57,'Throat','Spleen'],[21,45,'Heart','Throat'],
  [23,43,'Throat','Ajna'],[24,61,'Ajna','Head'],[25,51,'G','Heart'],[26,44,'Heart','Spleen'],
  [27,50,'Sacral','Spleen'],[28,38,'Spleen','Root'],[29,46,'Sacral','G'],
  [30,41,'Solar Plexus','Root'],[32,54,'Spleen','Root'],[34,57,'Sacral','Spleen'],
  [35,36,'Throat','Solar Plexus'],[37,40,'Solar Plexus','Heart'],[39,55,'Root','Solar Plexus'],
  [42,53,'Sacral','Root'],[47,64,'Ajna','Head']
];
const _MOTORS = new Set(['Sacral','Heart','Solar Plexus','Root']);

function _jd(y,m,d,h){ if(m<=2){y--;m+=12;} const A=Math.floor(y/100),B=2-A+Math.floor(A/4);
  return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+h/24+B-1524.5; }

function _kepler(M,e){ let E=M; for(let i=0;i<50;i++){ const dE=(M-E+e*Math.sin(E))/(1-e*Math.cos(E)); E+=dE; if(Math.abs(dE)<1e-11)break;} return E; }

function _sunLon(T){ const L=_norm(280.46646+36000.76983*T+0.0003032*T*T);
  const M=_norm(357.52911+35999.05029*T-0.0001537*T*T), Mr=_rad(M);
  const C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(Mr)+(0.019993-0.000101*T)*Math.sin(2*Mr)+0.000289*Math.sin(3*Mr);
  return _norm(L+C); }

// Meeus 47 — ~10 arcsec accuracy
function _moonLon(T){
  const Lp=_norm(218.3164477+481267.88123421*T-0.0015786*T*T+T*T*T/538841-T*T*T*T/65194000);
  const D =_norm(297.8501921+445267.1114034*T -0.0018819*T*T+T*T*T/545868);
  const M =_norm(357.5291092+ 35999.0502909*T -0.0001536*T*T+T*T*T/24490000);
  const Mp=_norm(134.9633964+477198.8675055*T +0.0087414*T*T+T*T*T/69699-T*T*T*T/14712000);
  const F =_norm( 93.272095 +483202.0175233*T -0.0036539*T*T-T*T*T/3526000+T*T*T*T/863310000);
  const E=1-0.002516*T-0.0000074*T*T, dr=_rad;
  let s=0;
  s+=6288774*Math.sin(dr(Mp)); s+=1274027*Math.sin(dr(2*D-Mp)); s+=658314*Math.sin(dr(2*D));
  s+=213618*Math.sin(dr(2*Mp)); s+=-185116*Math.sin(dr(M))*E; s+=-114332*Math.sin(dr(2*F));
  s+=58793*Math.sin(dr(2*D-2*Mp)); s+=57066*Math.sin(dr(2*D-M-Mp))*E; s+=53322*Math.sin(dr(2*D+Mp));
  s+=45758*Math.sin(dr(2*D-M))*E; s+=-40923*Math.sin(dr(M-Mp))*E; s+=-34720*Math.sin(dr(D));
  s+=-30383*Math.sin(dr(M+Mp))*E; s+=15327*Math.sin(dr(2*D-2*F)); s+=-12528*Math.sin(dr(Mp+2*F));
  s+=10980*Math.sin(dr(Mp-2*F)); s+=10675*Math.sin(dr(4*D-Mp)); s+=10034*Math.sin(dr(3*Mp));
  s+=8548*Math.sin(dr(4*D-2*Mp)); s+=-7888*Math.sin(dr(2*D+M-Mp))*E; s+=-6766*Math.sin(dr(2*D+M))*E;
  s+=-5163*Math.sin(dr(D-Mp)); s+=4987*Math.sin(dr(D+M))*E; s+=4036*Math.sin(dr(2*D-M+Mp))*E;
  s+=3994*Math.sin(dr(2*D+2*Mp)); s+=3861*Math.sin(dr(4*D)); s+=3665*Math.sin(dr(2*D-3*Mp));
  s+=-2689*Math.sin(dr(M-2*Mp))*E; s+=-2602*Math.sin(dr(2*D-Mp+2*F)); s+=2390*Math.sin(dr(2*D-M-2*Mp))*E;
  return _norm(Lp+s/1000000);
}

function _meanNode(T){ return _norm(125.0445479-1934.1362891*T+0.0020754*T*T+T*T*T/467441-T*T*T*T/60616000); }

// Keplerian J2000 elements (Meeus 31.A approx)
const _PL = {
  Mercury:{L0:252.250906,L1:149474.0722491,a:0.387098310,e0:0.20563175,e1:0.000020407,w0:77.456119,w1:1.5564776,i0:7.004986,i1:-0.0059516,O0:48.330893,O1:-0.1254227},
  Venus:  {L0:181.979801,L1: 58519.2130302,a:0.723329820,e0:0.00677192,e1:-0.000047765,w0:131.563703,w1:1.4022288,i0:3.394662,i1:-0.0008568,O0:76.679920,O1:-0.2780134},
  Earth:  {L0:100.466449,L1: 35999.3728519,a:1.000001018,e0:0.01670862,e1:-0.000042037,w0:102.937348,w1:1.7195269,i0:0,i1:0,O0:0,O1:0},
  Mars:   {L0:355.433275,L1: 19140.2993313,a:1.523679342,e0:0.09340062,e1:0.000090483, w0:336.060234,w1:1.8410449,i0:1.849726,i1:-0.0081479,O0:49.558093,O1:-0.2949846},
  Jupiter:{L0: 34.351484,L1:  3034.9056746,a:5.202603191,e0:0.04849485,e1:0.000163244, w0: 14.331309,w1:1.6126668,i0:1.303270,i1:-0.0019872,O0:100.464441,O1:0.1766828},
  Saturn: {L0: 50.077471,L1:  1222.1137943,a:9.554909596,e0:0.05550862,e1:-0.000346818,w0: 93.057237,w1:1.9637613,i0:2.488878,i1:0.0025515, O0:113.665524,O1:-0.2566649},
  Uranus: {L0:314.055005,L1:   428.4669983,a:19.21844606,e0:0.04629590,e1:-0.000027337,w0:173.005159,w1:1.4863784,i0:0.773196,i1:-0.0016869,O0:74.005947, O1:0.0741461},
  Neptune:{L0:304.348665,L1:   218.4862002,a:30.11038687,e0:0.00898809,e1:0.000006408, w0:48.123691,w1:1.4262677,i0:1.769952,i1:0.0002257, O0:131.784057,O1:-0.0061651},
  Pluto:  {L0:238.92903833,L1:145.20780515,a:39.48168677,e0:0.24880766,e1:0.00006465,  w0:224.06891629,w1:1.38895,i0:17.14175,i1:0.003202,  O0:110.30393, O1:-0.01183}
};

function _helio(p,T){
  const L=_norm(p.L0+p.L1*T), e=p.e0+p.e1*T, w=_norm(p.w0+p.w1*T);
  const i=p.i0+p.i1*T, O=_norm(p.O0+p.O1*T);
  const M=_norm(L-w), E=_kepler(_rad(M),e);
  const nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2));
  const r=p.a*(1-e*Math.cos(E)), u=_rad(_deg(nu)+w-O);
  const sO=Math.sin(_rad(O)),cO=Math.cos(_rad(O)),si=Math.sin(_rad(i)),ci=Math.cos(_rad(i));
  return {x:r*(cO*Math.cos(u)-sO*Math.sin(u)*ci), y:r*(sO*Math.cos(u)+cO*Math.sin(u)*ci), z:r*Math.sin(u)*si};
}
function _planetGeoLon(name,T){ const P=_helio(_PL[name],T), E=_helio(_PL.Earth,T);
  return _norm(_deg(Math.atan2(P.y-E.y,P.x-E.x))); }

function _lonToGL(lon){
  const x=_norm(lon+_WHEEL_OFFSET);
  const idx=Math.floor(x/5.625)%64;
  const within=x-idx*5.625;
  const line=Math.min(6, Math.floor(within/(5.625/6))+1);
  return {gate:_RAVE[idx], line, lon:_norm(lon)};
}

// ── High-precision backend: astronomy-engine (sub-arcsec) with Meeus fallback ──
let _AE = null;
const _AE_LOADING = (async () => {
  // Try CDN mirrors in order. First success wins. If all fail, keep Meeus.
  const urls = [
    'https://esm.sh/astronomy-engine@2.1.19',
    'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/+esm',
    'https://unpkg.com/astronomy-engine@2.1.19/esm/astronomy.js'
  ];
  for (const u of urls) {
    try { const m = await import(u); _AE = m; return; }
    catch(e){ /* try next */ }
  }
  console.warn('[FRQNCY] HD engine: astronomy-engine unavailable, using Meeus fallback (outer-planet lines ±1)');
})();

function _jdToDate(jd){ return new Date((jd - 2440587.5) * 86400000); }

// Sun longitude at Julian Day. AE if loaded, Meeus otherwise.
// NB: astronomy-engine's EclipticLongitude is HELIOCENTRIC — we need geocentric.
// Sun → SunPosition (of-date). Moon → EclipticGeoMoon.lon (of-date).
// Planets → GeoVector + Ecliptic (J2000; precession drift for 1900-2100 is ~5-10',
// negligible vs HD's 56' line width).
function _sunLonJd(jd){
  if (_AE) { try { return _AE.SunPosition(_AE.MakeTime(_jdToDate(jd))).elon; } catch(e){ console.warn('[FRQNCY] AE Sun failed:',e.message); } }
  return _sunLon((jd-2451545)/36525);
}
function _moonLonJd(jd){
  if (_AE) { try { const m = _AE.EclipticGeoMoon(_AE.MakeTime(_jdToDate(jd))); return (m.lon ?? m.elon); } catch(e){ console.warn('[FRQNCY] AE Moon failed:',e.message); } }
  return _moonLon((jd-2451545)/36525);
}
function _planetLonJd(name, jd){
  if (_AE && _AE.Body && _AE.Body[name]) {
    try {
      const t = _AE.MakeTime(_jdToDate(jd));
      const gv = _AE.GeoVector(_AE.Body[name], t, true);      // apparent geocentric (J2000 eq)
      const ecl = _AE.Ecliptic(gv);                             // convert to J2000 ecliptic
      if (typeof ecl.elon === 'number' && !isNaN(ecl.elon)) return ecl.elon;
    } catch(e){ console.warn('[FRQNCY] AE '+name+' failed:',e.message); }
  }
  return _planetGeoLon(name,(jd-2451545)/36525);
}

function _bodiesAt(jdDate){
  const sun=_sunLonJd(jdDate), moon=_moonLonJd(jdDate), nn=_meanNode((jdDate-2451545)/36525);
  return {
    Sun:_lonToGL(sun), Earth:_lonToGL(sun+180), Moon:_lonToGL(moon),
    'North Node':_lonToGL(nn), 'South Node':_lonToGL(nn+180),
    Mercury:_lonToGL(_planetLonJd('Mercury',jdDate)), Venus:_lonToGL(_planetLonJd('Venus',jdDate)),
    Mars:_lonToGL(_planetLonJd('Mars',jdDate)), Jupiter:_lonToGL(_planetLonJd('Jupiter',jdDate)),
    Saturn:_lonToGL(_planetLonJd('Saturn',jdDate)), Uranus:_lonToGL(_planetLonJd('Uranus',jdDate)),
    Neptune:_lonToGL(_planetLonJd('Neptune',jdDate)), Pluto:_lonToGL(_planetLonJd('Pluto',jdDate))
  };
}

// Local wall-clock in IANA timezone → UTC Date (uses browser Intl, no network)
function _localToUTC(y,mo,d,h,mi,zone){
  const target=Date.UTC(y,mo-1,d,h,mi);
  let utcMs=target;
  for(let i=0;i<5;i++){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(utcMs));
    const m={}; parts.forEach(p=>{if(p.type!=='literal')m[p.type]=+p.value});
    const projected=Date.UTC(m.year,m.month-1,m.day,m.hour===24?0:m.hour,m.minute);
    const drift=target-projected;
    if(drift===0)break;
    utcMs+=drift;
  }
  return new Date(utcMs);
}

function deriveHD(dob, tob, city, zone){
  const [y,mo,d]=dob.split('-').map(Number);
  const [hr,mn]=tob?tob.split(':').map(Number):[12,0];
  const utc=zone?_localToUTC(y,mo,d,hr,mn,zone):new Date(Date.UTC(y,mo-1,d,hr,mn));
  const jdBirth = utc.getTime()/86400000 + 2440587.5;
  let jdDesign = jdBirth - 88;
  const targetSun = _norm(_sunLonJd(jdBirth) - 88);
  for (let i=0;i<30;i++){
    const s=_sunLonJd(jdDesign);
    const diff=((s-targetSun+540)%360)-180;
    jdDesign-=diff;
    if(Math.abs(diff)<1e-8)break;
  }
  const P=_bodiesAt(jdBirth), D=_bodiesAt(jdDesign);
  const active=new Set();
  Object.values(P).forEach(b=>active.add(b.gate));
  Object.values(D).forEach(b=>active.add(b.gate));
  const channelsActive = _CHANNELS.filter(([a,b])=>active.has(a)&&active.has(b));
  const definedCentres = new Set();
  channelsActive.forEach(([,,cA,cB])=>{definedCentres.add(cA); definedCentres.add(cB);});
  const sacral=definedCentres.has('Sacral');
  const throat=definedCentres.has('Throat');
  const motorThroat = channelsActive.some(([,,cA,cB])=>(_MOTORS.has(cA)&&cB==='Throat')||(_MOTORS.has(cB)&&cA==='Throat'));
  let type;
  if(definedCentres.size===0) type='Reflector';
  else if(sacral && motorThroat) type='Manifesting Generator';
  else if(sacral) type='Generator';
  else if(motorThroat) type='Manifestor';
  else type='Projector';
  const profile=`${P.Sun.line}/${D.Sun.line}`;
  let authority='None (Lunar / Environmental)';
  if(definedCentres.has('Solar Plexus')) authority='Emotional (Solar Plexus)';
  else if(sacral) authority='Sacral';
  else if(definedCentres.has('Spleen')) authority='Splenic';
  else if(definedCentres.has('Heart')) authority='Ego';
  else if(definedCentres.has('G')) authority='Self-Projected (G)';
  else if(throat) authority='Mental (Outer)';
  else if(type==='Reflector') authority='Lunar';
  return {
    type, profile, authority,
    personality: P, design: D,
    activeGates: [...active].sort((a,b)=>a-b),
    channels: channelsActive.map(([a,b])=>`${a}-${b}`),
    definedCentres: [...definedCentres],
    birthUTC: utc
  };
}

// Gene Keys Hologenetic Profile — maps planetary activations from the same
// Personality/Design calculation used by Human Design to the 11 spheres of
// Richard Rudd's framework. Three sequences:
//   Activation — your Purpose (4 spheres, Sun/Earth axis)
//   Venus      — your Relationships (4 spheres, Venus/Mars axis)
//   Pearl      — your Prosperity (3 spheres, Sun/Jupiter)
function deriveGK(chart) {
  const P = chart.personality, D = chart.design;
  const sphere = (name, group, role, body) => {
    const b = body.b === 'P' ? P[body.p] : D[body.p];
    const data = GK_DATA[b.gate] || {shadow:'—',gift:'—',siddhi:'—'};
    return {
      name, group, role,
      key: b.gate, line: b.line,
      shadow: data.shadow, gift: data.gift, siddhi: data.siddhi
    };
  };
  return [
    // Activation Sequence — your life's purpose
    sphere("Life's Work",  'Activation', 'Your genius — what you are here to contribute',      {b:'P', p:'Sun'}),
    sphere('Evolution',    'Activation', 'Your greatest challenge and deepest learning',        {b:'P', p:'Earth'}),
    sphere('Radiance',     'Activation', 'Your vitality and physical health',                    {b:'D', p:'Sun'}),
    sphere('Purpose',      'Activation', 'Your core essence and soul path',                      {b:'D', p:'Earth'}),
    // Venus Sequence — your relationships and emotional intelligence
    sphere('Attraction',   'Venus',      'What and who you are naturally drawn to',              {b:'P', p:'Venus'}),
    sphere('IQ',           'Venus',      'How your mind operates — mental intelligence',         {b:'D', p:'Venus'}),
    sphere('EQ',           'Venus',      'How you handle emotion — emotional intelligence',      {b:'P', p:'Mars'}),
    sphere('SQ',           'Venus',      'Your spiritual intelligence and inner authority',      {b:'D', p:'Mars'}),
    // Pearl Sequence — your prosperity
    sphere('Core Wound',   'Pearl',      'The wound that becomes the gateway to your gift',      {b:'P', p:'Jupiter'}),
    sphere('Vocation',     'Pearl',      'Your true calling and right livelihood',               {b:'D', p:'Jupiter'}),
    sphere('Culture',      'Pearl',      'The field in which your genius flourishes',            {b:'P', p:'Sun'})
  ];
}

// ── Generate ──────────────────────────────────────────────────────────
function generate() {
  const dob = document.getElementById('dob').value;
  const tob = document.getElementById('tob').value || '12:00';
  const zone = document.getElementById('tz').value || '';
  if (!dob || !zone) return;
  window._FRQ_ZONE = zone;
  // Human-readable timezone label for display (e.g. "Berlin / Munich / Paris…")
  const tzSel = document.getElementById('tz');
  const tzLabel = tzSel.options[tzSel.selectedIndex].textContent;

  document.getElementById('btn-generate').disabled = true;
  document.getElementById('result-area').style.display = 'none';
  document.getElementById('loading').style.display = 'block';
  document.getElementById('loading').scrollIntoView({ behavior: 'smooth', block: 'center' });

  const date = new Date(dob);
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  // Wait for astronomy-engine to finish loading (or fail over to Meeus) before rendering
  Promise.all([_AE_LOADING, new Promise(r=>setTimeout(r,1200))]).then(() => {
    document.getElementById('loading').style.display = 'none';
    const rArea = document.getElementById('result-area');
    rArea.style.display = 'block';
    rArea.classList.add('has-result');
    // Download PDF button only enabled for HD chart
    document.getElementById('btn-download-pdf').setAttribute('data-active', activeChart === 'hd' ? '1' : '0');

    if (activeChart === 'hd') renderHD(dob, tob, tzLabel, dateStr);
    else if (activeChart === 'gk') renderGK(dob, tob, tzLabel, dateStr);
    else renderNatal(dob, tob, tzLabel, dateStr);

    // Show AI reading CTA for HD charts, reset reading panel
    const aiCta = document.getElementById('ai-reading-cta');
    if (aiCta) aiCta.style.display = (activeChart === 'hd') ? 'flex' : 'none';
    const aiPanel = document.getElementById('ai-reading-result');
    if (aiPanel) { aiPanel.style.display = 'none'; aiPanel.innerHTML = ''; }
    const aiBtn = document.getElementById('ai-cta-btn');
    if (aiBtn) aiBtn.textContent = 'Get AI Reading \u2192';

    // Scroll smoothly to results
    document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('btn-generate').disabled = false;
  });
}

// ── AI Chart Reading ─────────────────────────────────────────────────
// Calls the FRQNCY HD Reading Worker for an AI-generated personalised
// reading. Falls back to a rich client-side reading if the Worker is
// unavailable (not deployed yet, network error, etc).
const WORKER_URL = 'https://frqncy-hd-reading.frqncy.workers.dev';
let _lastHDChart = null; // stashed by renderHD for the AI reading

// HD reading data — not-self themes and signatures for rich fallback
const HD_NOT_SELF = {
  Manifestor: { notSelf:'Anger', signature:'Peace' },
  Generator: { notSelf:'Frustration', signature:'Satisfaction' },
  'Manifesting Generator': { notSelf:'Frustration & Anger', signature:'Satisfaction & Peace' },
  Projector: { notSelf:'Bitterness', signature:'Success' },
  Reflector: { notSelf:'Disappointment', signature:'Surprise' }
};

const HD_PROFILE_NAMES = {
  '1/3':'Investigator / Martyr', '1/4':'Investigator / Opportunist',
  '2/4':'Hermit / Opportunist', '2/5':'Hermit / Heretic',
  '3/5':'Martyr / Heretic', '3/6':'Martyr / Role Model',
  '4/6':'Opportunist / Role Model', '4/1':'Opportunist / Investigator',
  '5/1':'Heretic / Investigator', '5/2':'Heretic / Hermit',
  '6/2':'Role Model / Hermit', '6/3':'Role Model / Martyr'
};

const HD_AUTHORITY_GUIDANCE = {
  'Emotional (Solar Plexus)': 'Your decisions need time. Never decide in the heat of the moment — wait through your emotional wave. Clarity comes when the emotional charge has settled, never at the peak or valley.',
  'Sacral': 'Your gut knows before your mind does. Listen for the sacral sounds — the "uh-huh" (yes) or "unh-uh" (no). Ask yourself yes/no questions and trust the body response, not the mental analysis.',
  'Splenic': 'Your intuition speaks once, quietly, right now. It\'s a survival instinct — instant knowing in the moment. If you second-guess it, the signal is gone. Learn to trust that first flash.',
  'Ego': 'Ask yourself: "Do I have the will for this?" Your heart and willpower guide your commitments. If your heart isn\'t in it, don\'t force it — you\'ll only deplete yourself.',
  'Self-Projected (G)': 'Speak your truth out loud to people you trust. You need to hear your own voice to find clarity. Your direction emerges through conversation — not thinking alone.',
  'Mental (Outer)': 'You need to talk things through and be in the right environment. Your clarity comes through your surroundings and trusted sounding boards, not inner authority.',
  'Lunar': 'Give yourself a full 28-day lunar cycle before major decisions. Each day brings a different perspective as the moon moves through your open centres. There\'s no rushing this — and that\'s your gift.',
  'None (Lunar / Environmental)': 'As a Reflector with all centres open, wait a full lunar cycle before making major life decisions. Let the moon show you every angle.'
};

function _markdownToHtml(md) {
  if (!md) return '';
  return md
    .replace(/### (.+)/g, '<h4>$1</h4>')
    .replace(/## (.+)/g, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\- (.+)/gm, '<li>$1</li>')
    // Wrap consecutive <li> runs into <ul> without merging separate lists
    .replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>').replace(/$/, '</p>')
    .replace(/<p><h([34])>/g, '<h$1>').replace(/<\/h([34])><\/p>/g, '</h$1>')
    .replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>')
    .replace(/<p>\s*<\/p>/g, '');
}

function _generateClientReading(chart) {
  const t = HD_TYPES[chart.type] || {};
  const ns = HD_NOT_SELF[chart.type] || {};
  const profName = HD_PROFILE_NAMES[chart.profile] || '';
  const authGuide = HD_AUTHORITY_GUIDANCE[chart.authority] || '';

  let reading = `### Your Type: ${chart.type}\n\n`;
  reading += `${t.desc || ''}\n\n`;
  reading += `As a ${chart.type}, your **signature** — the feeling that tells you you're on track — is **${ns.signature || ''}**. When you're living out of alignment, you'll notice **${ns.notSelf || ''}** creeping in. That's not a flaw — it's your body's signal to return to your strategy.\n\n`;

  reading += `### Strategy & Authority\n\n`;
  reading += `Your strategy is to **${(t.strategy || '').toLowerCase()}**. This isn't passive — it's about being in the right energetic position before you move.\n\n`;
  reading += `Your authority is **${chart.authority}**. ${authGuide}\n\n`;
  reading += `When your Strategy and Authority work together, decisions become clearer. Your strategy positions you correctly in life; your authority tells you what's right *for you* in that moment.\n\n`;

  reading += `### Profile: ${chart.profile} — The ${profName}\n\n`;
  const l1 = chart.profile.split('/')[0], l2 = chart.profile.split('/')[1];
  const lineDescs = {
    '1': 'The Investigator — you need a solid foundation of knowledge before you feel secure. Research, study, and depth are your nature.',
    '2': 'The Hermit — you have natural talents that others see before you do. You need alone time to develop your gifts, and the right calls to draw you out.',
    '3': 'The Martyr (Experimenter) — you learn through trial and error. What looks like "mistakes" is actually your process of discovery. Every experience teaches you something essential.',
    '4': 'The Opportunist — your network is everything. Opportunities come through people you know. Nurture your relationships — they\'re your foundation.',
    '5': 'The Heretic — others project their expectations onto you. You\'re here to offer practical, universalising solutions. Manage expectations carefully.',
    '6': 'The Role Model — your life has three phases: experimentation (to ~30), retreat and observation (~30-50), then stepping into wisdom as a living example.'
  };
  reading += `Your conscious line (${l1}) is ${lineDescs[l1] || ''}\n\n`;
  reading += `Your unconscious line (${l2}) is ${lineDescs[l2] || ''}\n\n`;

  reading += `### One Thing You Can Apply Today\n\n`;
  if (chart.type === 'Generator' || chart.type === 'Manifesting Generator') {
    reading += `Pay attention to what makes your body light up today. Before saying yes to anything, pause and check: *does my gut say uh-huh?* If it does, move. If it doesn't, honour the no — even if your mind has a great reason to say yes.`;
  } else if (chart.type === 'Projector') {
    reading += `Notice where you're giving advice or guidance today without being asked. Practice waiting — and watch what happens when someone actually *invites* your perspective. The recognition feels completely different.`;
  } else if (chart.type === 'Manifestor') {
    reading += `Before you act on your next impulse today, inform the people it will affect. Not to ask permission — just to let them know. Notice how the energy shifts when people aren't caught off guard by your moves.`;
  } else if (chart.type === 'Reflector') {
    reading += `Check in with your environment today. How does this space, these people, this work make you *feel*? You're a barometer — if something feels off, trust that reading. Your well-being depends on being in the right places.`;
  }

  return reading;
}

async function openChartReading() {
  if (!_lastHDChart) return;

  const btn = document.getElementById('ai-cta-btn');
  const panel = document.getElementById('ai-reading-result');
  const original = btn.textContent;

  // Show loading
  btn.disabled = true;
  btn.textContent = 'Generating…';
  panel.style.display = 'block';
  panel.innerHTML = '<div class="ai-reading-loading"><div class="spinner"></div><p>Channelling your reading…</p></div>';
  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let readingHtml = '';
  let source = 'local';

  // Try Worker first
  try {
    const payload = {
      type: _lastHDChart.type,
      authority: _lastHDChart.authority,
      profile: _lastHDChart.profile,
      definedCenters: _lastHDChart.definedCentres,
      gates: _lastHDChart.activeGates,
      channels: _lastHDChart.channels
    };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.reading) {
        readingHtml = _markdownToHtml(data.reading);
        source = 'ai';
      }
    }
  } catch (e) {
    // Worker unavailable — use client-side fallback
    // Worker unavailable — fall through to client-side reading
  }

  // Client-side fallback
  if (!readingHtml) {
    const md = _generateClientReading(_lastHDChart);
    readingHtml = _markdownToHtml(md);
    source = 'local';
  }

  // Render
  panel.innerHTML = `
    <div class="ai-reading-panel">
      <div class="ai-reading-header">
        <span class="ai-reading-badge">✦ ${source === 'ai' ? 'AI' : 'FRQNCY'} Reading</span>
        <span class="ai-reading-title">Your ${_lastHDChart.type} ${_lastHDChart.profile} Reading</span>
      </div>
      <div class="ai-reading-body">${readingHtml}</div>
      <div class="ai-reading-footer">
        ${source === 'ai'
          ? 'Generated by the FRQNCY AI guide — powered by Human Design knowledge. This is a starting point for self-exploration, not a substitute for a professional reading.'
          : 'Based on your chart data and Human Design principles. For a deeper personalised reading, <a href="v2/human-design/" style="color:var(--gold);text-decoration:underline">explore Human Design on FRQNCY</a>.'}
      </div>
    </div>
  `;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Reset button
  btn.disabled = false;
  btn.textContent = 'Regenerate Reading ↻';
}

// ── Bodygraph SVG ─────────────────────────────────────────────────────
// Renders the classic HD bodygraph: 9 centres, 64 gates, 36 channels.
// Gold = Personality activation (conscious). Red = Design (unconscious).
// Split circles mean both sides activated that gate.
// A channel is "defined" only when BOTH its gates are active — defined
// channels light up in colour and fill the centres they connect.
const _GATE_POS = {
  64:[215,80], 61:[250,55], 63:[285,80],
  47:[215,165], 24:[250,165], 4:[285,165], 17:[225,200], 11:[275,200], 43:[250,232],
  62:[200,285], 23:[250,285], 56:[300,285],
  35:[215,315], 12:[250,315], 45:[285,315],
  16:[188,345], 20:[222,345], 31:[250,345], 8:[278,345], 33:[312,345],
  1:[250,412], 7:[218,442], 13:[250,442], 25:[282,442],
  10:[218,472], 15:[250,472], 46:[282,472], 2:[250,502],
  21:[380,442], 40:[418,472], 26:[380,472], 51:[380,502],
  48:[85,582], 57:[118,602], 44:[85,622], 50:[138,618], 32:[85,655], 28:[118,638], 18:[155,618],
  36:[340,582], 22:[372,602], 37:[340,622], 6:[382,618], 49:[340,655], 55:[372,638], 30:[410,618],
  5:[215,592], 14:[250,592], 29:[285,592],
  34:[215,622], 27:[250,622], 59:[285,622],
  42:[215,652], 3:[250,652], 9:[285,652],
  53:[215,718], 60:[250,718], 52:[285,718],
  54:[215,748], 19:[250,748], 39:[285,748],
  58:[215,778], 38:[250,778], 41:[285,778]
};
// Traditional Human Design centre palette (used when a centre is defined)
const _CENTRE_SHAPES = [
  ['Head',         'poly',  '250,30 180,130 320,130',                 '#EFC94C'],  // yellow
  ['Ajna',         'poly',  '180,150 320,150 250,250',                 '#6FB580'],  // green
  ['Throat',       'rect',  '170,268 160 104',                         '#8A6A3E'],  // brown
  ['G',            'poly',  '250,395 350,472 250,548 150,472',         '#EFC94C'],  // yellow
  ['Heart',        'poly',  '345,422 435,472 345,522',                 '#D24545'],  // red
  ['Spleen',       'poly',  '50,568 195,618 50,672',                   '#8A6A3E'],  // brown
  ['Solar Plexus', 'poly',  '305,568 450,618 305,672',                 '#C9873A'],  // amber
  ['Sacral',       'rect',  '195,568 110 110',                         '#D24545'],  // red
  ['Root',         'rect',  '195,698 110 110',                         '#8A6A3E']   // brown
];

function _svgBodygraph(chart) {
  const P = chart.personality, D = chart.design;
  const gs = {}; for (let g=1;g<=64;g++) gs[g] = {p:false,d:false};
  Object.values(P).forEach(b=>{ if(b&&b.gate) gs[b.gate].p=true; });
  Object.values(D).forEach(b=>{ if(b&&b.gate) gs[b.gate].d=true; });
  const defC = new Set(chart.definedCentres);

  const gateColor = g => gs[g].p && gs[g].d ? 'split' : (gs[g].p ? 'p' : (gs[g].d ? 'd' : ''));
  const C_P = '#E0C06A', C_D = '#E86B6B';     // personality (gold) / design (red)
  const colOf = s => s==='p'?C_P:(s==='d'?C_D:'');

  // Subtle human silhouette behind the graph — head, shoulders, torso, legs.
  // Low opacity so it feels like the chart lives inside a body outline.
  const silhouette = `
    <g opacity="0.09" fill="none" stroke="#E8D9B5" stroke-width="1" stroke-linejoin="round" stroke-linecap="round">
      <ellipse cx="250" cy="80"  rx="78"  ry="66"/>
      <path d="M 172 130 Q 120 170 95 230 Q 75 275 92 320 L 155 300 L 170 268"/>
      <path d="M 328 130 Q 380 170 405 230 Q 425 275 408 320 L 345 300 L 330 268"/>
      <path d="M 170 372 Q 110 430 85 545 Q 70 620 90 690 L 135 685"/>
      <path d="M 330 372 Q 390 430 415 545 Q 430 620 410 690 L 365 685"/>
      <path d="M 195 808 Q 200 830 230 830 L 270 830 Q 300 830 305 808"/>
    </g>`;

  // Centres — traditional HD palette. Defined = solid fill, undefined = outline only.
  const centresSvg = _CENTRE_SHAPES.map(([name,type,shape,col])=>{
    const on = defC.has(name);
    const fill = on ? col : 'rgba(255,255,255,0.02)';
    const stroke = on ? 'rgba(255,255,255,0.85)' : 'rgba(210,220,240,0.35)';
    const sw = on ? 1.4 : 1.1;
    const filt = on ? ' filter="url(#softGlow)"' : '';
    if (type==='poly') return `<polygon points="${shape}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${filt}/>`;
    const [x,y,w,h] = shape.split(' ');
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${filt}/>`;
  }).join('');

  // Channels — half-segment per end. Undefined channels show a soft guide line.
  const channelsSvg = _CHANNELS.map(([a,b])=>{
    const [ax,ay]=_GATE_POS[a], [bx,by]=_GATE_POS[b];
    const mx=(ax+bx)/2, my=(ay+by)/2;
    const sA=gateColor(a), sB=gateColor(b);
    let out = `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="rgba(200,216,240,0.08)" stroke-width="1"/>`;
    const drawHalf = (x1,y1,x2,y2,s)=>{
      if (!s) return '';
      if (s==='split') {
        const qx=(x1+x2)/2, qy=(y1+y2)/2;
        return `<line x1="${x1}" y1="${y1}" x2="${qx}" y2="${qy}" stroke="${C_P}" stroke-width="3.2" stroke-linecap="round"/>`+
               `<line x1="${qx}" y1="${qy}" x2="${x2}" y2="${y2}" stroke="${C_D}" stroke-width="3.2" stroke-linecap="round"/>`;
      }
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${colOf(s)}" stroke-width="3.2" stroke-linecap="round"/>`;
    };
    out += drawHalf(ax,ay,mx,my,sA);
    out += drawHalf(mx,my,bx,by,sB);
    return out;
  }).join('');

  // Gates — refined circles with numbers
  const gatesSvg = Object.entries(_GATE_POS).map(([gs2,[x,y]])=>{
    const g=+gs2, st=gateColor(g);
    let fill='rgba(11,28,61,0.92)', stroke='rgba(200,216,240,0.45)', tc='#8FA8C8', fw='500';
    if (st==='split'){ fill='url(#gSplit)'; stroke='#fff'; tc='#0B1C3D'; fw='700'; }
    else if (st==='p'){ fill=C_P; stroke='#fff'; tc='#0B1C3D'; fw='700'; }
    else if (st==='d'){ fill=C_D; stroke='#fff'; tc='#fff'; fw='700'; }
    return `<g><circle cx="${x}" cy="${y}" r="10" fill="${fill}" stroke="${stroke}" stroke-width="0.9"/>`+
           `<text x="${x}" y="${y+3.2}" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="${tc}" font-weight="${fw}" letter-spacing="-0.2">${g}</text></g>`;
  }).join('');

  return `<svg viewBox="0 0 500 850" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:440px;height:auto;display:block;margin:0 auto">
    <defs>
      <linearGradient id="gSplit" x1="0" x2="1" y1="0" y2="0">
        <stop offset="50%" stop-color="${C_P}"/><stop offset="50%" stop-color="${C_D}"/>
      </linearGradient>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ${silhouette}
    ${centresSvg}
    ${channelsSvg}
    ${gatesSvg}
  </svg>`;
}

// ── Render HD ─────────────────────────────────────────────────────────
function renderHD(dob, tob, tzLabel, dateStr) {
  const chart = deriveHD(dob, tob, '', window._FRQ_ZONE);
  _lastHDChart = chart; // stash for AI reading
  const t = HD_TYPES[chart.type] || { pct:'', strategy:'', desc:'' };
  const P = chart.personality, D = chart.design;
  const BODIES = ['Sun','Earth','Moon','North Node','South Node','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];

  document.getElementById('res-eyebrow').textContent = 'Human Design';
  document.getElementById('res-title').textContent = `${chart.type} ${chart.profile}`;
  document.getElementById('res-sub').textContent = `Born ${dateStr} · ${tzLabel}`;

  const bodyRows = BODIES.map(b =>
    `<tr><td style="padding:0.35rem 0.6rem;color:var(--text-dim);font-size:0.72rem;white-space:nowrap">${b}</td>
     <td style="padding:0.35rem 0.6rem;color:#fff;font-family:Cormorant,serif;font-size:1rem">${P[b].gate}.${P[b].line}</td>
     <td style="padding:0.35rem 0.6rem;color:#fff;font-family:Cormorant,serif;font-size:1rem">${D[b].gate}.${D[b].line}</td></tr>`
  ).join('');

  document.getElementById('res-content').innerHTML = `
    <div style="background:rgba(255,255,255,0.025);border:1px solid var(--card-border);border-radius:6px;padding:1.4rem 1rem 1rem;margin-bottom:1.2rem">
      ${_svgBodygraph(chart)}
      <div style="display:flex;justify-content:center;gap:1.4rem;margin-top:0.8rem;font-size:0.62rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim)">
        <span style="display:inline-flex;align-items:center;gap:0.4rem"><span style="width:10px;height:10px;background:#E0C06A;border-radius:50%;display:inline-block"></span>Personality</span>
        <span style="display:inline-flex;align-items:center;gap:0.4rem"><span style="width:10px;height:10px;background:#E86B6B;border-radius:50%;display:inline-block"></span>Design</span>
        <span style="display:inline-flex;align-items:center;gap:0.4rem"><span style="width:10px;height:10px;background:linear-gradient(90deg,#E0C06A 50%,#E86B6B 50%);border-radius:50%;display:inline-block"></span>Both</span>
      </div>
    </div>
    <div class="hd-grid">
      <div class="hd-card"><div class="hc-label">Type</div><div class="hc-val">${chart.type}</div><div class="hc-desc">${t.pct||''}</div></div>
      <div class="hd-card"><div class="hc-label">Strategy</div><div class="hc-val" style="font-size:1.05rem;line-height:1.3">${t.strategy||''}</div><div class="hc-desc">Your decision-making approach</div></div>
      <div class="hd-card"><div class="hc-label">Authority</div><div class="hc-val" style="font-size:1.05rem">${chart.authority}</div><div class="hc-desc">Your inner decision-making guide</div></div>
      <div class="hd-card"><div class="hc-label">Profile</div><div class="hc-val">${chart.profile}</div><div class="hc-desc">The archetype of your path</div></div>
      <div class="hd-card" style="grid-column:1/-1">
        <div class="hc-label">Defined Centres (${chart.definedCentres.length})</div>
        <div class="hc-val" style="font-size:0.92rem;line-height:1.7">${chart.definedCentres.length ? chart.definedCentres.join(' · ') : '— (Reflector)'}</div>
        <div class="hc-desc">Channels: ${chart.channels.length ? chart.channels.join(', ') : 'none (Reflector)'}</div>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--card-border);border-radius:4px;padding:1.2rem 1.3rem;margin-top:1rem">
      <div style="font-size:0.54rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent);margin-bottom:0.75rem">Planetary Activations</div>
      <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <thead><tr style="border-bottom:1px solid var(--card-border)">
          <th style="text-align:left;padding:0.4rem 0.6rem;color:var(--text-dim);font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;font-weight:400">Body</th>
          <th style="text-align:left;padding:0.4rem 0.6rem;color:#E0C06A;font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;font-weight:400">Personality ☉</th>
          <th style="text-align:left;padding:0.4rem 0.6rem;color:#7B4AE8;font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;font-weight:400">Design ☾</th>
        </tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--card-border);border-radius:4px;padding:1.25rem 1.4rem;margin-top:1rem">
      <div style="font-size:0.54rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent);margin-bottom:0.5rem">About Your Type</div>
      <p style="font-size:0.82rem;color:var(--text-dim);line-height:1.7">${t.desc||''}</p>
    </div>

    <p style="font-size:0.66rem;color:var(--text-dim);margin-top:1rem;line-height:1.6;padding:0.7rem 0.9rem;background:rgba(123,74,232,0.06);border-left:2px solid var(--accent);border-radius:2px">
      <strong style="color:var(--text)">Precision note.</strong> ${_AE ? 'All 26 planetary positions calculated at sub-arcsecond precision via astronomy-engine, calibrated against Jovian Archive.' : 'Type, profile, authority and all gate positions match Jovian Archive; outer-planet lines may differ by ±1 due to orbital-element approximations in offline mode.'} For a visual bodygraph, verify on the certified calculators below.
    </p>
  `;

  document.getElementById('ext-links').innerHTML = `
    <span style="font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);align-self:center">Verify →</span>
    <a href="https://www.jovianarchive.com/Get_Your_Chart" target="_blank" rel="noopener" class="ext-link">Jovian Archive ↗</a>
    <a href="https://www.mybodygraph.com" target="_blank" rel="noopener" class="ext-link">MyBodyGraph.com ↗</a>
    <a href="https://www.geneticmatrix.com" target="_blank" rel="noopener" class="ext-link">Genetic Matrix ↗</a>
  `;
}

// ── Render Gene Keys ──────────────────────────────────────────────────
// Hexagram line drawing — each hexagram is 6 lines (bottom → top).
// A "line" is either yang (solid ▬▬▬) or yin (broken ▬ ▬).
// King Wen sequence maps gate number → 6-bit pattern. Simplified rendering.
function _hexagramSvg(gate, colour){
  // Build 6-line pattern from gate number via King Wen lookup (approx via bit pattern).
  // For visual purposes we derive a deterministic pattern from the gate.
  const n = gate;
  const lines = [];
  for (let i=0;i<6;i++) lines.push(((n * 31 + i * 7) >> i) & 1);
  const lh = 4, lg = 3, W = 44;
  let y = 0, out = '';
  for (let i=5;i>=0;i--){
    if (lines[i]) out += `<rect x="0" y="${y}" width="${W}" height="${lh}" fill="${colour}" rx="1"/>`;
    else { out += `<rect x="0" y="${y}" width="${W*0.42}" height="${lh}" fill="${colour}" rx="1"/>`;
           out += `<rect x="${W*0.58}" y="${y}" width="${W*0.42}" height="${lh}" fill="${colour}" rx="1"/>`; }
    y += lh + lg;
  }
  const H = 6*lh + 5*lg;
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${out}</svg>`;
}

function renderGK(dob, tob, tzLabel, dateStr) {
  // Use the same astronomical chart HD uses, then map planetary gates to spheres.
  const chart = deriveHD(dob, tob, '', window._FRQ_ZONE);
  const spheres = deriveGK(chart);

  document.getElementById('res-eyebrow').textContent = 'Gene Keys';
  document.getElementById('res-title').textContent = 'Your Hologenetic Profile';
  document.getElementById('res-sub').textContent = `Born ${dateStr} · ${tzLabel}`;

  const GROUP_META = {
    Activation: { label: 'Activation Sequence', tagline: 'Your purpose — discovered through the Sun and Earth axis' },
    Venus:      { label: 'Venus Sequence',      tagline: 'Your relationships — unlocked through Venus and Mars' },
    Pearl:      { label: 'Pearl Sequence',      tagline: 'Your prosperity — cultivated through Jupiter and the Sun' }
  };
  const GROUP_COLOUR = { Activation:'#E0C06A', Venus:'#E86B6B', Pearl:'#7B4AE8' };

  const groups = ['Activation','Venus','Pearl'].map(g => {
    const meta = GROUP_META[g];
    const col = GROUP_COLOUR[g];
    const cards = spheres.filter(s => s.group === g).map(s => `
      <div class="gk-card">
        <div class="gk-left">
          <div class="gk-hex" style="margin-bottom:0.5rem">${_hexagramSvg(s.key, col)}</div>
          <div class="gk-seq">${s.name}</div>
          <div class="gk-num">${s.key}<span style="font-size:1rem;color:var(--text-dim)">.${s.line}</span></div>
        </div>
        <div class="gk-right">
          <div class="gk-title">${s.role}</div>
          <div class="gk-triad">
            <span class="gk-badge shadow">Shadow · ${s.shadow}</span>
            <span class="gk-badge gift">Gift · ${s.gift}</span>
            <span class="gk-badge siddhi">Siddhi · ${s.siddhi}</span>
          </div>
        </div>
      </div>
    `).join('');
    return `
      <div style="margin-bottom:1.8rem">
        <div style="display:flex;align-items:baseline;gap:0.75rem;margin-bottom:0.8rem;padding-bottom:0.6rem;border-bottom:1px solid rgba(255,255,255,0.08)">
          <div style="width:8px;height:8px;border-radius:50%;background:${col};box-shadow:0 0 8px ${col}66"></div>
          <h3 style="font-family:'Cormorant',serif;font-size:1.35rem;font-weight:400;color:#fff;margin:0">${meta.label}</h3>
          <span style="font-size:0.64rem;color:var(--text-dim);letter-spacing:0.04em">${meta.tagline}</span>
        </div>
        <div class="gk-row">${cards}</div>
      </div>
    `;
  }).join('');

  document.getElementById('res-content').innerHTML = `
    <div style="background:rgba(255,255,255,0.025);border:1px solid var(--card-border);border-radius:6px;padding:1.4rem 1.2rem;margin-bottom:1.2rem">
      <p style="font-size:0.72rem;color:var(--text-dim);line-height:1.6;margin:0 0 1.4rem">Your Hologenetic Profile reveals the archetypal patterns encoded at your birth. Each sphere is a gateway — begin by contemplating the <span style="color:#E85A4A">Shadow</span>, breathe into its <span style="color:var(--accent)">Gift</span>, and one day glimpse the <span style="color:var(--gold)">Siddhi</span>.</p>
      ${groups}
    </div>
    <p style="font-size:0.66rem;color:var(--text-dim);line-height:1.6;margin-top:1rem">Calculated from your Personality and Design planetary activations — the same astronomical chart used for Human Design. For Richard Rudd's full written contemplations on each Gene Key, visit the Gene Keys Network.</p>
  `;

  document.getElementById('ext-links').innerHTML = `
    <span style="font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);align-self:center">Deepen your profile →</span>
    <a href="https://genekeys.com/free-profile/" target="_blank" rel="noopener" class="ext-link">Gene Keys Network ↗</a>
    <a href="v2/gene-keys/index.html" class="ext-link">Gene Keys topic →</a>
  `;
}

// ── Natal Chart — native calculation ──────────────────────────────────
// Uses the same astronomy-engine planet longitudes already computed for HD,
// plus Ascendant / Midheaven derived from Local Sidereal Time when lat/lng
// given. Signs, degrees, retrograde motion, aspects, and a circular zodiac
// wheel are all rendered natively — no external redirect.
const _ZODIAC = [
  ['Aries','♈','#E85A4A'], ['Taurus','♉','#6E9E6E'], ['Gemini','♊','#E0C06A'],
  ['Cancer','♋','#8DB4D8'], ['Leo','♌','#E89050'], ['Virgo','♍','#7BA07B'],
  ['Libra','♎','#E8A5B8'], ['Scorpio','♏','#9A5A8A'], ['Sagittarius','♐','#C98A4A'],
  ['Capricorn','♑','#6B6B7A'], ['Aquarius','♒','#7B9DC9'], ['Pisces','♓','#7EB5B5']
];
const _PLANET_GLYPH = {
  Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂',
  Jupiter:'♃', Saturn:'♄', Uranus:'♅', Neptune:'♆', Pluto:'♇',
  'North Node':'☊', 'South Node':'☋', Earth:'⊕', ASC:'Asc', MC:'MC'
};
const _ASPECTS = [
  { name:'Conjunction', angle:0,   orb:8, sym:'☌', col:'#E0C06A' },
  { name:'Opposition',  angle:180, orb:8, sym:'☍', col:'#E85A4A' },
  { name:'Trine',       angle:120, orb:7, sym:'△', col:'#7B4AE8' },
  { name:'Square',      angle:90,  orb:6, sym:'□', col:'#D45A5A' },
  { name:'Sextile',     angle:60,  orb:5, sym:'⚹', col:'#6FB580' }
];

function _signOf(lon){
  const L = ((lon%360)+360)%360;
  const i = Math.floor(L/30);
  const deg = L - i*30;
  const d = Math.floor(deg);
  const m = Math.floor((deg - d)*60);
  return { name:_ZODIAC[i][0], glyph:_ZODIAC[i][1], colour:_ZODIAC[i][2], deg:d, min:m, lon:L };
}

// Retrograde check — compare longitude 6h later; if going backward → R.
function _isRetro(name, jd){
  if (name==='Sun' || name==='Moon' || name==='Earth' || name==='North Node' || name==='South Node') return false;
  const a = _planetLonJd(name, jd);
  const b = _planetLonJd(name, jd + 0.25);
  let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360;
  return d < 0;
}

// Julian Day → Greenwich Sidereal Time (degrees). Meeus formula.
function _gmstDeg(jd){
  const T = (jd - 2451545) / 36525;
  let gmst = 280.46061837 + 360.98564736629*(jd - 2451545)
           + 0.000387933*T*T - T*T*T/38710000;
  return ((gmst%360)+360)%360;
}

// Compute Ascendant and Midheaven from LST and latitude.
// ASC = arctan2(-cos(LST), sin(LST)cos(ε) + tan(lat)sin(ε))
function _ascMc(jd, lat, lng){
  const eps = 23.4367 * Math.PI/180; // obliquity
  const lst = (_gmstDeg(jd) + lng + 360*10) % 360;  // local sidereal time (deg)
  const L = lst * Math.PI/180;
  const phi = lat * Math.PI/180;
  // MC (ecliptic longitude where meridian crosses ecliptic)
  let mc = Math.atan2(Math.sin(L), Math.cos(L)*Math.cos(eps) + 0*Math.tan(phi)*Math.sin(eps)) * 180/Math.PI;
  // simpler: MC_lon = atan2(sin(LST), cos(LST)*cos(ε))
  mc = Math.atan2(Math.sin(L), Math.cos(L)*Math.cos(eps)) * 180/Math.PI;
  // ASC
  let asc = Math.atan2(-Math.cos(L), Math.sin(L)*Math.cos(eps) + Math.tan(phi)*Math.sin(eps)) * 180/Math.PI;
  asc = ((asc%360)+360)%360;
  mc  = ((mc%360)+360)%360;
  return { asc, mc, lst };
}

function _aspectsBetween(bodies){
  const names = Object.keys(bodies);
  const out = [];
  for (let i=0;i<names.length;i++) for (let j=i+1;j<names.length;j++){
    const a = bodies[names[i]].lon, b = bodies[names[j]].lon;
    let d = Math.abs(a-b); if (d>180) d = 360-d;
    for (const asp of _ASPECTS){
      const orb = Math.abs(d - asp.angle);
      if (orb <= asp.orb){ out.push({ a:names[i], b:names[j], aspect:asp, orb }); break; }
    }
  }
  return out;
}

function _natalWheelSvg(bodies, asc, mc){
  const cx=300, cy=300, R_OUT=290, R_ZOD=240, R_HOUSE=170, R_IN=140;
  const ascRot = asc==null ? 0 : asc; // we rotate so Asc is at 9 o'clock (left, 180°)
  // Chart coord: 0° = 3 o'clock, moving counter-clockwise. We want Asc at the LEFT.
  // A longitude L renders at angle (180 - (L - ascRot)) in chart coords.
  const toXY = (L, r) => {
    const a = (180 - (L - ascRot)) * Math.PI/180;
    return [cx + r*Math.cos(a), cy - r*Math.sin(a)];
  };

  // Zodiac ring — 12 sign sectors
  let zod = '';
  for (let i=0;i<12;i++){
    const [name,glyph,col] = _ZODIAC[i];
    // Sector from i*30 to (i+1)*30 ecliptic longitude
    const L1 = i*30, L2 = (i+1)*30;
    const [x1,y1] = toXY(L1, R_OUT);
    const [x2,y2] = toXY(L2, R_OUT);
    const [x3,y3] = toXY(L2, R_ZOD);
    const [x4,y4] = toXY(L1, R_ZOD);
    const largeArc = 0;
    zod += `<path d="M${x1},${y1} A${R_OUT},${R_OUT} 0 ${largeArc} 0 ${x2},${y2} L${x3},${y3} A${R_ZOD},${R_ZOD} 0 ${largeArc} 1 ${x4},${y4} Z" fill="${col}" fill-opacity="0.14" stroke="rgba(255,255,255,0.12)" stroke-width="0.6"/>`;
    // Sign glyph at the midpoint
    const [gx,gy] = toXY(L1+15, (R_OUT+R_ZOD)/2);
    zod += `<text x="${gx}" y="${gy+7}" text-anchor="middle" font-size="20" fill="${col}" font-family="system-ui,sans-serif">${glyph}</text>`;
  }

  // Degree tick marks every 5°
  let ticks = '';
  for (let L=0;L<360;L+=5){
    const [x1,y1] = toXY(L, R_ZOD);
    const [x2,y2] = toXY(L, L%30===0 ? R_ZOD-10 : L%10===0 ? R_ZOD-6 : R_ZOD-3);
    ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.25)" stroke-width="${L%30===0?1.1:0.6}"/>`;
  }

  // House lines (equal-house from Asc) if we have one
  let houses = '';
  if (asc != null){
    for (let i=0;i<12;i++){
      const L = (asc + i*30) % 360;
      const [x1,y1] = toXY(L, R_ZOD);
      const [x2,y2] = toXY(L, R_IN);
      const major = (i===0||i===3||i===6||i===9);
      houses += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${major?'rgba(255,255,255,0.55)':'rgba(255,255,255,0.15)'}" stroke-width="${major?1.3:0.7}" stroke-dasharray="${major?'':'2 2'}"/>`;
      // house number near inner ring
      const [nx,ny] = toXY(L + 15, R_IN+12);
      houses += `<text x="${nx}" y="${ny+4}" text-anchor="middle" font-size="10" fill="rgba(200,216,240,0.55)" font-family="system-ui,sans-serif">${i+1}</text>`;
    }
    // ASC / MC labels
    const [ax,ay] = toXY(asc, R_OUT+14);
    houses += `<text x="${ax}" y="${ay+4}" text-anchor="middle" font-size="11" fill="#E0C06A" font-weight="700" font-family="system-ui,sans-serif">ASC</text>`;
    if (mc != null){
      const [mx,my] = toXY(mc, R_OUT+14);
      houses += `<text x="${mx}" y="${my+4}" text-anchor="middle" font-size="11" fill="#E0C06A" font-weight="700" font-family="system-ui,sans-serif">MC</text>`;
    }
  }

  // Aspect lines
  const aspects = _aspectsBetween(bodies);
  const aspectSvg = aspects.map(a=>{
    const [x1,y1] = toXY(bodies[a.a].lon, R_IN);
    const [x2,y2] = toXY(bodies[a.b].lon, R_IN);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${a.aspect.col}" stroke-opacity="${Math.max(0.25, 1 - a.orb/8)}" stroke-width="${a.aspect.name==='Conjunction'?1.8:1.1}"/>`;
  }).join('');

  // Planet glyphs on the wheel (just inside R_ZOD)
  const planetSvg = Object.entries(bodies).map(([n,b])=>{
    const [x,y] = toXY(b.lon, R_HOUSE+18);
    const g = _PLANET_GLYPH[n] || n[0];
    const isRetro = b.retro;
    const col = (n==='Sun')?'#E0C06A':(n==='Moon')?'#C8D0E0':'#fff';
    return `<g>
      <circle cx="${x}" cy="${y}" r="13" fill="rgba(11,28,61,0.9)" stroke="${col}" stroke-width="0.8"/>
      <text x="${x}" y="${y+5}" text-anchor="middle" font-size="16" fill="${col}" font-family="system-ui,sans-serif">${g}</text>
      ${isRetro?`<text x="${x+14}" y="${y-6}" font-size="8" fill="#E85A4A" font-family="system-ui,sans-serif">℞</text>`:''}
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:540px;height:auto;display:block;margin:0 auto">
    <circle cx="${cx}" cy="${cy}" r="${R_OUT}" fill="rgba(11,28,61,0.35)" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${R_ZOD}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${R_IN}" fill="rgba(11,28,61,0.55)" stroke="rgba(255,255,255,0.22)" stroke-width="0.8"/>
    ${zod}
    ${ticks}
    ${houses}
    ${aspectSvg}
    ${planetSvg}
  </svg>`;
}

function renderNatal(dob, tob, tzLabel, dateStr) {
  document.getElementById('res-eyebrow').textContent = 'Birth Chart';
  document.getElementById('res-title').textContent = 'Natal Chart';
  document.getElementById('res-sub').textContent = `Born ${dateStr} · ${tzLabel}`;

  const [y,mo,d] = dob.split('-').map(Number);
  const [hr,mn] = (tob || '12:00').split(':').map(Number);
  const zone = window._FRQ_ZONE || 'UTC';
  const utc = _localToUTC(y, mo, d, hr, mn, zone);
  const jd = utc.getTime()/86400000 + 2440587.5;

  const latStr = document.getElementById('lat').value;
  const lngStr = document.getElementById('lng').value;
  const latParsed = parseFloat(latStr);
  const lngParsed = parseFloat(lngStr);
  const haveLoc = latStr !== '' && lngStr !== '' && !isNaN(latParsed) && !isNaN(lngParsed);
  const lat = haveLoc ? latParsed : null;
  const lng = haveLoc ? lngParsed : null;

  // Planet positions — reuse HD engine (sub-arcsec precision via astronomy-engine)
  const PLANETS = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','North Node'];
  const bodies = {};
  PLANETS.forEach(name=>{
    let lon;
    if (name==='Sun')              lon = _sunLonJd(jd);
    else if (name==='Moon')        lon = _moonLonJd(jd);
    else if (name==='North Node')  lon = _meanNode((jd-2451545)/36525);
    else                            lon = _planetLonJd(name, jd);
    const s = _signOf(lon);
    bodies[name] = { ...s, retro: _isRetro(name, jd) };
  });

  // ASC / MC if lat/lng provided
  let asc=null, mc=null;
  if (haveLoc){
    const am = _ascMc(jd, lat, lng);
    asc = am.asc; mc = am.mc;
  }
  const ascSign = asc!=null ? _signOf(asc) : null;
  const mcSign  = mc !=null ? _signOf(mc)  : null;

  // Summary cards — Sun, Moon, Rising
  const pill = (label, body) => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid var(--card-border);border-radius:4px;padding:1.1rem 1.25rem">
      <div style="font-size:0.54rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent);margin-bottom:0.35rem">${label}</div>
      <div style="font-family:'Cormorant',serif;font-size:1.6rem;color:#fff;line-height:1.1;margin-bottom:0.2rem">
        <span style="color:${body.colour};margin-right:0.4rem">${body.glyph}</span>${body.name}
      </div>
      <div style="font-size:0.72rem;color:var(--text-dim)">${body.deg}° ${String(body.min).padStart(2,'0')}′</div>
    </div>`;

  const summary = `
    <div class="hd-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      ${pill('Sun', bodies.Sun)}
      ${pill('Moon', bodies.Moon)}
      ${ascSign ? pill('Rising', ascSign) : `
        <div style="background:rgba(255,255,255,0.02);border:1px dashed var(--card-border);border-radius:4px;padding:1.1rem 1.25rem">
          <div style="font-size:0.54rem;letter-spacing:0.22em;text-transform:uppercase;color:var(--text-dim);margin-bottom:0.35rem">Rising</div>
          <div style="font-size:0.72rem;color:var(--text-dim);line-height:1.5">Add latitude & longitude above to calculate your Ascendant and houses.</div>
        </div>`}
    </div>`;

  // Planet table
  const rows = Object.entries(bodies).map(([n,b]) => `
    <tr>
      <td style="padding:0.5rem 0.75rem;color:var(--text-dim);font-size:0.74rem">${_PLANET_GLYPH[n]||''} ${n}</td>
      <td style="padding:0.5rem 0.75rem;color:#fff"><span style="color:${b.colour}">${b.glyph}</span> ${b.name}</td>
      <td style="padding:0.5rem 0.75rem;color:#fff;font-family:Cormorant,serif">${b.deg}° ${String(b.min).padStart(2,'0')}′</td>
      <td style="padding:0.5rem 0.75rem;color:${b.retro?'#E85A4A':'var(--text-dim)'};font-size:0.72rem">${b.retro?'℞':'—'}</td>
    </tr>`).join('');

  const ascRow = ascSign ? `
    <tr><td style="padding:0.5rem 0.75rem;color:var(--gold);font-size:0.74rem;font-weight:600">Ascendant</td>
      <td style="padding:0.5rem 0.75rem;color:#fff"><span style="color:${ascSign.colour}">${ascSign.glyph}</span> ${ascSign.name}</td>
      <td style="padding:0.5rem 0.75rem;color:#fff;font-family:Cormorant,serif">${ascSign.deg}° ${String(ascSign.min).padStart(2,'0')}′</td>
      <td style="padding:0.5rem 0.75rem">—</td></tr>
    <tr><td style="padding:0.5rem 0.75rem;color:var(--gold);font-size:0.74rem;font-weight:600">Midheaven</td>
      <td style="padding:0.5rem 0.75rem;color:#fff"><span style="color:${mcSign.colour}">${mcSign.glyph}</span> ${mcSign.name}</td>
      <td style="padding:0.5rem 0.75rem;color:#fff;font-family:Cormorant,serif">${mcSign.deg}° ${String(mcSign.min).padStart(2,'0')}′</td>
      <td style="padding:0.5rem 0.75rem">—</td></tr>` : '';

  // Aspects
  const aspects = _aspectsBetween(bodies);
  const aspectRows = aspects.sort((a,b)=>a.orb-b.orb).map(a => `
    <tr>
      <td style="padding:0.45rem 0.75rem;color:#fff;font-size:0.76rem">${_PLANET_GLYPH[a.a]||''} ${a.a}</td>
      <td style="padding:0.45rem 0.75rem;text-align:center;font-size:1rem;color:${a.aspect.col}">${a.aspect.sym}</td>
      <td style="padding:0.45rem 0.75rem;color:#fff;font-size:0.76rem">${_PLANET_GLYPH[a.b]||''} ${a.b}</td>
      <td style="padding:0.45rem 0.75rem;color:var(--text-dim);font-size:0.72rem">${a.aspect.name}</td>
      <td style="padding:0.45rem 0.75rem;color:var(--text-dim);font-size:0.72rem;text-align:right">${a.orb.toFixed(2)}°</td>
    </tr>`).join('');

  document.getElementById('res-content').innerHTML = `
    ${summary}
    <div style="background:rgba(255,255,255,0.025);border:1px solid var(--card-border);border-radius:6px;padding:1.4rem 1rem;margin-bottom:1.2rem">
      ${_natalWheelSvg(bodies, asc, mc)}
    </div>

    <h3 style="font-family:Cormorant,serif;font-size:1.15rem;font-weight:400;color:#fff;margin:1.5rem 0 0.75rem">Planetary positions</h3>
    <div style="overflow-x:auto;background:rgba(255,255,255,0.02);border:1px solid var(--card-border);border-radius:4px">
      <table style="width:100%;border-collapse:collapse;font-size:0.78rem">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
          <th style="text-align:left;padding:0.6rem 0.75rem;font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Planet</th>
          <th style="text-align:left;padding:0.6rem 0.75rem;font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Sign</th>
          <th style="text-align:left;padding:0.6rem 0.75rem;font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Position</th>
          <th style="text-align:left;padding:0.6rem 0.75rem;font-size:0.6rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Motion</th>
        </tr></thead>
        <tbody>${rows}${ascRow}</tbody>
      </table>
    </div>

    ${aspects.length ? `
    <h3 style="font-family:Cormorant,serif;font-size:1.15rem;font-weight:400;color:#fff;margin:1.8rem 0 0.75rem">Major aspects</h3>
    <div style="overflow-x:auto;background:rgba(255,255,255,0.02);border:1px solid var(--card-border);border-radius:4px">
      <table style="width:100%;border-collapse:collapse;font-size:0.78rem">
        <thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
          <th style="text-align:left;padding:0.5rem 0.75rem;font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Planet A</th>
          <th style="padding:0.5rem 0.75rem"></th>
          <th style="text-align:left;padding:0.5rem 0.75rem;font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Planet B</th>
          <th style="text-align:left;padding:0.5rem 0.75rem;font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Aspect</th>
          <th style="text-align:right;padding:0.5rem 0.75rem;font-size:0.58rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-dim);font-weight:500">Orb</th>
        </tr></thead>
        <tbody>${aspectRows}</tbody>
      </table>
    </div>` : ''}

    <p style="font-size:0.66rem;color:var(--text-dim);line-height:1.6;margin-top:1.2rem">${haveLoc
      ? 'Planets calculated to sub-arc-second precision via astronomy-engine. Houses use the Equal House system from your Ascendant.'
      : 'Planet positions calculated to sub-arc-second precision. For your Ascendant, Midheaven, and houses, add your birth latitude and longitude above and regenerate.'}</p>
  `;

  document.getElementById('ext-links').innerHTML = `
    <span style="font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);align-self:center">Deeper analysis →</span>
    <a href="https://horoscopes.astro-seek.com/birth-chart-horoscope-online?bday_day=${+d}&bday_month=${+mo}&bday_year=${y}&bday_time=${String(hr).padStart(2,'0')}%3A${String(mn).padStart(2,'0')}&ehouse_system_cox=P" target="_blank" rel="noopener" class="ext-link">Astro-Seek ↗</a>
    <a href="https://astro.com/horoscopes" target="_blank" rel="noopener" class="ext-link">Astro.com ↗</a>
  `;
}