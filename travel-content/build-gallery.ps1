# Builds a self-contained gallery (tunisia-gems-gallery.html) from the enriched JSON.
# Data is embedded inline so it opens directly via file:// (needs internet to load the
# hotlinked Wikimedia Commons thumbnails). Includes search + region filter + attribution.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$data = Get-Content (Join-Path $root 'tunisia-travel-data.json') -Raw | ConvertFrom-Json
$withImg = ($data.gems | Where-Object { $_.image }).Count
$json = ($data | ConvertTo-Json -Depth 12 -Compress)

$html = @'
<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tunisia — 120 Hidden Gems (Photo Gallery)</title>
<style>
  :root{--bg:#0f1115;--card:#181b22;--mut:#9aa4b2;--ac:#e0245e;--tx:#f2f4f8}
  *{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--tx)}
  header{padding:24px 20px 8px;text-align:center}
  h1{margin:0 0 4px;font-size:24px}.sub{color:var(--mut);font-size:13px}
  .controls{position:sticky;top:0;z-index:5;background:rgba(15,17,21,.92);backdrop-filter:blur(6px);padding:12px 16px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;border-bottom:1px solid #232733}
  input,select{background:var(--card);color:var(--tx);border:1px solid #2c313c;border-radius:8px;padding:8px 12px;font-size:14px}
  input{min-width:240px}
  .count{color:var(--mut);font-size:12px;align-self:center}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding:18px;max-width:1500px;margin:0 auto}
  .card{background:var(--card);border:1px solid #232733;border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
  .ph{position:relative;aspect-ratio:4/3;background:#22262f;overflow:hidden}
  .ph img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
  .card:hover .ph img{transform:scale(1.05)}
  .id{position:absolute;top:8px;left:8px;background:var(--ac);color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px}
  .body{padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1}
  .nm{font-weight:600;font-size:15px}
  .meta{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.4px}
  .desc{font-size:13px;color:#cbd2dc}
  .tip{font-size:12px;color:#ffd479;background:#231f12;border-radius:6px;padding:6px 8px}
  .attr{margin-top:auto;font-size:10px;color:#6b7280}
  .attr a{color:#8b93a1}
  footer{padding:24px;text-align:center;color:var(--mut);font-size:12px}
</style></head><body>
<header><h1>🇹🇳 Tunisia — 120 Hidden Gems</h1>
<div class="sub">Real photos from Wikimedia Commons · click a photo to open its source page · region filter + search below</div></header>
<div class="controls">
  <input id="q" placeholder="Search name, type or description…">
  <select id="region"><option value="">All regions</option></select>
  <span class="count" id="count"></span>
</div>
<div class="grid" id="grid"></div>
<footer>Photos &amp; their licenses belong to their authors on Wikimedia Commons — keep attribution when reusing. Generated for the e-tunisia project.</footer>
<script>const DATA=__DATA__;
const regions={};DATA.regions.forEach(r=>regions[r.id]=r.name);
const sel=document.getElementById('region');DATA.regions.forEach(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=r.name;sel.appendChild(o);});
const grid=document.getElementById('grid'),q=document.getElementById('q'),cnt=document.getElementById('count');
function esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function render(){
  const term=q.value.trim().toLowerCase(),reg=sel.value;grid.innerHTML='';let n=0;
  DATA.gems.forEach(g=>{
    if(reg&&g.region!==reg)return;
    if(term&&!((g.name+' '+g.type+' '+g.description).toLowerCase().includes(term)))return;
    n++;const im=g.image||{};
    const card=document.createElement('div');card.className='card';
    const attr=im.full?`<div class="attr">📷 ${esc(im.author||'Wikimedia Commons')}${im.license?' · '+esc(im.license):''} · <a href="${esc(im.sourcePage||im.articleUrl||'#')}" target="_blank" rel="noopener">source</a></div>`:'';
    const src=im.localPath||im.thumb;
    const photo=src?`<a href="${esc(im.sourcePage||im.articleUrl||'#')}" target="_blank" rel="noopener"><img loading="lazy" src="${esc(src)}" alt="${esc(g.name)}"></a>`:'<div style="display:grid;place-items:center;height:100%;color:#6b7280">no photo</div>';
    card.innerHTML=`<div class="ph"><span class="id">#${g.id}</span>${photo}</div>
      <div class="body"><div class="nm">${esc(g.name)}</div>
      <div class="meta">${esc(regions[g.region]||g.region)} · ${esc(g.type)}</div>
      <div class="desc">${esc(g.description)}</div>
      ${g.tip?`<div class="tip">💡 ${esc(g.tip)}</div>`:''}${attr}</div>`;
    grid.appendChild(card);
  });
  cnt.textContent=n+' / '+DATA.gems.length+' places';
}
q.addEventListener('input',render);sel.addEventListener('change',render);render();
</script></body></html>
'@

$html = $html.Replace('__DATA__', $json)
$out = Join-Path $root 'tunisia-gems-gallery.html'
Set-Content -Path $out -Value $html -Encoding UTF8
"gallery written: $out"
"gems with photos: $withImg / $($data.gems.Count)"
