/* Cookster - tool "Ruke gostiju" (in the tavern): the guests who sit at the far side of a table sit BEHIND it. Here Miloš cuts, for every character, the part of the guest that the table hides
   (the chest and belly below the far edge of the table): the red shapes. Only what lies on the table top is hidden, so the hands on the table, the mug and a hand that is lifted stay whole.
   The same shapes are used for every picture of the guest: the still one and all the frames of his films (drinking, calling the waiter...), which can be looked through here.
   The shapes are saved in the browser (cookster.guest-cut.v1, js/tavern-scene.js, CooksterTavern.cut) and work at once; "Izvezi JSON" gives them to be built into the game. */
(function(){
'use strict';
var T=window.CooksterTavern,G=window.CooksterGuestAnim;if(!T||!T.cut)return;
var btn=document.createElement('button'),panel=document.createElement('div');
btn.textContent='✋ Ruke gostiju';btn.setAttribute('data-tool-ui','1');
btn.style.cssText='position:fixed;left:345px;bottom:56px;z-index:2147483000;padding:8px 12px;border-radius:9px;border:2px solid #351b0d;background:#e8c27a;color:#351b0d;font:700 13px system-ui,sans-serif;cursor:pointer;display:none';
panel.setAttribute('data-tool-ui','1');
panel.style.cssText='position:fixed;left:10px;bottom:100px;z-index:2147483000;width:470px;max-height:84vh;overflow:auto;padding:12px;border-radius:12px;border:2px solid #351b0d;background:#fff4dc;color:#351b0d;font:13px system-ui,sans-serif;display:none';
document.body.append(btn,panel);
setInterval(function(){btn.style.display=T.isOpen?'block':'none';if(!T.isOpen)panel.style.display='none'},400);
btn.onclick=function(){panel.style.display=panel.style.display==='none'?'block':'none';if(panel.style.display==='block')build()};
var CW=440,PAD=44,R=9;        // canvas width, the empty margin round the picture, the radius for catching a point
var st={ch:1,film:'',i:0,mode:'red',shapes:[],kfs:[],kf:0,adding:false,drag:null},img=null,imgCh=0,cv,info,rg,box;
function el(tag,txt,css){var e=document.createElement(tag);if(txt!=null)e.textContent=txt;if(css)e.style.cssText=css;return e}
function bt(label,fn,title){var b=el('button',label,'margin:2px 3px 2px 0;padding:5px 9px;border-radius:7px;border:2px solid #351b0d;background:#e8c27a;font:700 12px system-ui,sans-serif;cursor:pointer');b.onclick=fn;if(title)b.title=title;return b}
function gid(){return 'g'+(st.ch<10?'0':'')+st.ch}
function load(){st.adding=false;st.drag=null;useFilm();img=null;var m=new Image();m.onload=function(){img=m;imgCh=st.ch;draw()};m.src='assets/tavern/guests/'+gid()+'_sedi_lice.webp?v=1'}
function rnd(shapes){return shapes.map(function(s){return s.map(function(q){return[Math.round(q[0]*1000)/1000,Math.round(q[1]*1000)/1000]})})}
function copy(o){return JSON.parse(JSON.stringify(o))}
// the shapes that are edited: for the still picture the shapes of the guest, for a film the shapes of the keyframe that is in effect at the shown frame
// (a keyframe holds from its frame until the next one: e.g. frame 1 = the hand is down on the table, frame 30 = the hand goes up and the body under it needs a new shape)
function useFilm(){
  if(!st.film){st.kfs=[];st.kf=0;st.shapes=T.cut.get(st.ch);return}
  st.kfs=T.cut.getF(st.ch,st.film);if(!st.kfs.length)st.kfs=[{f:0,s:T.cut.get(st.ch)}];      // (until something is changed here, the film uses the shapes of the still picture)
  useKf();
}
function useKf(){var k=0;st.kfs.forEach(function(q,i){if(q.f<=st.i)k=i});st.kf=k;st.shapes=st.kfs[k].s}
function save(){
  if(!st.film){T.cut.set(st.ch,rnd(st.shapes));return}
  st.kfs.forEach(function(k){k.s=rnd(k.s)});st.shapes=st.kfs[st.kf].s;T.cut.setF(st.ch,st.film,copy(st.kfs));
}
function films(){var M=G&&G.meta&&G.meta(),o=[];if(M&&M[gid()])Object.keys(M[gid()]).forEach(function(k){if(k.indexOf('ledja')<0)o.push(k)});return o}
function geo(){var sw=img?img.naturalWidth:300,sh=img?img.naturalHeight:340,rw=CW-2*PAD,k=rw/sw,rh=sh*k;return{sw:sw,sh:sh,rw:rw,rh:rh,k:k,ch:Math.round(rh+2*PAD)}}
function toC(q,g){return[PAD+q[0]*g.rw,PAD+q[1]*g.rh]}
function toU(x,y,g){return[(x-PAD)/g.rw,(y-PAD)/g.rh]}
function frame(){                       // what is shown: the still picture of the guest or a frame of one of his films
  if(!st.film)return{im:img,x:0,y:0,w:img?img.naturalWidth:0,h:img?img.naturalHeight:0};
  var a=G.load(st.ch,st.film);if(!a||!a.fr[st.i])return null;var m=a.m;return{im:a.fr[st.i],x:m.ox,y:m.oy,w:m.w,h:m.h,n:m.n};
}
function path(x,g){st.shapes.forEach(function(s){s.forEach(function(q,i){var c=toC(q,g);if(i)x.lineTo(c[0],c[1]);else x.moveTo(c[0],c[1])});x.closePath()})}
function draw(){
  if(!cv||!img||imgCh!==st.ch)return;
  var g=geo();cv.width=CW;cv.height=g.ch;var x=cv.getContext('2d');
  x.fillStyle='#6b6b6b';x.fillRect(0,0,CW,g.ch);x.fillStyle='#777';for(var a=0;a<CW;a+=16)for(var b=0;b<g.ch;b+=16)if(((a+b)/16)%2===0)x.fillRect(a,b,16,16);
  // the table far edge is not known here (it depends on the table): the hint is the thin line of the middle of the picture
  var f=frame();
  if(!f){x.fillStyle='#fff';x.font='700 14px system-ui';x.fillText('Učitavam kadrove…',20,30);setTimeout(draw,400);return}
  var fx=PAD+f.x*g.k,fy=PAD+f.y*g.k,fw=f.w*g.k,fh=f.h*g.k;
  if(st.mode==='result'){
    var t=document.createElement('canvas');t.width=CW;t.height=g.ch;var c=t.getContext('2d');c.drawImage(f.im,fx,fy,fw,fh);
    c.globalCompositeOperation='destination-out';c.beginPath();path(c,g);c.fill();x.drawImage(t,0,0);
  }else{
    x.drawImage(f.im,fx,fy,fw,fh);
    x.beginPath();path(x,g);x.fillStyle='rgba(230,30,30,.38)';x.fill();x.strokeStyle='#ff2a2a';x.lineWidth=2;x.stroke();
    st.shapes.forEach(function(s,si){s.forEach(function(q){var c=toC(q,g);x.beginPath();x.arc(c[0],c[1],5,0,7);x.fillStyle=(st.adding&&si===st.shapes.length-1)?'#ffe600':'#fff';x.fill();x.strokeStyle='#600';x.lineWidth=1.5;x.stroke()})});
  }
  x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=1;x.strokeRect(PAD,PAD,g.rw,g.rh);
  info.textContent=(st.film?'Film "'+st.film+'", kadar '+(st.i+1)+(f.n?'/'+f.n:'')+' · važi ključni kadar '+(st.kfs[st.kf].f+1):'Mirna slika')+' · oblika: '+st.shapes.length+(st.adding?' · crtaš oblik: klikni tačke, pa „Zatvori oblik“':'');
}
function pt(e){var r=cv.getBoundingClientRect(),g=geo();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height,g]}
function near(x,y,g){var best=null;st.shapes.forEach(function(s,si){s.forEach(function(q,qi){var c=toC(q,g),d=Math.hypot(c[0]-x,c[1]-y);if(d<=R+3&&(!best||d<best.d))best={d:d,si:si,qi:qi}})});return best}
function wire(){
  cv.onpointerdown=function(e){
    if(e.button!==0)return;var p=pt(e),x=p[0],y=p[1],g=p[2];
    if(st.mode!=='red')return;
    if(st.adding){var s=st.shapes[st.shapes.length-1],c0=s.length>=3?toC(s[0],g):null;
      if(c0&&Math.hypot(c0[0]-x,c0[1]-y)<=R+3){st.adding=false;save()}else s.push(toU(x,y,g));draw();return}
    var h=near(x,y,g);if(h){st.drag=h;cv.setPointerCapture(e.pointerId)}
  };
  cv.onpointermove=function(e){if(!st.drag)return;var p=pt(e),u=toU(p[0],p[1],p[2]);st.shapes[st.drag.si][st.drag.qi]=u;draw()};
  cv.onpointerup=function(){if(st.drag){st.drag=null;save()}};
  cv.oncontextmenu=function(e){e.preventDefault();var p=pt(e),h=near(p[0],p[1],p[2]);if(!h||st.adding)return;
    var s=st.shapes[h.si];s.splice(h.qi,1);if(s.length<3)st.shapes.splice(h.si,1);save();draw()};
}
function build(){
  panel.innerHTML='';
  panel.appendChild(el('b','Ruke gostiju — šta sto sakriva'));
  panel.appendChild(el('div','Crveno = deo gosta koji je IZA stola (sakriva se, ali samo tamo gde je ploča stola). Sve van crvenog ostaje: ruke na stolu, krigla, podignuta ruka. Isto važi za sve kadrove animacija.','margin:4px 0 8px;font-size:12px'));
  var row=el('div',null,'margin:6px 0'),sc=el('select'),sf=el('select');
  [1,2,3,4,5,6,7,8,9,10].forEach(function(c){var o=el('option','Gost '+c+(T.charNames&&T.charNames[c]?' — '+T.charNames[c]:''));o.value=c;if(c===st.ch)o.selected=true;sc.appendChild(o)});
  var fl=[''].concat(films());if(fl.indexOf(st.film)<0)st.film='';
  fl.forEach(function(f){var o=el('option',f?'Film: '+f:'Mirna slika');o.value=f;if(f===st.film)o.selected=true;sf.appendChild(o)});
  sc.onchange=function(){st.ch=+sc.value;st.film='';st.i=0;load();build()};
  sf.onchange=function(){st.film=sf.value;st.i=0;st.adding=false;useFilm();build()};
  row.append(sc,el('span',' '),sf);panel.appendChild(row);
  cv=el('canvas',null,'width:100%;border-radius:8px;touch-action:none;cursor:crosshair');panel.appendChild(cv);
  info=el('div','',"margin:4px 0;font-weight:700");rg=el('input');rg.type='range';rg.min=0;rg.value=st.i;rg.style.cssText='width:100%';
  rg.oninput=function(){if(st.adding)return;st.i=+rg.value;useKf();draw();markKf()};panel.append(info,rg);
  if(st.film){
    var kb=el('div',null,'margin:4px 0;padding:6px;border-radius:8px;background:#f1dcae');kb.appendChild(el('div','Ključni kadrovi (maska važi od ključnog kadra do sledećeg):','font-size:12px;font-weight:700;margin-bottom:3px'));
    var chips=el('div',null,'margin:2px 0');chips.id='kfChips';kb.appendChild(chips);
    var kr=el('div');
    kr.append(bt('★ Novi ključni kadar ovde',function(){
        if(st.adding)return;if(st.kfs.some(function(k){return k.f===st.i})){info.textContent='Na ovom kadru već postoji ključni kadar.';return}
        st.kfs.push({f:st.i,s:copy(st.shapes)});st.kfs.sort(function(a,b){return a.f-b.f});useKf();save();draw();markKf()},'dodaj novu masku od ovog kadra (kopira trenutnu, pa je izmeniš)'),
      bt('✕ Obriši ovaj ključni kadar',function(){
        if(st.adding)return;if(st.kfs.length<=1){T.cut.resetF(st.ch,st.film);useFilm();draw();markKf();return}
        st.kfs.splice(st.kf,1);useKf();save();draw();markKf()}));
    var cs=el('select');cs.id='kfCopy';kr.append(el('span','  Kopiraj oblike sa: '),cs,bt('Kopiraj',function(){
        if(st.adding)return;var v=cs.value,src=v==='still'?T.cut.get(st.ch):copy(st.kfs[+v].s);st.kfs[st.kf].s=src;st.shapes=src;save();draw()}));
    kb.appendChild(kr);panel.appendChild(kb);
  }
  var b1=el('div',null,'margin:6px 0');
  b1.append(
    bt('+ Novi oblik',function(){st.shapes.push([]);st.adding=true;draw()},'klikni tačke oko dela koji sto sakriva'),
    bt('Zatvori oblik',function(){var s=st.shapes[st.shapes.length-1];if(st.adding&&s&&s.length>=3){st.adding=false;save()}else if(st.adding){st.shapes.pop();st.adding=false}draw()}),
    bt('↶ Poslednja tačka',function(){if(!st.adding)return;var s=st.shapes[st.shapes.length-1];s.pop();if(!s.length){st.shapes.pop();st.adding=false}draw()}),
    bt('Obriši poslednji oblik',function(){st.shapes.pop();st.adding=false;save();draw()}),
    bt('Pregled: '+(st.mode==='red'?'šta ostaje':'crveno'),function(){st.mode=st.mode==='red'?'result':'red';build();draw()},'prikaži gosta bez sakrivenog dela'),
    bt('Vrati početno (ovaj gost)',function(){T.cut.reset(st.ch);['pij','doziv','idle'].forEach(function(f){T.cut.resetF(st.ch,f)});load();build()}));
  panel.appendChild(b1);
  var b2=el('div',null,'margin:6px 0');
  b2.append(bt('Posadi goste (proba)',function(){T.seatTest()},'svi stolovi: gosti odmah sede, da vidiš kako izgledaju u igri'),bt('Ukloni goste',function(){T.clearTest()}),
    bt('Izvezi JSON',function(){var o={};for(var c=1;c<=10;c++)o[c]=T.cut.get(c);box.value=JSON.stringify({still:o,films:T.cut.allF()});box.select();try{document.execCommand('copy')}catch(e){}}),
    bt('Uvezi JSON',function(){try{var j=JSON.parse(box.value);if(j.still||j.films){T.cut.setAll(j.still||{});T.cut.setAllF(j.films||{})}else T.cut.setAll(j);load();build()}catch(e){box.value='Greška u JSON-u: '+e.message}}));
  panel.appendChild(b2);
  box=el('textarea',null,'width:100%;height:54px;font:11px monospace');box.placeholder='JSON (Izvezi pa pošalji, ili nalepi pa Uvezi)';panel.appendChild(box);
  wire();setRange();markKf();if(!img||imgCh!==st.ch)load();else draw();
}
function markKf(){        // the chips of the keyframes (the one in effect is dark) and the list for copying
  var ch=document.getElementById('kfChips'),cs=document.getElementById('kfCopy');if(!ch||!st.film)return;
  ch.innerHTML='';cs.innerHTML='';
  var o0=el('option','mirna slika');o0.value='still';cs.appendChild(o0);
  st.kfs.forEach(function(k,i){
    var b=bt('kadar '+(k.f+1),function(){if(st.adding)return;st.i=k.f;rg.value=k.f;useKf();draw();markKf()});
    if(i===st.kf)b.style.background='#a8742c';ch.appendChild(b);
    var o=el('option','ključni kadar '+(k.f+1));o.value=i;cs.appendChild(o);
  });
}
function setRange(){var a=st.film&&G.load(st.ch,st.film),n=a?a.m.n:(G.meta()&&G.meta()[gid()]&&G.meta()[gid()][st.film]?G.meta()[gid()][st.film].n:1);rg.max=Math.max(0,(n||1)-1);rg.style.display=st.film?'block':'none'}
})();
