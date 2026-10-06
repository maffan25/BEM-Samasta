(function(){
"use strict";
const DATA=window.SOP_DATA;
const GORD=["GOV","SDM","ADM","KEU","PRO","KOM","HKE","ADV","RSK","AST","MONEV","TRN","HMK","LNG","PSD","IRJ","DKV","SEK","BKU","LOG","ACR"];
const pre=c=>c.split("-")[1];
DATA.sort((a,b)=>GORD.indexOf(pre(a.c))-GORD.indexOf(pre(b.c))||a.c.localeCompare(b.c));
const BY={};DATA.forEach((s,i)=>{BY[s.c]=s;s.i=i;});
const gk=s=>{const n=GORD.indexOf(pre(s.c));return n<12?n+1:13;};
const GNAME={};DATA.forEach(s=>{const k=gk(s);if(k<13)GNAME[k]=s.g;});GNAME[13]="SOP Khusus Unit";
const $=id=>document.getElementById(id);
const esc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ABBR={Sekjen:"Sekretaris Jenderal",Irjen:"Inspektur / Inspektorat Jenderal",Wapres:"Wakil Presiden",Kabiro:"Kepala Biro"};
function fmt(t){
  return esc(t).replace(/\b(Sekjen|Irjen|Wapres|Kabiro)\b/g,(m)=>'<abbr title="'+ABBR[m]+'">'+m+'</abbr>')
    .replace(/SOP-[A-Z]+-\d{3}/g,c=>BY[c]?'<a class="sp-x" href="#sop/'+c+'">'+c+'</a>':c);
}
function hl(t,words){
  if(!words.length)return esc(t);
  const re=new RegExp("("+words.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")","ig");
  return String(t).split(re).map((p,i)=>i%2?"<mark>"+esc(p)+"</mark>":esc(p)).join("");
}
/* ---- peran / bagian ---- */
const ROLES=[
 ["pres","Presiden","Pimpinan",/Presiden/,s=>s.replace(/Wakil Presiden|Wapres/g,"")],
 ["wapres","Wakil Presiden","Pimpinan",/Wakil Presiden|Wapres/],
 ["sekjen","Sekretaris Jenderal (Sekjen)","Pimpinan",/Sekretaris Jenderal|Sekjen/],
 ["irjen","Inspektorat Jenderal (Irjen)","Pimpinan",/Inspektur Jenderal|Inspektorat Jenderal|Irjen/],
 ["psdm","PSDM","Kementerian",/PSDM/],
 ["akad","Akademik dan Karier","Kementerian",/Akademik/],
 ["harm","Harmonisasi Kampus","Kementerian",/Harmonisasi/],
 ["pora","Pemuda dan Olahraga","Kementerian",/Pemuda|Olahraga|Kemenpora/],
 ["kesma","Kesejahteraan Mahasiswa","Kementerian",/Kesejahteraan|Kesma/],
 ["bhs","Pengembangan Bahasa","Kementerian",/Pengembangan Bahasa/],
 ["lng","Hubungan Eksternal","Kementerian",/Hubungan Eksternal|Hubeks/],
 ["adm","Administrasi","Biro",/Biro Administrasi/],
 ["keu","Keuangan","Biro",/Keuangan/],
 ["dkv","Desain Komunikasi Visual","Biro",/DKV|Desain Komunikasi/],
 ["sek","Kesekretariatan","Biro",/Kesekretariatan/],
 ["acr","Tim Acara","Lainnya",/Tim Acara/],
 ["pj","Menteri / Kabiro Penanggung Jawab","Lainnya",/Menteri \/ Kabiro|Menteri\/Kabiro/]
].map(r=>({k:r[0],l:r[1],g:r[2],re:r[3],pre:r[4]}));
const hit=(r,t)=>r.re.test(r.pre?r.pre(t):t);
function walk(s){let o=[];s.s.forEach(c=>{o.push(c.t);c.c.forEach(b=>{if(b.p)o.push(b.p);if(b.note)o.push(b.note);if(b.flow)o.push(b.flow);if(b.ul)o=o.concat(b.ul);if(b.tb){o.push(b.tb.h.join(" "));b.tb.r.forEach(r=>o.push(r.join(" ")));}});});return o.join(" ");}
DATA.forEach(s=>{
  s.gk=gk(s);s.own=new Set();s.inv=new Set();
  ROLES.forEach(r=>{if(hit(r,s.o))s.own.add(r.k);});
  s.s.forEach(c=>c.c.forEach(b=>{if(!b.tb)return;const h=b.tb.h;
    let col=h.indexOf("Pelaksana");if(col<0)return;
    b.tb.r.forEach(r=>ROLES.forEach(x=>{if(r[col]&&hit(x,r[col]))s.inv.add(x.k);}));}));
  const tj=s.s.find(c=>c.t==="Tujuan");s.tj=tj&&tj.c[0]&&tj.c[0].p||"";
  s.ix=(s.c+" "+s.t+" "+s.o+" "+GNAME[s.gk]+" "+walk(s)).toLowerCase();
});
ROLES.forEach(r=>{r.n=DATA.filter(s=>s.own.has(r.k)||s.inv.has(r.k)).length;});
/* ---- state & elemen ---- */
const st={q:"",role:null,grp:null,y:0};
const home=$("home"),app=$("sop-app"),lv=$("sp-listview"),dv=$("sp-docview"),out=$("sp-out");
const TITLE0=document.title;
/* ---- chips ---- */
function chips(){
  let h='<button type="button" class="chip" data-role="" aria-pressed="'+(!st.role)+'">Semua bagian <em>'+DATA.length+'</em></button>',cur="";
  ROLES.forEach(r=>{if(!r.n)return;if(r.g!==cur){cur=r.g;h+='<span class="sp-gl">'+r.g+'</span>';}
    h+='<button type="button" class="chip" data-role="'+r.k+'" aria-pressed="'+(st.role===r.k)+'">'+esc(r.l)+' <em>'+r.n+'</em></button>';});
  $("sp-roles").innerHTML=h;
  let g='<button type="button" class="chip" data-grp="" aria-pressed="'+(!st.grp)+'">Semua kelompok</button><span class="sp-gl">Kelompok</span>';
  for(let k=1;k<=13;k++){const n=DATA.filter(s=>s.gk===k).length;
    g+='<button type="button" class="chip" data-grp="'+k+'" aria-pressed="'+(st.grp===k)+'">'+(k<10?"0":"")+k+' <small>'+esc(GNAME[k])+'</small> <em>'+n+'</em></button>';}
  $("sp-grps").innerHTML=g;
}
/* ---- daftar ---- */
function card(s,w){
  const o=s.o.replace("Menteri / Kabiro Penanggung Jawab Program","Menteri / Kabiro");
  return '<a class="sp-card" href="#sop/'+s.c+'"><span class="sp-code">'+hl(s.c,w)+'</span><b>'+hl(s.t,w)+'</b><p>'+esc(s.tj)+'</p><span class="sp-tags"><i>'+esc(o)+'</i><i>Rev '+esc(s.r)+'</i></span></a>';
}
function score(s,w){let n=0;const t=s.t.toLowerCase(),c=s.c.toLowerCase(),o=s.o.toLowerCase();w.forEach(x=>{if(c.indexOf(x)>=0)n+=100;if(t.indexOf(x)>=0)n+=60+(t.indexOf(x)===0?10:0);if(o.indexOf(x)>=0)n+=25;if(s.tj.toLowerCase().indexOf(x)>=0)n+=15;n+=2;});return n;}
function grouped(list,w){
  let h="",k=null,u=null;
  list.forEach(s=>{
    if(s.gk!==k){k=s.gk;u=null;h+=(h?"</div>":"")+'<h3 class="sp-gh">Kelompok '+(k<10?"0":"")+k+' · '+esc(GNAME[k])+'</h3><div class="sp-cards">';}
    if(k===13&&s.g!==u){u=s.g;h+='<h4 class="sp-gh" style="grid-column:1/-1;margin:12px 0 0">'+esc(s.g.replace("SOP Khusus Unit: ",""))+'</h4>';}
    h+=card(s,w);});
  return h+(h?"</div>":"");
}
function renderList(){
  const w=st.q.toLowerCase().split(/\s+/).filter(Boolean);
  let list=DATA.filter(s=>(!st.role||s.own.has(st.role)||s.inv.has(st.role))&&(!st.grp||s.gk===st.grp)&&w.every(x=>s.ix.indexOf(x)>=0));
  const role=ROLES.find(r=>r.k===st.role);
  let head=st.q?'Hasil untuk “'+esc(st.q)+'”':role?'SOP '+esc(role.l):st.grp?'Kelompok '+(st.grp<10?"0":"")+st.grp+' · '+esc(GNAME[st.grp]):'Semua SOP';
  let h='<div class="sp-bar"><h2>'+head+'</h2><span>'+list.length+' SOP</span></div>';
  if(!list.length){h+='<div class="sp-empty">Tidak ada SOP yang cocok. Coba kata kunci lain atau kode seperti “KEU-004”.<button type="button" class="link-btn" id="sp-reset">Hapus pencarian dan filter</button></div>';}
  else if(w.length){list.sort((a,b)=>score(b,w)-score(a,w)||a.i-b.i);h+='<div class="sp-cards">'+list.map(s=>card(s,w)).join("")+'</div>';}
  else if(role){
    const own=list.filter(s=>s.own.has(role.k)),inv=list.filter(s=>!s.own.has(role.k));
    if(own.length)h+='<h3 class="sp-gh">Dipegang sebagai pemilik proses <small>('+own.length+')</small></h3><div class="sp-cards">'+own.map(s=>card(s,w)).join("")+'</div>';
    if(inv.length)h+='<h3 class="sp-gh">Terlibat sebagai pelaksana <small>('+inv.length+')</small></h3><div class="sp-cards">'+inv.map(s=>card(s,w)).join("")+'</div>';
  } else h+=grouped(list,w);
  out.innerHTML=h;
}
/* ---- dokumen ---- */
const SEC_CLS={"Indikator keberhasilan":"ok","Pengecualian dan eskalasi masalah":"warn"};
function table(tb){
  const h=tb.h;
  if(h[0]==="No."&&h.indexOf("Tahapan dan tindakan")===1){
    return '<ol class="sp-steps">'+tb.r.map(r=>{
      const i=r[1].indexOf(": "),ti=i>0&&i<90?r[1].slice(0,i):"",de=i>0&&i<90?r[1].slice(i+2):r[1];
      return '<li><span class="sp-sn">'+esc(r[0])+'</span><div class="sp-sc"><h4>'+fmt(ti||"Langkah "+r[0])+'</h4><p>'+fmt(de)+'</p><dl><div><dt>Pelaksana</dt><dd>'+fmt(r[2]||"-")+'</dd></div><div><dt>Batas waktu</dt><dd>'+fmt(r[5]||"-")+'</dd></div><div><dt>Masukan</dt><dd>'+fmt(r[3]||"-")+'</dd></div><div><dt>Hasil</dt><dd>'+fmt(r[4]||"-")+'</dd></div></dl></div></li>';}).join("")+'</ol>';
  }
  if(h[0]==="Istilah")return '<dl class="sp-def">'+tb.r.map(r=>'<div><dt>'+fmt(r[0])+'</dt><dd>'+fmt(r[1]||"")+'</dd></div>').join("")+'</dl>';
  if(h.join(" ").indexOf("Ya / Tidak")>=0)return '<div>'+tb.r.map(r=>'<label class="sp-ck"><input type="checkbox"><span>'+fmt(r[1]||r[0])+'</span></label>').join("")+'</div>';
  const raci=h.indexOf("RACI");
  let t='<div class="sp-tw"><table><thead><tr>'+h.map(x=>'<th>'+esc(x)+'</th>').join("")+'</tr></thead><tbody>'+tb.r.map(r=>'<tr>'+r.map((c,j)=>'<td>'+(j===raci&&/^[ARCI]$/.test(c)?'<span class="raci raci-'+c+'">'+c+'</span>':fmt(c))+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
  return t;
}
function block(b,cls){
  if(b.p)return /^R = Responsible/.test(b.p)?'<p class="sp-note">'+fmt(b.p)+'</p>':'<p>'+fmt(b.p)+'</p>';
  if(b.note)return '<p class="sp-note">'+fmt(b.note)+'</p>';
  if(b.ul)return '<ul class="sp-ul '+(cls||"")+'">'+b.ul.map(x=>'<li>'+fmt(x)+'</li>').join("")+'</ul>';
  if(b.flow)return '<div class="sp-flow">'+b.flow.split("→").map((x,i,a)=>'<span>'+fmt(x.trim())+'</span>'+(i<a.length-1?'<i aria-hidden="true">›</i>':"")).join("")+'</div>';
  if(b.tb)return table(b.tb);
  return "";
}
let spy=null;
function sid(c){return "s-"+c.p+c.n;}
function renderDoc(s){
  const body=s.s,B=body.filter(c=>c.p==="B"),C=body.filter(c=>c.p==="C");
  const mm=s.m||{};
  const idx=DATA.filter(x=>x.gk===s.gk),p=idx[idx.indexOf(s)-1],n=idx[idx.indexOf(s)+1];
  const toc=a=>a.map(c=>'<a href="#sop/'+s.c+'" data-t="'+sid(c)+'"><b>'+(c.p==="C"?"C"+c.n:c.n)+'</b><span>'+esc(c.t)+'</span></a>').join("");
  let h='<a class="sp-back" href="#sop" id="sp-bk">‹ Semua SOP</a><header class="sp-dh"><span class="sp-code">'+esc(s.c)+'</span><h2>'+esc(s.t)+'</h2><div class="sp-meta"><span><b>Pemilik</b> '+fmt(s.o)+'</span><span><b>Revisi</b> '+esc(s.r)+'</span><span><b>Status</b> '+esc(s.st.replace(/\.$/,""))+'</span><span><b>Kelompok</b> '+(s.gk<10?"0":"")+s.gk+' · '+esc(GNAME[s.gk])+'</span></div>'+'</header>';
  h+='<div class="sp-layout"><nav class="sp-toc" aria-label="Isi dokumen"><h4>Isi utama</h4>'+toc(B.filter(c=>c.t!=="Tujuan"||true))+'<h4>Lampiran</h4>'+toc(C)+'</nav><article>';
  h+=body.filter(c=>c.p==="B"||c.p==="C").map(c=>'<section class="sp-sec" id="'+sid(c)+'"><h3><b>'+(c.p==="C"?"C"+c.n:c.n)+'</b>'+esc(c.t)+'</h3>'+c.c.map(b=>block(b,SEC_CLS[c.t])).join("")+'</section>').join("");
  const ids=[["Penyusun",mm.Penyusun],["Pemeriksa",mm.Pemeriksa],["Pengesah",mm.Pengesah],["Tanggal berlaku",mm["Tanggal berlaku"]]].filter(x=>x[1]);
  h+='<section class="sp-sec"><h3><b>A</b>Identitas dokumen</h3><div class="sp-tw"><table><tbody>'+ids.map(x=>'<tr><td>'+x[0]+'</td><td>'+fmt(x[1])+'</td></tr>').join("")+'<tr><td>Halaman di PDF induk</td><td>'+s.pg[0]+' sampai '+s.pg[1]+'</td></tr></tbody></table></div></section>';
  h+='<div class="sp-pn">'+(p?'<a href="#sop/'+p.c+'"><small>‹ Sebelumnya</small><b>'+esc(p.c)+' '+esc(p.t)+'</b></a>':'<span></span>')+(n?'<a href="#sop/'+n.c+'"><small>Berikutnya ›</small><b>'+esc(n.c)+' '+esc(n.t)+'</b></a>':'<span></span>')+'</div></article></div>';
  $("sp-doc").innerHTML=h;
  document.title=s.c+" · "+s.t+" | BEM STDIIS";
  if(spy)spy.disconnect();
  if("IntersectionObserver"in window){
    const links=[].slice.call(document.querySelectorAll(".sp-toc a"));
    spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle("on",a.getAttribute("data-t")===e.target.id));}),{rootMargin:"-25% 0px -65% 0px"});
    document.querySelectorAll(".sp-sec[id]").forEach(x=>spy.observe(x));
  }
}
/* ---- rute ---- */
function setNav(on){document.querySelectorAll(".nav a").forEach(a=>a.classList.toggle("active",on&&a.getAttribute("href")==="#sop"));}
function resetState(){st.q="";st.role=null;st.grp=null;st.y=0;$("sp-q").value="";chips();}
function showHome(){if(!app.hidden)resetState();home.hidden=false;app.hidden=true;document.title=TITLE0;if(spy)spy.disconnect();}
let cur=location.hash;
function route(){
  const h=cur,m=h.match(/^#sop\/(SOP-[A-Z]+-\d{3})$/);
  if(/^#sop(\/|$)/.test(h)){
    home.hidden=true;app.hidden=false;setNav(true);
    if(m&&BY[m[1]]){lv.hidden=true;dv.hidden=false;renderDoc(BY[m[1]]);window.scrollTo(0,0);}
    else{if(!dv.hidden)document.title=TITLE0;dv.hidden=true;lv.hidden=false;renderList();window.scrollTo(0,st.y||0);}
  }else{
    const was=home.hidden;showHome();
    if(was){const el=h.length>1&&document.getElementById(h.slice(1));window.scrollTo(0,0);if(el)el.scrollIntoView();}
  }
}
window.addEventListener("hashchange",()=>{cur=location.hash;route();});
window.addEventListener("popstate",()=>{cur=location.hash;route();});
function go(h){cur=h;try{history.pushState(null,"",h);}catch(e){}route();}
document.addEventListener("click",e=>{
  const c=e.target.closest(".sp-card");if(c)st.y=window.scrollY;
  const t=e.target.closest(".sp-toc a");if(t){e.preventDefault();const el=$(t.getAttribute("data-t"));if(el)el.scrollIntoView({behavior:"smooth"});}
  const ti=e.target.closest(".ticker-item");if(ti&&home.hidden){history.replaceState(null,"","#kalender");showHome();}
});
document.addEventListener("click",e=>{
  if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;
  const a=e.target.closest('a[href^="#"]');if(!a)return;
  const h=a.getAttribute("href");if(h.length<2)return;
  e.preventDefault();
  if(/^#sop(\/|$)/.test(h)||home.hidden){go(h);return;}
  const el=document.getElementById(h.slice(1));
  try{history.pushState(null,"",h);}catch(x){}cur=h;
  if(el)el.scrollIntoView({behavior:"smooth"});
});
$("sp-roles").addEventListener("click",e=>{const b=e.target.closest("[data-role]");if(!b)return;st.role=b.getAttribute("data-role")===st.role?null:(b.getAttribute("data-role")||null);chips();renderList();});
$("sp-grps").addEventListener("click",e=>{const b=e.target.closest("[data-grp]");if(!b)return;const v=+b.getAttribute("data-grp")||null;st.grp=v===st.grp?null:v;chips();renderList();});
out.addEventListener("click",e=>{if(e.target.id==="sp-reset"){st.q="";st.role=null;st.grp=null;$("sp-q").value="";chips();renderList();}});
let tm;$("sp-q").addEventListener("input",e=>{clearTimeout(tm);const v=e.target.value;tm=setTimeout(()=>{st.q=v.trim();renderList();},120);});
const tn=$("sp-teaser-n");if(tn)tn.textContent=DATA.length;
chips();route();
})();
