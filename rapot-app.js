(function(){
"use strict";
var app=document.getElementById("rapot-app");if(!app)return;
var R=window.RAPOT||{},A=window.ANGGOTA||{};
R.aspek=R.aspek||[];R.periode=R.periode||[];R.nilai=R.nilai||[];
var $=function(i){return document.getElementById(i);};
var esc=function(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});};
var GO=["Pimpinan","Kementerian","Biro","Pengawas"],INFO={},UI={},n=0;
(A.pimpinan||[]).forEach(function(p){INFO[p.nama]={g:"Pimpinan",u:p.jabatan,o:n++};});
(A.unit||[]).forEach(function(u){n++;(u.anggota||[]).forEach(function(m){INFO[m]={g:u.grup,u:u.nama,o:n};});});
function info(nm){return INFO[nm]||{g:"Lainnya",u:"Anggota",o:999};}
function avg(s){var v=R.aspek.map(function(a){return s&&s[a];}).filter(function(x){return typeof x==="number";});return v.length?v.reduce(function(a,b){return a+b;},0)/v.length:null;}
function pred(v){return v>=85?["A","Sangat baik"]:v>=70?["B","Baik"]:v>=55?["C","Cukup"]:["D","Perlu pembinaan"];}
function ini(nm){var w=nm.replace(/[^\p{L}\s]/gu,"").trim().split(/\s+/);return ((w[0]||"?")[0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase();}
function fmt(v){return (Math.round(v*10)/10).toString().replace(".",",");}
var st={p:R.periode.length?R.periode[R.periode.length-1].id:null,q:""};
function chips(){
  $("rp-chips").innerHTML=R.periode.map(function(p){return '<button type="button" class="chip" data-p="'+esc(p.id)+'" aria-pressed="'+(p.id===st.p)+'">'+esc(p.nama)+'</button>';}).join("");
}
function render(){
  var q=st.q.toLowerCase(),rows=R.nilai.filter(function(r){return r.p===st.p&&(!q||r.nama.toLowerCase().indexOf(q)>=0);});
  rows.sort(function(a,b){var x=info(a.nama),y=info(b.nama);return x.o-y.o||a.nama.localeCompare(b.nama);});
  var h='<div class="sp-bar"><h2>'+(q?"Hasil untuk “"+esc(st.q)+"”":"Rapot anggota")+'</h2><span>'+rows.length+' rapot</span></div>';
  if(!rows.length){
    h+='<div class="sp-empty">'+(R.nilai.some(function(r){return r.p===st.p;})?"Tidak ada nama yang cocok.":"Rapot untuk periode ini belum diterbitkan.")+'</div>';
  }else{
    var g=null,u=null;
    rows.forEach(function(r){
      var i=info(r.nama),a=avg(r.skor),pd=pred(a==null?0:a);
      if(i.u!==u&&i.g!=="Pimpinan"||g!==i.g&&i.g==="Pimpinan"){if(g)h+="</div>";g=i.g;u=i.u;h+='<h3 class="sp-gh">'+esc(i.g==="Pimpinan"?"Pimpinan":i.u)+'</h3><div class="rp-list">';}
      h+='<button type="button" class="rp-card g-'+pd[0]+'" data-n="'+esc(r.nama)+'"><span class="rp-av" aria-hidden="true">'+esc(ini(r.nama))+'</span><span><b>'+esc(r.nama)+'</b><small>'+esc(i.u)+'</small></span><span class="rp-pred"><strong>'+pd[0]+'</strong><span>'+(a==null?"-":fmt(a))+'</span></span></button>';
    });
    h+="</div>";
  }
  $("rp-out").innerHTML=h;
}
function sheet(nm){
  var r=R.nilai.filter(function(x){return x.p===st.p&&x.nama===nm;})[0];if(!r)return;
  var i=info(nm),a=avg(r.skor),pd=pred(a==null?0:a),per=R.periode.filter(function(p){return p.id===st.p;})[0];
  var d=$("rp-dlg");d.className="g-"+pd[0];
  $("rp-sheet").innerHTML='<div class="rp-hd"><div class="rp-ring" id="rp-ring"><i>'+(a==null?"-":fmt(a))+'</i></div><div><h2 id="rp-name">'+esc(nm)+'</h2><p>'+esc(i.u)+'</p><p>'+esc(per?per.nama:"")+'</p><span class="rp-badge">Predikat '+pd[0]+': '+pd[1]+'</span></div><button type="button" class="rp-x" data-close aria-label="Tutup rapot">&times;</button></div>'
   +'<div class="rp-body">'+R.aspek.filter(function(k){return typeof r.skor[k]==="number";}).map(function(k){var v=r.skor[k],b=pred(v)[0];return '<div class="rp-row g-'+b+'"><div class="t"><span>'+esc(k)+'</span><b>'+fmt(v)+'</b></div><div class="rp-bar"><i data-w="'+v+'"></i></div></div>';}).join("")
   +(r.cat?'<div class="rp-note"><b>Catatan pengurus</b><p>'+esc(r.cat)+'</p></div>':"")
   +'<div class="rp-act"><button type="button" class="btn btn-line rp-print">Cetak atau simpan PDF</button></div></div>';
  d.showModal();
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    $("rp-ring").style.setProperty("--v",a||0);
    [].forEach.call(d.querySelectorAll(".rp-bar i"),function(e){e.style.width=e.getAttribute("data-w")+"%";});
  });});
}
$("rp-chips").addEventListener("click",function(e){var b=e.target.closest("[data-p]");if(!b)return;st.p=b.getAttribute("data-p");chips();render();});
var t;$("rp-q").addEventListener("input",function(e){clearTimeout(t);var v=e.target.value;t=setTimeout(function(){st.q=v.trim();render();},120);});
$("rp-out").addEventListener("click",function(e){var c=e.target.closest("[data-n]");if(c)sheet(c.getAttribute("data-n"));});
$("rp-dlg").addEventListener("click",function(e){
  if(e.target===this||e.target.closest("[data-close]"))this.close();
  if(e.target.closest(".rp-print"))window.print();
});
function shut(){var d=$("rp-dlg");if(d.open&&location.hash!=="#rapot")d.close();}
window.addEventListener("hashchange",shut);window.addEventListener("popstate",shut);
window.RAPOT_OPEN=function(){st.q="";$("rp-q").value="";chips();render();};
})();
