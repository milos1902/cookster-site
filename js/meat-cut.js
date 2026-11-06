/* Cookster: sečenje mesa. Radi kao sečenje povrća (daska se približi, povlačiš nož). Meso ostaje celo dok seckaš: rezovi se samo
   crtaju na njemu. Tek na „Gotovo" se vidi šta je ispalo:
   - samo rezovi odozgo nadole: šnicle (traka između dva reza ili ivice; uska = tanka, šira = debela, preširoka ostaje kao parče);
   - 3 reza odozgo nadole + 3 reza sa leva na desno: kockice.
   Meta: stavka sa dataset.meat='1' i meatState='parce' (game.js, isBoardCuttableItem). Nove stavke pravi CooksterMeatBridge (game.js). */
(function(){
  'use strict';
  const W=1280,H=720,BOARD={w:426*1.9,h:285*1.9},MW=520;
  const MIN=.07,THIN_MAX=.22,THICK_MAX=.5,GAP=.04,NEED=3;     // širine su deo cele širine mesa
  const NAMES={junetina:'Junetina',svinjetina:'Svinjetina'};
  let active=null;
  const cache={};
  function load(src){return cache[src]||(cache[src]=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;}));}
  const kind=w=>w<THIN_MAX?'tanka':'debela';

  async function start(target){
    if(active)return;
    const key=target.dataset.meatKey||'junetina',name=NAMES[key]||'Meso';
    const NK={junetina:3,svinjetina:6}[key]||3;
    const [meat,thin,thick,board,...kocke]=await Promise.all([
      load(target.querySelector('.body')?.src||('assets/meat/'+key+'_parce.webp')),
      load('assets/meat/'+key+'_snicla_tanka.webp'),load('assets/meat/'+key+'_snicla_debela.webp'),
      load('assets/new_props/daska.png'),...Array.from({length:NK},(_,i)=>load('assets/meat/'+key+'_kocka_'+(i+1)+'.webp'))]);
    const MH=MW*meat.height/meat.width,cx=W/2,cy=H/2-20,top=cy-MH/2;
    const bx=W/2-BOARD.w/2,by=H/2-BOARD.h/2+10,x0=cx-MW/2;
    const V=[],Hh=[];                       // rezovi: V = položaji (0..1) odozgo nadole, Hh = položaji (0..1) sa leva na desno
    const root=document.createElement('div');
    root.style.cssText='position:fixed;inset:0;z-index:30000;background:rgba(18,9,3,.62);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .25s';
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;
    cv.style.cssText='max-width:100vw;max-height:100vh;touch-action:none;cursor:crosshair';
    const bar=document.createElement('div');bar.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);display:flex;gap:8px;z-index:1;font:15px system-ui,sans-serif';
    const hint=document.createElement('div');hint.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);color:#fff3d6;font:15px system-ui,sans-serif;text-shadow:0 1px 3px #000;text-align:center;max-width:90vw';
    const say=t=>{hint.textContent=t;};
    const status=()=>'Odozgo nadole: '+V.length+' · Sa leva na desno: '+Hh.length+'. ';
    say('Povuci nož preko mesa. Seci odozgo nadole za šnicle (blizu ivice = tanka, dalje = debela). Za kockice dodaj i rezove sa leva na desno. Pa klikni „Gotovo".');
    const mkBtn=(t,fn)=>{const x=document.createElement('button');x.textContent=t;x.style.cssText='font:inherit;padding:8px 14px;border-radius:10px;border:2px solid #4a2a12;background:#f1d9a6;color:#3a1d0a;cursor:pointer';x.onclick=fn;bar.appendChild(x);return x;};
    for(const ev of ['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','click','dblclick','touchstart','touchmove','touchend','contextmenu','wheel'])root.addEventListener(ev,e=>e.stopPropagation());
    root.append(cv,bar,hint);document.body.appendChild(root);
    requestAnimationFrame(()=>{root.style.opacity='1';});
    const g=cv.getContext('2d');
    let stroke=null,cur=null,raf=0,closed=false;

    function frame(){
      g.clearRect(0,0,W,H);
      g.save();g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=30;g.shadowOffsetY=14;g.drawImage(board,bx,by,BOARD.w,BOARD.h);g.restore();
      g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=14;g.shadowOffsetY=8;g.drawImage(meat,x0,top,MW,MH);g.restore();
      g.save();g.lineCap='round';
      const line=(ax,ay,bx2,by2)=>{g.strokeStyle='rgba(40,8,4,.75)';g.lineWidth=4;g.beginPath();g.moveTo(ax,ay);g.lineTo(bx2,by2);g.stroke();
        g.strokeStyle='rgba(255,225,200,.55)';g.lineWidth=1.5;g.beginPath();g.moveTo(ax+1.5,ay);g.lineTo(bx2+1.5,by2);g.stroke();};
      for(const f of V)line(x0+f*MW,top-6,x0+f*MW,top+MH+6);
      for(const f of Hh)line(x0-6,top+f*MH,x0+MW+6,top+f*MH);
      g.restore();
      if(cur&&stroke){
        g.save();g.strokeStyle='#fff';g.lineWidth=3;g.shadowColor='#8c6bff';g.shadowBlur=14;g.setLineDash([10,6]);
        g.beginPath();g.moveTo(stroke.start.x,stroke.start.y);g.lineTo(cur.x,cur.y);g.stroke();g.restore();
        const m=measure(stroke.start,cur);
        if(m){g.save();g.font='700 18px system-ui';g.textAlign='center';g.fillStyle='#fff3d6';g.shadowColor='#000';g.shadowBlur=4;
          g.fillText(m.label,(stroke.start.x+cur.x)/2,Math.min(stroke.start.y,cur.y)-10);g.restore();}
      }
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);

    const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
    const near=(arr,f)=>arr.some(q=>Math.abs(q-f)<GAP);
    // gde potez preseca meso, i da li je rez uspravan ili vodoravan
    function measure(s,p){
      const dx=p.x-s.x,dy=p.y-s.y;
      if(Math.hypot(dx,dy)<30)return null;
      if(Math.abs(dy)>=Math.abs(dx)*1.1){                      // odozgo nadole
        if(Math.min(s.y,p.y)>cy||Math.max(s.y,p.y)<cy)return{label:'Rez mora da prođe preko mesa',ok:false};
        const f=(s.x+dx*(cy-s.y)/dy-x0)/MW;
        if(f<=GAP||f>=1-GAP)return{label:'Rez je van mesa ili na samoj ivici',ok:false};
        if(near(V,f))return{label:'Tu već ima reza',ok:false};
        const edges=[0,...V,1].filter(q=>q!==f),w=Math.min(...edges.map(q=>Math.abs(q-f)));
        return{ok:true,dir:'v',f,label:w<MIN?'Pretanko':kind(w)==='tanka'?'Tanka šnicla':'Debela šnicla'};
      }
      if(Math.abs(dx)>=Math.abs(dy)*1.1){                      // sa leva na desno
        if(Math.min(s.x,p.x)>cx||Math.max(s.x,p.x)<cx)return{label:'Rez mora da prođe preko mesa',ok:false};
        const f=(s.y+dy*(cx-s.x)/dx-top)/MH;
        if(f<=GAP||f>=1-GAP)return{label:'Rez je van mesa ili na samoj ivici',ok:false};
        if(near(Hh,f))return{label:'Tu već ima reza',ok:false};
        return{ok:true,dir:'h',f,label:'Rez za kockice'};
      }
      return{label:'Seci ravno: odozgo nadole ili sa leva na desno',ok:false};
    }
    cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);stroke={start:pos(e)};cur=stroke.start;});
    cv.addEventListener('pointermove',e=>{if(stroke)cur=pos(e);});
    cv.addEventListener('pointerup',()=>{
      if(!stroke)return;const m=cur?measure(stroke.start,cur):null;stroke=null;
      if(!m)return;
      if(!m.ok){say(m.label+'.');return;}
      (m.dir==='v'?V:Hh).push(m.f);(m.dir==='v'?V:Hh).sort((x,y)=>x-y);
      try{window.playChop&&playChop();}catch(_){}
      say(status()+(V.length>=NEED&&Hh.length>=NEED?'Dovoljno za kockice. Klikni „Gotovo".':V.length>=NEED&&!Hh.length?'Dovoljno za šnicle. Klikni „Gotovo", ili dodaj rezove sa leva na desno za kockice.':'Nastavi da seckaš.'));
    });
    cv.addEventListener('pointercancel',()=>{stroke=null;});

    function close(){if(closed)return;closed=true;cancelAnimationFrame(raf);root.style.opacity='0';setTimeout(()=>root.remove(),260);document.removeEventListener('keydown',onKey,true);active=null;}
    function crop(a,b){                      // deo mesa od a do b (širina), kao nova slika
      const c=document.createElement('canvas');c.width=Math.max(8,Math.round((b-a)*meat.width));c.height=meat.height;
      c.getContext('2d').drawImage(meat,a*meat.width,0,(b-a)*meat.width,meat.height,0,0,c.width,c.height);return c.toDataURL('image/webp',.9);
    }
    function finish(){
      const B=window.CooksterMeatBridge;
      if(V.length+Hh.length<2){say(status()+'Treba bar dva reza.');return;}
      if(Hh.length&&Hh.length<NEED&&V.length>=NEED){say(status()+'Za kockice treba '+NEED+' reza sa leva na desno, ili ih ukloni odustajanjem.');return;}
      if(Hh.length>=NEED&&V.length<NEED){say(status()+'Za kockice treba i '+NEED+' reza odozgo nadole.');return;}
      if(Hh.length>=NEED&&V.length>=NEED){                        // kockice
        const cells=(V.length+1)*(Hh.length+1),N=Math.min(8,cells);      // svaki komad je poseban predmet koji se uzima
        for(let i=0;i<N;i++){const im=kocke[i%NK],w=46,h=Math.round(w*im.height/im.width);
          B.spawn(target,im.src,name+' – komad',w,h,i,'kockice');}
        B.remove(target);B.save();B.toast(name+' je iseckana na kockice.');close();return;
      }
      if(!V.length){say(status()+'Seci odozgo nadole da dobiješ šnicle.');return;}
      const P=[0,...V,1];let n=0,rest=null;                      // šnicle: trake između rezova
      for(let i=0;i<P.length-1;i++){
        const w=P[i+1]-P[i];
        if(w<MIN)continue;
        if(w>THICK_MAX){rest={a:P[i],b:P[i+1]};continue;}
        const k=kind(w),im=k==='tanka'?thin:thick,sw=82,sh=Math.round(sw*im.height/im.width);
        B.spawn(target,im.src,name+' – '+(k==='tanka'?'tanka':'debela')+' šnicla',sw,sh,n++,'snicla');
      }
      if(rest){const l=rest.b-rest.a,c=crop(rest.a,rest.b),w=Math.max(30,Math.round(112*l));
        const r=B.spawn(target,c,name+' (ostatak)',w,Math.round(w*MH/(MW*l)),0,'parce');}
      B.remove(target);B.save();B.toast(n?(n+' '+(n===1?'šnicla':'šnicle')+'.'):'Ništa upotrebljivo, rezovi su preuski.');close();
    }
    function onKey(e){if(e.key==='Escape'){e.stopPropagation();close();}}
    document.addEventListener('keydown',onKey,true);
    mkBtn('Poništi poslednji rez',()=>{});
    bar.lastChild.onclick=()=>{const all=[];/* poslednji dodat: nema istorije, pa skida poslednji uspravan ili vodoravan */(Hh.length>V.length?Hh:V).pop();say(status());};
    mkBtn('Gotovo',finish);mkBtn('Odustani',close);
    active={root,close};
  }
  window.CooksterMeatCut={start,supports:el=>!!el&&el.dataset.meat==='1'&&el.dataset.meatState==='parce'};
})();
