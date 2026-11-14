/* Karta znanja (Savkina knjiga): PROBNA verzija da se vidi kako izgleda i kako radi. Ne mijenja igru: otključavanja ovdje nisu povezana sa predmetima u igri.
   Prozor se otvara dugmetom "Karta znanja" (gore desno) ili dodajem ?karta u adresu. Podaci: js/data/knowledge-tree-data.js (180 kartica, 3 taba, 4 reda, 16 kolona).
   Probni brojači (znanje, novac, zvezdica) i kupljeno se čuvaju u pregledaču (cookster.tree.demo.v1); dugmad dole služe samo za probu.
   Slike: assets/ui/napredak/drvo (kartice, tabovi), zvezde (zvezdice, katanac, značka), ikone predmeta iz igre gdje postoje. */
(function(){
'use strict';
if(window.CooksterTree)return;
var D=window.CooksterTreeData;if(!D||!D.cards)return;
var A='assets/ui/napredak/',K='assets/ui/karta/',KEY='cookster.tree.demo.v1';
var TABS=[['Kuhinja','kuhinja'],['Kafana','kafana'],['Kuća','odrzavanje'],['Recepti','kafana'],['Izbori','kuhinja']];      // treći tab za sada koristi sliku "odrzavanje" (bez teksta) dok se ne nacrta nova
var COLS=16,SEC={1:[1,3],2:[4,7],3:[8,10],4:[11,13],5:[14,16]};
var cards=D.cards.map(function(c,i){c.id=c.t+'|'+c.n;c.i=i;return c;});
var byId={};cards.forEach(function(c){byId[c.id]=c;});
// ---- raspored iz urednika (js/data/karta-raspored.js): krugovi i čipkasti konci stoje tamo gde si ih postavio
var LAYOUT=(window.CooksterMapLayout&&window.CooksterMapLayout.tabs)||null,LC={},LP={},LT={},LW={},LCL={};
function prepLayout(){
  if(!LAYOUT)return;
  Object.keys(LAYOUT).forEach(function(t){
    var items=LAYOUT[t]||[],circ=[];
    items.forEach(function(it){if(it.k==='c'){var c=byId[t+'|'+it.n];if(c){LC[c.id]={cx:it.cx,cy:it.cy,w:it.w,h:it.h,z:it.z||1,c:c};circ.push(LC[c.id]);}}});
    if(!circ.length)return;
    LT[t]=true;LW[t]=items.filter(function(it){return it.k==='w';});
    var xs=circ.slice().sort(function(a,b){return a.cx-b.cx;}),cl=[];
    xs.forEach(function(o){if(cl.length&&o.cx-cl[cl.length-1][cl[cl.length-1].length-1].cx<120)cl[cl.length-1].push(o);else cl.push([o]);});
    LCL[t]=cl.map(function(g){return {x0:Math.min.apply(null,g.map(function(o){return o.cx-o.w/2;})),x1:Math.max.apply(null,g.map(function(o){return o.cx+o.w/2;})),minS:Math.min.apply(null,g.map(function(o){return o.c.s;}))};});
    cl.forEach(function(g,gi){if(!gi)return;g.forEach(function(o){var pv=cl[gi-1][0];cl[gi-1].forEach(function(q){if(Math.abs(q.cy-o.cy)<Math.abs(pv.cy-o.cy))pv=q;});LP[o.c.id]=[pv.c];});});
  });
}
prepLayout();
var S=load();
function load(){var d={bought:{},zn:42,din:1250,star:2,tab:0};try{var j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&typeof j==='object'){for(var k in d)if(j[k]!==undefined)d[k]=j[k];}}catch(e){}return d;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function el(t,c,txt){var e=document.createElement(t);if(c)e.className=c;if(txt!=null)e.textContent=txt;return e;}
// ---- slike predmeta iz igre (ako postoje)
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'dj');}
var artCache={};
var ART_OVR={'Bakarni tiganj':'assets/ui/karta/ikone/bakarni_tiganj.webp','Majstorski tiganj':'assets/ui/karta/ikone/majstorski_tiganj.webp','Bakarna šerpa':'assets/ui/karta/ikone/bakarna_serpa.webp','Veći kapacitet 1':'assets/ui/karta/ikone/veci_kapacitet_1.webp','Male tegle':'assets/ui/karta/ikone/male_tegle.webp','Velike tegle':'assets/ui/karta/ikone/velike_tegle.webp','Oval tanjir':'assets/ui/karta/ikone/oval_tanjir.webp','Servis za slavlje':'assets/ui/karta/ikone/servis_slavlje.webp','Rerna 1':'assets/ui/karta/ikone/rerna.webp','Roštilj':'assets/ui/karta/ikone/rostilj.webp','Nož':'assets/new_props/daska_sa_nozem.png','Veća daska':'assets/new_props/daska_sa_nozem.png','Majstorska daska':'assets/new_props/daska_sa_nozem.png','Oštar nož':'assets/new_props/daska_sa_nozem.png','Majstorski nož':'assets/new_props/daska_sa_nozem.png','Nož za meso':'assets/new_props/daska_sa_nozem.png','Nož majstora kuvara':'assets/new_props/daska_sa_nozem.png'};
Object.assign(ART_OVR,{'Vatra traje duže 1':'assets/ui/karta/ikone/vatra_duze.webp','Vatra traje duže 2':'assets/ui/karta/ikone/vatra_duze.webp','Brže prženje 1':'assets/ui/karta/ikone/brze_prazenje.webp','Brže prženje 2':'assets/ui/karta/ikone/brze_prazenje.webp','Brže sečenje 1':'assets/ui/karta/ikone/brze_secenje.webp','Brže sečenje 2':'assets/ui/karta/ikone/brze_secenje.webp','Mlin za meso':'assets/ui/karta/ikone/mlin_meso.webp','Mlevenje mesa 1':'assets/ui/karta/ikone/mlevenje_mesa.webp','Mlevenje mesa 2':'assets/ui/karta/ikone/mlevenje_mesa.webp'});      // ikonice 2 (Vatra, prženje, sečenje, mlin)
function artFor(c){
  if(ART_OVR[c.n])return ART_OVR[c.n];      // nacrtana ikonica ima prednost i za bonus kartice
  if(c.y==='L'||c.y==='Q'||c.y==='S')return null;
  if(artCache[c.id]!==undefined)return artCache[c.id];
  var src=ART_OVR[c.n]||null;
  if(!src)try{
    var K=(typeof KITCHEN_EQUIPMENT!=='undefined')?KITCHEN_EQUIPMENT:[],A2=window.CooksterItemArt||{},n=norm(c.n),best=null;
    K.forEach(function(d){var l=norm(d.label);if(l===n||(n.length>4&&(l.indexOf(n)>=0||n.indexOf(l)>=0&&l.length>5))){if(!best||l.length<norm(best.label).length)best=d;}});
    if(best)src=A2[best.id]||best.src||null;
  }catch(e){}
  artCache[c.id]=src;return src;
}
function badgeText(c){
  if(/^Cjenovnik/.test(c.n))return '↔';
  var m=/(\d+)\s*%/.exec(c.e);if(m)return '+'+m[1]+'%';
  m=/\+(\d+)/.exec(c.e);if(m)return '+'+m[1];
  m=/(\d+)\s*(mesta|gostiju|gosta|jela|stolova)/.exec(c.e);if(m)return m[1];
  m=/(\d+)\s*(sat|dan)/.exec(c.e);if(m)return m[1];
  return c.y==='S'?'S':c.y==='Q'?'!':(c.n.charAt(0));
}
// ---- stanje kartice
function isBought(c){return c.y==='✓'||!!S.bought[c.id];}
function prevInRow(c){var best=null;cards.forEach(function(x){if(x.t===c.t&&x.r===c.r&&x.c<c.c&&(!best||x.c>best.c))best=x;});return best;}
function parents(c){
  if(c.y==='✓')return [];
  var out=[];
  if(c.q){c.q.split(', ').forEach(function(nm){var p=byId[c.t+'|'+nm.trim()];if(p)out.push(p);});}
  if(!out.length&&LP[c.id])return LP[c.id].slice();
  if(!out.length){var pv=prevInRow(c);
    if(pv&&hash(c.id)%100<45){      // neke veze idu u susedni red (račvanje), samo za izgled i redosled u probi
      var alt=[c.r-1,c.r+1].filter(function(r){return r>=0&&r<=3;}).map(function(r){return cards.filter(function(x){return x.t===c.t&&x.r===r&&x.c===pv.c;})[0];}).filter(Boolean);
      if(alt.length)pv=alt[hash(c.id+'a')%alt.length];
    }
    if(pv)out.push(pv);}
  return out;
}
function status(c){
  if(isBought(c))return 'done';
  var ps=parents(c),ok=ps.every(isBought);
  return (ok&&c.s<=S.star)?'can':'lock';
}
function missing(c){
  var m=[];
  if(c.s>S.star)m.push('★'+c.s+' (imaš ★'+S.star+')');
  parents(c).forEach(function(p){if(!isBought(p))m.push(p.n);});
  return m;
}
var WIRES=[["a1",749,233,113.3,108.2],["a2",745,231,106.8,111.5],["a3",739,289,179.0,118.2],["a4",746,286,114.5,181.0],["a5",743,216,98.2,104.1],["a6",750,214,94.5,101.8],["b1",607,258,166.5,79.0],["b2",590,263,79.5,177.0],["b3",593,348,260.1,78.0],["b4",595,344,71.9,268.5],["b5",591,232,146.0,78.5],["b6",595,229,72.5,153.7],["c2",592,84,43.5,43.0],["d1",669,237,205.5,29.5],["d2",664,233,23.5,206.5],["d3",651,303,271.5,26.5],["d4",660,301,21.0,266.5],["d5",659,194,164.0,25.5],["d6",668,191,22.0,164.0],["c_gore",584,339,304.5,36.0],["c_dole",590,339,37.0,304.0]].map(function(a){return{n:a[0],W:a[1],H:a[2],wl:a[3],wr:a[4]};}),WV={up:[],down:[],flat:[]};
WIRES.filter(function(v){return /^(c|d)/.test(v.n);}).forEach(function(v){[0,1].forEach(function(f){var w={n:v.n,W:v.W,H:v.H,f:f,wl:f?v.wr:v.wl,wr:f?v.wl:v.wr},d=w.wr-w.wl;w.k=Math.abs(d)<15?'flat':d<0?'up':'down';WV[w.k].push(w);});});
function hash(str){var h=7;for(var i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;return h;}
function pickWire(p,c,kind,dx,dy){var all=WV[kind],sc=function(v){return kind==='flat'?v.H*dx/v.W/90:Math.abs(Math.log((dy/Math.abs(v.wr-v.wl))/(dx/v.W)));};
  var L=all.filter(function(v){return kind==='flat'?sc(v)<=1:(function(){var r=Math.exp(sc(v));return r>.75&&r<1.6;})();});
  if(!L.length){var best=all[0];all.forEach(function(v){if(sc(v)<sc(best))best=v;});return best;}
  return L[hash(p.id+'>'+c.id)%L.length];}
function groupOther(c){      // grupa „ILI": ako je već kupljena druga kartica iz iste grupe, ova košta duplo
  if(!c.x)return null;for(var i=0;i<cards.length;i++){var o=cards[i];if(o!==c&&o.x===c.x&&isBought(o))return o;}return null;
}
function price(c){var m=groupOther(c)&&!isBought(c)?2:1;return {z:c.z*m,d:c.d*m,dbl:m===2};}
function afford(c){var p=price(c);return S.zn>=p.z&&S.din>=p.d;}
// ---- DOM
var root,panel,top,tabsEl,board,inner,tip,toast,foot,badgeEl,znEl,dinEl,svg,M={};
function build(){
  root=el('div');root.id='ktRoot';root.setAttribute('data-tool-ui','1');
  panel=el('div');panel.id='ktPanel';
  top=panel;
  badgeEl=el('div','kt-badge');top.appendChild(badgeEl);
  tabsEl=panel;
  var nz=el('div');nz.id='ktNazad';nz.title='Nazad';nz.onclick=close;panel.appendChild(nz);
  var res=el('div','kt-res');
  var pz=el('div','kt-pl');pz.style.backgroundImage='url('+K+'ikona_zvezda.webp)';znEl=el('span');pz.appendChild(znEl);
  var pd=el('div','kt-pl');pd.style.backgroundImage='url('+K+'ikona_novac.webp?v=2)';dinEl=el('span');pd.appendChild(dinEl);
  res.appendChild(pz);res.appendChild(pd);
  var x=el('button','kt-x','✕');x.onclick=close;res.appendChild(x);
  panel.appendChild(res);
  board=el('div');board.id='ktBoard';inner=el('div');inner.id='ktInner';board.appendChild(inner);
  foot=el('div');foot.id='ktFoot';
  
  [['Probno:',null],['+10 znanja',function(){S.zn+=10;}],['+500 din',function(){S.din+=500;}],['Zvezdica −',function(){S.star=Math.max(1,S.star-1);}],['Zvezdica +',function(){S.star=Math.min(5,S.star+1);}],
   ['Počni ispočetka',function(){S.bought={};S.zn=42;S.din=1250;S.star=2;}]].forEach(function(b){if(!b[1]){foot.appendChild(el('span','',b[0]));return;}var bt=el('button','',b[0]);bt.onclick=function(){b[1]();save();refresh();};foot.appendChild(bt);});
  
  toast=el('div');toast.id='ktToast';
  panel.appendChild(board);panel.appendChild(foot);panel.appendChild(toast);
  root.appendChild(panel);
  tip=el('div');tip.id='ktTip';root.appendChild(tip);
  document.body.appendChild(root);
  root.addEventListener('mousedown',function(e){if(e.target===root)close();});
  // klizanje karte: pomera se transformacijom (glatko, na grafičkoj kartici), a kočenje vodi GSAP
  var drag=null,moved=false,vel=0,lastX=0,lastT=0,tw=null,P={x:0};
  function maxX(){return Math.max(0,(inner.scrollWidth||parseFloat(inner.style.width)||0)-board.clientWidth);}
  function apply(){inner.style.transform='translate3d('+(-P.x).toFixed(2)+'px,0,0)';}
  function stopGlide(){if(tw){tw.kill();tw=null;}}
  function glideTo(x,dur,ease){x=Math.max(0,Math.min(maxX(),x));stopGlide();if(window.gsap){tw=gsap.to(P,{x:x,duration:dur,ease:ease||'power4.out',onUpdate:apply,onComplete:function(){tw=null;}});}else{P.x=x;apply();}}
  window.CooksterTreeScroll={reset:function(){stopGlide();P.x=0;apply();},get:function(){return P.x;},by:function(dx){glideTo((tw?tw.vars.x:P.x)+dx,0.7,'power3.out');}};
  board.addEventListener('wheel',function(e){e.preventDefault();e.stopPropagation();var d=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY);var base=tw?tw.vars.x:P.x;glideTo(base+d*1.6,0.9,'power3.out');},{passive:false});
  board.addEventListener('pointerdown',function(e){if(e.button!==0)return;stopGlide();vel=0;lastX=e.clientX;lastT=performance.now();drag={x:e.clientX,l:P.x};moved=false;});
  window.addEventListener('pointermove',function(e){if(!drag)return;var dx=(e.clientX-drag.x)/kk();if(!moved&&Math.abs(dx)>6){moved=true;board.classList.add('drag');hideTip();}if(moved){P.x=Math.max(0,Math.min(maxX(),drag.l-dx));apply();var nw=performance.now(),dtt=nw-lastT;if(dtt>0){var iv=(lastX-e.clientX)/kk()/dtt;vel=vel*0.7+iv*0.3;}lastX=e.clientX;lastT=nw;}});
  window.addEventListener('pointerup',function(){var was=drag&&moved;drag=null;board.classList.remove('drag');if(was&&performance.now()-lastT<110&&Math.abs(vel)>0.05){var dist=vel*1000*0.9;glideTo(P.x+dist,Math.min(3.4,1.4+Math.abs(vel)*1.1),'power4.out');}setTimeout(function(){moved=false;},0);});
  board.addEventListener('pointerdown',function(e){if(BIG&&!(e.target.closest&&e.target.closest('.kt-card')))killBig(false);});
  board.addEventListener('click',function(e){if(moved){e.stopPropagation();e.preventDefault();}},true);      // after a drag the card under the mouse is not clicked
  window.addEventListener('resize',function(){if(isOpen())fit();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&isOpen()&&BIG){killBig(false);e.stopPropagation();return;}if(e.key==='Escape'&&isOpen()){e.stopPropagation();close();}},true);
}
var TABX=[[233,514],[522,786],[791,1056],[1062,1328],[1334,1601]];
function kk(){return Math.min(innerWidth*.94/1836,innerHeight*.93/1024);}
function fit(){panel.style.setProperty('--k',kk());}
function isOpen(){return document.body.classList.contains('kt-open');}
function metrics(){
  var h=738,rowH=Math.floor((h-20)/4),D=146;
  M={D:D,ch:rowH-6,cw:176,rowH:rowH,colW:250,padL:46,padT:8};
  M.w=M.padL+COLS*M.colW+30;
}
function pos(c){return {x:M.padL+(c.c-1)*M.colW,y:M.padT+c.r*M.rowH};}
function renderTabs(){
  Array.prototype.slice.call(panel.querySelectorAll('.kt-tab')).forEach(function(n){n.remove();});
  TABS.forEach(function(tb,i){
    var n=0,tot=0;cards.forEach(function(c){if(c.t===i){tot++;if(isBought(c))n++;}});
    var d=el('div','kt-tab'+(S.tab===i?' on':''));
    d.style.left=TABX[i][0]+'px';d.style.width=(TABX[i][1]-TABX[i][0])+'px';
    d.appendChild(el('span','',tb[0]));d.appendChild(el('small','',n+'/'+tot));
    d.onclick=function(){S.tab=i;save();if(window.CooksterTreeScroll)CooksterTreeScroll.reset();refresh();};
    panel.appendChild(d);
  });
}
function layoutExtras(){
  var cl=cards.filter(function(c){return c.t===S.tab&&LC[c.id];}).map(function(c){return LC[c.id];}),gx={};
  M.w=Math.max.apply(null,cl.map(function(o){return o.cx+o.w/2;}))+80;
  var CL=LCL[S.tab]||[];
  for(var s=2;s<=5;s++){for(var i=1;i<CL.length;i++){if(CL[i].minS>=s&&CL[i-1].minS<s){gx[s]=(CL[i-1].x1+CL[i].x0)/2;break;}}}
  inner.style.width=M.w+'px';
  for(var s2=1;s2<=5;s2++){
    var x0=s2===1?0:gx[s2];if(x0===undefined)continue;var nx=null;for(var k=s2+1;k<=5;k++)if(gx[k]!==undefined){nx=gx[k];break;}var x1=nx===null?M.w:nx;
    if(s2>1){var g=el('div','kt-gate');g.style.left=x0+'px';inner.appendChild(g);}
    if(s2>S.star){
      var dk=el('div','kt-dark');dk.style.left=x0+'px';dk.style.width=(x1-x0)+'px';inner.appendChild(dk);
      var lk=el('div','kt-lock'),lw=150;lk.style.width=lw+'px';lk.style.height=Math.round(lw*1.18)+'px';lk.style.left=Math.round((x0+x1)/2-lw/2)+'px';lk.style.top='285px';
      var b2=el('b','',String(s2));b2.style.fontSize=Math.round(lw*.34)+'px';lk.appendChild(b2);inner.appendChild(lk);
    }
  }
  (LW[S.tab]||[]).forEach(function(w){
    var lf=null,rt=null,dl=1e9,dr=1e9;
    cl.forEach(function(o){var d=Math.hypot(o.cx-w.cx,o.cy-w.cy);if(o.cx<w.cx&&d<dl){dl=d;lf=o;}if(o.cx>=w.cx&&d<dr){dr=d;rt=o;}});
    var d=el('div','kt-wire'+(lf&&isBought(lf.c)?'':' off'));
    d.style.backgroundImage='url('+K+'konci/'+w.f+'.webp?v=2)';d.style.left=(w.cx-w.w/2)+'px';d.style.top=(w.cy-w.h/2)+'px';d.style.width=w.w+'px';d.style.height=w.h+'px';d.style.zIndex=w.z||1;
    d.style.transform='rotate('+(w.r||0)+'deg)'+(w.fl?' scaleX(-1)':'');inner.appendChild(d);
  });
}
function renderBoard(){
  metrics();inner.innerHTML='';inner.style.width=M.w+'px';
  inner.style.setProperty('--D',M.D+'px');
  var LAYMODE=!!LT[S.tab],mine=cards.filter(function(c){return c.t===S.tab;});
  var HOLDER=null;if(LAYMODE){HOLDER=inner;var STG=el('div','kt-stage');HOLDER.appendChild(STG);inner=STG;}
  if(LAYMODE)layoutExtras();
  if(LAYMODE){var k1=el('div','kt-corner');k1.style.left='4px';k1.style.top='4px';inner.appendChild(k1);var k2=el('div','kt-corner br');k2.style.left=(M.w-116)+'px';k2.style.top='640px';inner.appendChild(k2);}
  else{
  // odjeljci po zvezdici: tamno polje + katanac iznad dosegnute zvezdice, zlatne linije
  for(var s=1;s<=5;s++){
    var a=SEC[s][0],b=SEC[s][1],x0=M.padL+(a-1)*M.colW-(M.colW-M.cw)/2,x1=M.padL+b*M.colW-(M.colW-M.cw)/2+(s===5?60:0);
    if(s>1){var g=el('div','kt-gate');g.style.left=x0+'px';inner.appendChild(g);}
    if(s>S.star){
      var dk=el('div','kt-dark');dk.style.left=x0+'px';dk.style.width=(x1-x0)+'px';inner.appendChild(dk);
      var lk=el('div','kt-lock'),lw=Math.round(M.D*1.1);lk.style.width=lw+'px';lk.style.height=Math.round(lw*1.18)+'px';lk.style.left=Math.round((x0+x1)/2-lw/2)+'px';lk.style.top=Math.round(M.padT+M.rowH*2.05)+'px';
      var b2=el('b','',String(s));b2.style.fontSize=Math.round(lw*.34)+'px';lk.appendChild(b2);inner.appendChild(lk);
    }
  }
  // konci (čipkaste trake) između kruga roditelja i kruga deteta; krugovi ih pokrivaju na krajevima
  mine.forEach(function(c){
    parents(c).forEach(function(p){
      var A1=pos(p),B1=pos(c),px=A1.x+M.cw/2,py=A1.y+M.D/2,cx=B1.x+M.cw/2,cy=B1.y+M.D/2,w=el('div','kt-wire'+(isBought(p)?'':' off')),dx=cx-px;
      var v=pickWire(p,c,cy<py?'up':Math.abs(cy-py)<2?'flat':'down',dx,Math.abs(cy-py)),dy=Math.abs(cy-py),sy=v.k==='flat'?Math.min(dx/v.W,(v.H/v.W>.2?90:48)/v.H):dy/Math.abs(v.wr-v.wl);
      w.style.backgroundImage='url('+K+'konci/'+v.n+'.webp?v=2)';w.style.left=px+'px';w.style.width=dx+'px';w.style.height=(v.H*sy)+'px';w.style.top=(py-v.wl*sy)+'px';
      if(v.f)w.style.transform='scaleX(-1)';
      inner.appendChild(w);
    });
  });
  }
  // kartice (čipkasti krugovi)
  mine.forEach(function(c){
    var st=status(c),lc=LAYMODE?LC[c.id]:null,p=lc?null:pos(c),d=el('div','kt-card st-'+(st==='done'?'done':st==='can'?'can':'lock'));
    if(lc){d.style.left=(lc.cx-lc.w/2)+'px';d.style.top=(lc.cy-lc.h/2)+'px';d.style.width=lc.w+'px';d.style.height=lc.h+'px';d.style.setProperty('--D',lc.w+'px');d.style.zIndex=lc.z;d.classList.add('kt-lay');}
    else{d.style.left=p.x+'px';d.style.top=p.y+'px';d.style.width=M.cw+'px';d.style.height=M.ch+'px';}
    d.dataset.id=c.id;
    d.appendChild(el('div','kt-ring'));
    d.appendChild(el('div','kt-st','★'+c.s));
    var inn=el('div','kt-in'),ic=el('div','kt-ic'),src=artFor(c);
    if(src){var im=el('img');im.src=src;im.alt='';im.draggable=false;ic.appendChild(im);}
    else if(!LAYMODE){var sp=el('span',c.y==='Q'?'q':c.y==='S'?'s':'',badgeText(c));ic.appendChild(sp);}
    inn.appendChild(ic);d.appendChild(inn);
    d.appendChild(el('div','kt-nm',c.n));
    var co=el('div','kt-co'),pr=price(c);
    if(st!=='done'&&(pr.z||pr.d)){
      if(pr.z){var a1=el('div','kt-pl'+(S.zn<pr.z?' bad':''));a1.style.backgroundImage='url('+K+'ikona_zvezda.webp)';a1.appendChild(el('span','',String(pr.z)));co.appendChild(a1);}
      if(pr.d){var a2=el('div','kt-pl'+(S.din<pr.d?' bad':''));a2.style.backgroundImage='url('+K+'ikona_novac.webp?v=2)';a2.appendChild(el('span','',pr.d>=1000?(pr.d/1000).toString().replace('.',',')+'k':String(pr.d)));co.appendChild(a2);}
    }
    if(c.x)d.appendChild(el('div','kt-or'+(groupOther(c)&&st!=='done'?' dbl':''),groupOther(c)&&st!=='done'?'×2':'ILI'));
    d.appendChild(co);
    d.addEventListener('mouseenter',function(e){if(d.classList.contains('kt-lay'))return;clearTimeout(TIPT);TIPT=setTimeout(function(){showTip(c,d);},d.classList.contains('kt-lay')?500:1000);});d.addEventListener('mouseleave',function(){clearTimeout(TIPT);hideTip();});
    d.addEventListener('click',function(e){
      if(d.classList.contains('kt-lay')){
        if(BIG&&BIG.card===d){if(e.target.closest&&e.target.closest('.bb')){onCard(c,d);}else killBig(false);}
        else{clearTimeout(TIPT);hideTip();showTip(c,d);}
        return;
      }
      onCard(c,d);});
    inner.appendChild(d);
  });
  if(HOLDER){inner=HOLDER;HOLDER.style.width=M.w+'px';}
}
function showTipOld(c,d){
  var st=status(c),src=artFor(c),pc=price(c),h='';
  h+='<div class="tp-top">'+(src?'<img class="tp-img" src="'+src+'" alt="">':'')+'<div><b class="tp-nm">'+c.n+'</b>';
  var stars='';for(var k=1;k<=5;k++)stars+='<i'+(k<=c.s?' class="f"':'')+'></i>';
  h+='<div class="tp-st">'+stars+'</div></div></div>';
  h+='<p class="tp-o">'+c.o+'</p><p class="tp-e">'+c.e+'</p>';
  if(st==='done')h+='<div class="tp-ok">Kupljeno</div>';
  else if(pc.z||pc.d){
    h+='<div class="tp-pr">';
    if(pc.z)h+='<div class="kt-pl'+(S.zn<pc.z?' bad':'')+'" style="background-image:url('+K+'ikona_zvezda.webp)"><span>'+pc.z+'</span></div>';
    if(pc.d)h+='<div class="kt-pl'+(S.din<pc.d?' bad':'')+'" style="background-image:url('+K+'ikona_novac.webp?v=2)"><span>'+(pc.d>=1000?(pc.d/1000).toString().replace('.',',')+'k':pc.d)+'</span></div>';
    h+='</div>';
  }
  if(c.x){var go=groupOther(c);h+='<p class="tp-n">'+(go&&!isBought(c)?'Izabrao si „'+go.n+'". Ovaj izbor košta duplo.':'Izbor „ILI": uzimaš samo jedan, drugi košta duplo.')+'</p>';}
  if(st==='lock')h+='<p class="tp-need">Fali: '+missing(c).join(', ')+'</p>';
  else if(st==='can'&&!afford(c)){var f=[];if(S.zn<pc.z)f.push('✦ '+(pc.z-S.zn)+' znanja');if(S.din<pc.d)f.push((pc.d-S.din)+' din');h+='<p class="tp-need">Fali: '+f.join(', ')+'</p>';}
  else if(st==='can')h+='<p class="tp-n">Klikni da kupiš.</p>';
  if(c.g!=='OK')h+='<p class="tp-s">'+(c.g==='NOVO'?'(u igri još ne postoji)':'(treba nacrtati sliku)')+'</p>';
  tip.innerHTML=h;tip.style.display='block';
  var r=d.getBoundingClientRect(),w=330,x=r.right+6;if(x+w>innerWidth-8)x=r.left-w-6;
  var y=Math.min(Math.max(8,r.top+r.height/2-tip.offsetHeight/2),innerHeight-tip.offsetHeight-8);tip.style.left=Math.max(8,x)+'px';tip.style.top=y+'px';
}
var TIPT=0,FLAG=null;
// Čipkasta zastavica: izlazi iza kruga na koji se zadržiš i širi se udesno (ili ulevo uz ivicu); visina joj je tačno visina čipke tog kruga
function flagCss(){if(document.getElementById('ktFlagCss'))return;var st=document.createElement('style');st.id='ktFlagCss';st.textContent=
'.kt-flag-o{position:absolute;pointer-events:none;overflow:hidden}.kt-flag{position:absolute;pointer-events:none;will-change:transform;filter:drop-shadow(1px 3px 3px rgba(40,22,6,.38))}'+
'.kt-flag .fb{position:absolute;inset:0}.kt-flag .fb i{position:absolute;top:0;height:100%;background-repeat:no-repeat;background-size:auto 100%}'+
'.kt-flag .fm{background-repeat:repeat-x!important;background-image:url('+K+'zast_m.webp)}.kt-flag .fl{left:0;background-image:url('+K+'zast_l.webp);background-position:left center}'+
'.kt-flag .fr{right:0;background-image:url('+K+'zast_r.webp);background-position:right center}'+
'.kt-flag .fc{position:absolute;inset:0;display:flex;align-items:center;gap:1.4em;font-family:"Paytone One","CooksterSerif",Georgia,serif;font-weight:400;color:#7a1e14;line-height:1.05}'+
'.kt-flag .fx{flex:1;min-width:0}.kt-flag .fn{color:#7a1e14;white-space:nowrap}.kt-flag .fs{display:flex;gap:2px;margin:.15em 0}'+
'.kt-flag .fs i{display:block;background:url('+A+'zvezde/zvezda_prazna.png) 0 0/100% 100% no-repeat}.kt-flag .fs i.f{background-image:url('+A+'zvezde/zvezda_puna.png)}'+
'.kt-flag .fe{color:#3a1f10;opacity:.95}.kt-flag .fp{display:flex;flex-direction:column;align-items:flex-end;gap:.25em;flex:0 0 auto}'+
'.kt-flag .fp .kt-pl{background-size:100% 100%;background-repeat:no-repeat;display:flex;align-items:center;justify-content:flex-end;color:#3a1f10}'+
'.kt-flag .fp .kt-pl.bad{color:#c0291a}.kt-flag .fq{color:#a3321c;font-size:.8em;text-align:right;max-width:11em}.kt-flag .fk{color:#3f6d26}';document.head.appendChild(st);}
function showFlag(c,d){
  if(!d.classList.contains('kt-lay'))return showTipOld(c,d);
  killFlag(true);flagCss();
  var st=status(c),pc=price(c),D=d.offsetWidth,H=Math.round(D*1.12),cx=d.offsetLeft+D/2,cy=d.offsetTop+D/2,sc=H/520,capL=140*sc,tile=123*sc,capR=294*sc;
  var cl=function(v,a,b){return Math.max(a,Math.min(b,v));},nf=cl(H*.19,17,30),ef=cl(H*.125,13,20),plH=cl(H*.21,22,38);
  var padIn=Math.round(D/2+Math.max(8,H*.08)),padOut=Math.round(capR*.62);
  // sadržaj (ime, zvezdice, opis levo; cena desno)
  var fc=el('div','fc');
  fc.style.paddingLeft=padIn+'px';fc.style.paddingRight=padOut+'px';fc.style.paddingTop=Math.round(H*.2)+'px';fc.style.paddingBottom=Math.round(H*.2)+'px';
  var fx=el('div','fx'),fn=el('div','fn',c.n);fn.style.fontSize=nf+'px';fx.appendChild(fn);
  var fs=el('div','fs');for(var q=1;q<=5;q++){var si=el('i',q<=c.s?'f':'');si.style.width=si.style.height=Math.round(nf*.8)+'px';fs.appendChild(si);}fx.appendChild(fs);
  var fe=el('div','fe',c.e);fe.style.maxHeight='2.2em';fe.style.overflow='hidden';fe.style.maxWidth='13em';fx.appendChild(fe);fx.style.flex='0 1 auto';fc.appendChild(fx);
  var fp=el('div','fp');
  if(st==='done'){fp.appendChild(el('div','fk','Kupljeno'));}
  else{
    if(pc.z){var a1=el('div','kt-pl'+(S.zn<pc.z?' bad':''));a1.style.backgroundImage='url('+K+'ikona_zvezda.webp?v=2)';a1.appendChild(el('span','',String(pc.z)));fp.appendChild(a1);}
    if(pc.d){var a2=el('div','kt-pl'+(S.din<pc.d?' bad':''));a2.style.backgroundImage='url('+K+'ikona_novac.webp?v=2)';a2.appendChild(el('span','',pc.d>=1000?(pc.d/1000).toString().replace('.',',')+'k':String(pc.d)));fp.appendChild(a2);}
    Array.prototype.forEach.call(fp.querySelectorAll('.kt-pl'),function(x){x.style.height=plH+'px';x.style.setProperty('--pl',Math.round(plH*1.25)+'px');x.style.paddingRight=Math.round(plH*.28)+'px';x.style.fontSize=Math.round(plH*.55)+'px';});
    var need='';if(st==='lock')need='Fali: '+missing(c).join(', ');else if(st==='can'&&!afford(c)){var ff=[];if(S.zn<pc.z)ff.push((pc.z-S.zn)+' znanja');if(S.din<pc.d)ff.push((pc.d-S.din)+' din');need='Fali: '+ff.join(', ');}
    else if(c.x){var go=groupOther(c);need=(go&&!isBought(c))?'×2 (izabrao si „'+go.n+'")':'Izbor „ILI"';}
    if(need)fp.appendChild(el('div','fq',need));
  }
  fc.appendChild(fp);
  // izmeri prirodnu širinu sadržaja, pa skrati zastavicu da nema praznog prostora
  var mw=el('div','kt-flag');mw.style.cssText='position:fixed;left:-9999px;top:0;width:4000px;height:'+H+'px;visibility:hidden;font-size:'+ef+'px';
  var m2=fc.cloneNode(true);m2.style.position='static';m2.style.display='inline-flex';m2.style.width='max-content';m2.style.height=H+'px';mw.appendChild(m2);document.body.appendChild(mw);
  var nat=Math.ceil(m2.getBoundingClientRect().width);mw.remove();
  var k=Math.max(1,Math.ceil((nat-capL-capR)/tile)),W=Math.round(capL+k*tile+capR);
  // zastavica (pomera se samo transformacijom: glatko) u okviru koji je odseca levo od centra kruga
  var o=el('div','kt-flag-o'),f=el('div','kt-flag'),PAD=10;
  o.style.cssText+='left:'+cx+'px;top:'+Math.round(cy-H/2-PAD)+'px;width:'+(W+PAD)+'px;height:'+(H+2*PAD)+'px;z-index:5999';
  f.style.cssText+='left:0;top:'+PAD+'px;width:'+W+'px;height:'+H+'px;font-size:'+ef+'px';
  var fb=el('div','fb'),il=el('i','fl'),im=el('i','fm'),ir=el('i','fr');il.style.width=Math.round(capL)+'px';ir.style.width=Math.round(capR)+'px';im.style.left=Math.round(capL)+'px';im.style.right=Math.round(capR)+'px';
  fb.appendChild(im);fb.appendChild(il);fb.appendChild(ir);f.appendChild(fb);f.appendChild(fc);o.appendChild(f);
  var scr=window.CooksterTreeScroll?CooksterTreeScroll.get():0,over=cx+W-(scr+board.clientWidth-14);
  if(over>0&&window.CooksterTreeScroll&&CooksterTreeScroll.by)CooksterTreeScroll.by(over);      // uvek se otvara udesno; ako ne stane, karta se malo pomeri
  var z0=d.style.zIndex;d.style.zIndex=6000;d.parentNode.appendChild(o);
  var hide=-(W-D*.3);
  FLAG={el:o,f:f,card:d,z:z0,hide:hide};
  if(window.gsap){      // izlazi iza kruga: klizi udesno, malo se razvuče po visini i prelije; tekst izblede tek kad zastavica skoro stigne
    var tl=gsap.timeline();
    tl.fromTo(f,{x:hide,scaleY:.72,opacity:0,transformOrigin:'0% 50%'},{x:0,scaleY:1,opacity:1,duration:.55,ease:'power3.out',force3D:true},0);
    tl.fromTo(fc,{opacity:0,x:-14},{opacity:1,x:0,duration:.3,ease:'power2.out'},.28);
  }
}
function killFlag(now){
  if(!FLAG)return;var F=FLAG;FLAG=null;var fin=function(){F.el.remove();if(F.card)F.card.style.zIndex=F.z;};
  if(now||!window.gsap){fin();return;}
  gsap.to(F.f,{x:F.hide,duration:.24,ease:'power2.in',force3D:true,onComplete:fin});
}
// ---- Uvećanje kruga: kad se zadržiš na krugu, on poraste (više od duplo), ikonica se podigne i smanji, ispod nje ide ime, zvezdice i cena;
// ispod kruga stoji kratak opis i šta fali. (Zastavica ostaje u kodu kao showFlag, ali se ne koristi.)
var BIG=null;
function bigCss(){if(document.getElementById('ktBigCss'))return;var st=document.createElement('style');st.id='ktBigCss';st.textContent=
'.kt-card.kt-big{z-index:6000!important}.kt-bi,.kt-bc{position:absolute;pointer-events:none;text-align:center;font-family:"Paytone One","CooksterSerif",Georgia,serif;font-weight:400;color:#7a1e14;line-height:1.05}'+
'.kt-bi{left:50%;transform:translateX(-50%)}.kt-bi .bn{color:#7a1e14}.kt-bi .bs{display:flex;gap:1px;justify-content:center}.kt-bi .bs i{display:block;background:url('+A+'zvezde/zvezda_prazna.png) 0 0/100% 100% no-repeat}.kt-bi .bs i.f{background-image:url('+A+'zvezde/zvezda_puna.png)}'+
'.kt-bi .bp{display:flex;gap:.7em;justify-content:center;align-items:center;color:#3a1f10}.kt-bi .bp span{display:flex;align-items:center;gap:.25em}.kt-bi .bp img{display:block;height:1.25em;width:auto}.kt-bi .bp .bad{color:#c0291a}.kt-bi .bk{color:#3f6d26}'+
'.kt-bi .bb{display:inline-block;pointer-events:auto;cursor:pointer;background:#b83a22;color:#fff3dc;border:0;box-shadow:0 2px 0 #7d2412,0 3px 4px rgba(40,22,6,.4);letter-spacing:.06em}.kt-bi .bb.off{background:#a79a85;box-shadow:0 2px 0 #7a705f;opacity:.85}.kt-bi .bb:hover{filter:brightness(1.1)}.kt-bc{left:50%;transform:translateX(-50%);color:#3a1f10;text-shadow:0 1px 0 rgba(255,246,224,.9),0 0 6px rgba(255,240,205,.9)}.kt-bc .bf{color:#a3321c;margin-top:.25em}';
document.head.appendChild(st);}
function showBig(c,d){
  killBig(true);bigCss();
  var st=status(c),pc=price(c),D=d.offsetWidth,F=430,k=F/D;      // svi krugovi, veliki i mali, rastu na istu konačnu veličinu
  var icon=d.querySelector('.kt-in');
  // položaj: krug i opis ispod ostaju unutar vidljivog dela karte
  var cx=d.offsetLeft+D/2,cy=d.offsetTop+D/2,scr=window.CooksterTreeScroll?CooksterTreeScroll.get():0,bw=board.clientWidth,bh=board.clientHeight,capH=10;
  var dx=0,dy=0,left=cx-F/2-(scr+10),right=(scr+bw-10)-(cx+F/2);if(left<0)dx=-left;else if(right<0)dx=right;
  var top=cy-F/2-8,bot=(bh-8)-(cy+F/2+capH);if(top<0)dy=-top;else if(bot<0)dy=bot;
  var u=function(px){return (px/k).toFixed(2)+'px';};      // veličina u konačnim pikselima, preračunata za uvećanje
  // ime, zvezdice i cena (unutar diska)
  var bi=el('div','kt-bi');bi.style.top=(D*.4)+'px';bi.style.width=(D*.66)+'px';
  var bn=el('div','bn',c.n);bn.style.fontSize=u(c.n.length>14?25:31);bi.appendChild(bn);
  var bs=el('div','bs');bs.style.margin=u(4)+' 0';for(var q=1;q<=5;q++){var si=el('i',q<=c.s?'f':'');si.style.width=si.style.height=u(26);bs.appendChild(si);}bi.appendChild(bs);
  var bp=el('div','bp');bp.style.fontSize=u(30);
  if(st==='done'){bp.appendChild(el('span','bk','Kupljeno'));}
  else{
    if(pc.z){var s1=el('span',S.zn<pc.z?'bad':'');var i1=el('img');i1.src=K+'ikona_zvezda.webp?v=2';s1.appendChild(i1);s1.appendChild(document.createTextNode(String(pc.z)));bp.appendChild(s1);}
    if(pc.d){var s2=el('span',S.din<pc.d?'bad':'');var i2=el('img');i2.src=K+'ikona_novac.webp?v=2';s2.appendChild(i2);s2.appendChild(document.createTextNode(pc.d>=1000?(pc.d/1000).toString().replace('.',',')+'k':String(pc.d)));bp.appendChild(s2);}
  }
  bi.appendChild(bp);
  var bb=el('div','bb',st==='done'?'':'KUPI');bb.style.fontSize=u(24);bb.style.marginTop=u(6);bb.style.padding=u(4)+' '+u(22);bb.style.borderRadius=u(12);
  if(st==='done')bb.style.display='none';else if(st!=='can'||!afford(c))bb.classList.add('off');
  bi.appendChild(bb);
  // opis i šta fali (ispod kruga, na platnu)
  var bc=el('div','kt-bc');bc.style.top=(D/2+(F/2+8)/k)+'px';bc.style.width=(F*1.15/k)+'px';bc.style.fontSize=u(15);
  var eff=String(c.e||'').split(/\.\s/)[0].replace(/\.$/,'');bc.appendChild(el('div','',eff));
  var need='';if(st==='lock')need='Fali: '+missing(c)[0];else if(st==='can'&&!afford(c)){need='Fali: '+((S.zn<pc.z)?'znanje':'novac');}
  else if(c.x){need=(groupOther(c)&&!isBought(c))?'Košta duplo':'Izbor „ILI"';}
  if(need)bc.appendChild(el('div','bf',need));
  var ring=d.querySelector('.kt-ring'),sh=el('div','kt-sh');sh.style.cssText='position:absolute;left:50%;top:'+(D/2+F*.40/k)+'px;width:'+(F*.78/k)+'px;height:'+(F*.2/k)+'px;margin-left:'+(-F*.39/k)+'px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(40,22,6,.5),rgba(40,22,6,0) 70%);pointer-events:none;opacity:0';
  d.insertBefore(sh,d.firstChild);d.appendChild(bi);d.classList.add('kt-big');      // opis ispod kruga je izbačen: sve bitno je u krugu
  var f0='drop-shadow(1px 3px 3px rgba(40,22,6,.4))',f1='drop-shadow(0px '+(14/k)+'px '+(18/k)+'px rgba(40,22,6,.34))';
  BIG={card:d,icon:icon,bi:bi,bc:bc,D:D,ring:ring,sh:sh,f0:f0};
  if(window.gsap){
    var tl=gsap.timeline();
    tl.to(d,{scale:k,x:dx/1,y:dy/1,duration:.4,ease:'back.out(1.35)',force3D:true},0);
    tl.fromTo(ring,{filter:f0},{filter:f1,duration:.42,ease:'power2.out'},0);
    tl.fromTo(sh,{opacity:0,scale:.7},{opacity:1,scale:1,duration:.42,ease:'power2.out'},0);
    tl.to(icon,{y:-D*.4,scale:1.5,duration:.5,ease:'power2.inOut'},.4);
    tl.fromTo(bi,{opacity:0,y:D*.05},{opacity:1,y:0,duration:.3,ease:'power1.out'},.72);
    tl.fromTo(bc,{opacity:0},{opacity:1,duration:.3,ease:'power1.out'},.3);
  }else{d.style.transform='translate('+dx+'px,'+dy+'px) scale('+k+')';icon.style.transform='translateY('+(-D*.4)+'px) scale(1.5)';ring.style.filter=f1;sh.style.opacity=1;}
}
function killBig(now){
  if(!BIG)return;var B=BIG;BIG=null;
  var fin=function(){if(B.sh.parentNode)B.sh.remove();if(B.ring)B.ring.style.filter='';if(B.bi.parentNode)B.bi.remove();if(B.bc.parentNode)B.bc.remove();B.card.classList.remove('kt-big');if(window.gsap){gsap.set(B.card,{clearProps:'transform'});gsap.set(B.icon,{clearProps:'transform'});}else{B.card.style.transform='';B.icon.style.transform='';}};
  if(now||!window.gsap){if(window.gsap)gsap.killTweensOf([B.card,B.icon,B.bi,B.bc,B.ring,B.sh]);fin();return;}
  gsap.killTweensOf([B.bi,B.bc,B.icon]);gsap.to([B.bi,B.bc],{opacity:0,duration:.12});
  gsap.to(B.icon,{y:0,scale:1,duration:.26,ease:'power2.in'});
  gsap.to(B.ring,{filter:B.f0,duration:.3,delay:.18});gsap.to(B.sh,{opacity:0,duration:.25,delay:.18});
  gsap.to(B.card,{scale:1,x:0,y:0,duration:.26,delay:.2,ease:'power2.in',onComplete:fin});
}
function showTip(c,d){if(d.classList.contains('kt-lay'))return showBig(c,d);return showFlag(c,d);}
function hideTip(){clearTimeout(TIPT);tip.style.display='none';killFlag(false);killBig(false);}

