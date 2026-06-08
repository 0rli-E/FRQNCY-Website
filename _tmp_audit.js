const fs = require('fs');
const path = require('path');
process.chdir(path.dirname(__filename));
const beds = ['people','books','orgs','places','media','music','papers'];
const map = {people:'p-',books:'b-',orgs:'o-',places:'pl-',media:'m-',music:'mu-',papers:'pp-'};
for (const b of beds) {
  const idx = fs.readFileSync(b+'/index.html','utf8');
  const d = JSON.parse(fs.readFileSync(b+'.json'));
  const arr = d[b] || d.entries;
  const prefix = map[b];
  const found = new Set();
  let m;
  const r1 = new RegExp('href="[^"]*?'+b+'/([a-z0-9-]+)/[^"]*"','gi');
  while ((m = r1.exec(idx))) found.add(m[1]);
  const r2 = /href="\.?\/?([a-z0-9-]+)\/(?:index\.html)?"/gi;
  while ((m = r2.exec(idx))) found.add(m[1]);
  const slugs = arr.map(e => e.id.replace(new RegExp('^'+prefix),''));
  const missing = slugs.filter(s => !found.has(s));
  console.log(b+': linked='+(slugs.length-missing.length)+'/'+slugs.length+' missing='+missing.length);
  if (missing.length && missing.length < 25) console.log('  '+missing.join(','));
  else if (missing.length) console.log('  first 10: '+missing.slice(0,10).join(','));
}
