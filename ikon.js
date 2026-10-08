/* Ikon interaktif: efek miring mengikuti kursor, putar sekali saat terlihat,
   animasi buku/dokumen terbuka saat tombol ditekan. */
(function(){
  var reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  var iks=[].slice.call(document.querySelectorAll(".ik"));

  function play(el){
    el.classList.remove("play");void el.offsetWidth;el.classList.add("play");
    clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove("play");},3600);
  }

  iks.forEach(function(el){
    el.addEventListener("pointermove",function(e){
      if(e.pointerType!=="mouse"||reduce)return;
      var r=el.getBoundingClientRect();
      el.style.setProperty("--mx",((e.clientX-r.left)/r.width*2-1).toFixed(2));
      el.style.setProperty("--my",((e.clientY-r.top)/r.height*2-1).toFixed(2));
    });
    el.addEventListener("pointerleave",function(){el.style.setProperty("--mx",0);el.style.setProperty("--my",0);});
    el.addEventListener("click",function(){if(!el.classList.contains("open"))play(el);});
  });

  /* Sekali saat pertama terlihat, supaya pengguna layar sentuh juga tahu ikon ini bergerak */
  if("IntersectionObserver" in window&&!reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;io.unobserve(e.target);
      setTimeout(function(){play(e.target);},300);
    });},{threshold:.65});
    iks.forEach(function(el){io.observe(el);});
  }

  /* Tombol di samping ikon: ikon terbuka dulu, baru pindah halaman */
  document.addEventListener("click",function(e){
    if(reduce||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;
    var a=e.target.closest(".pd-teaser a.btn[href^='#']");if(!a)return;
    var ik=a.closest(".pd-teaser").querySelector(".ik");if(!ik)return;
    e.preventDefault();
    var h=a.getAttribute("href"),wait=ik.classList.contains("ik-book")?1150:800;
    ik.classList.remove("play");ik.classList.add("open");
    setTimeout(function(){
      location.hash=h;
      setTimeout(function(){ik.classList.remove("open");},500);
    },wait);
  },true);

  /* Daftar buku panduan: sampul terbuka, lalu PDF dibuka di tab baru */
  document.addEventListener("click",function(e){
    var a=e.target.closest(".pd-open");
    if(!a||a.getAttribute("aria-disabled")||reduce||e.metaKey||e.ctrlKey||e.shiftKey)return;
    var bk=a.closest(".pd-book"),u=a.getAttribute("href");if(!bk||!u)return;
    e.preventDefault();bk.classList.add("open");
    setTimeout(function(){
      var w=window.open(u,"_blank");
      if(w){try{w.opener=null;}catch(x){}}else{location.href=u;}
      setTimeout(function(){bk.classList.remove("open");},700);
    },850);
  });
})();