function say(m){toast.textContent=m;toast.classList.add('on');clearTimeout(say.t);say.t=setTimeout(function(){toast.classList.remove('on');},1900);}
function onCard(c,d){
  var st=status(c);
  if(st==='done'){say('Već imaš: '+c.n+'.');return;}
  if(st==='lock'){if(!d.classList.contains('kt-big')){d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');}say('Zaključano. Fali: '+missing(c).join(', ')+'.');return;}
  if(!afford(c)){d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');say('Nemaš dovoljno za '+c.n+'.');return;}
  var pp=price(c);S.zn-=pp.z;S.din-=pp.d;S.bought[c.id]=1;save();refresh();say('Kupljeno: '+c.n+'.');
}
function refresh(){
  badgeEl.innerHTML='<b>★'+S.star+'</b>';
  znEl.textContent=S.zn;dinEl.textContent=S.din+' din';
  renderTabs();renderBoard();hideTip();
}
function open(){if(!root)build();document.body.classList.add('kt-open');fit();refresh();}
function close(){document.body.classList.remove('kt-open');hideTip();}
function init(){
  var b=el('button','','Karta znanja');b.id='ktBtn';b.setAttribute('data-tool-ui','1');b.onclick=open;document.body.appendChild(b);
  if(/[?&]karta/.test(location.search))setTimeout(open,400);
}
window.CooksterTree={open:open,close:close,state:function(){return S;}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
