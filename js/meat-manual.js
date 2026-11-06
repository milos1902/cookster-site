/* Cookster: ručno sečenje mesa. C otvara (nad mesom na dasci), C ponovo zatvara.
   - PARČE mesa: povučeš nož pod bilo kojim uglom preko mesa. Manji deo koji rez odvoji je šnicla (tanka ili debela, po debljini), ostatak ostaje onakav
     kakav je posle reza. Kad ostatak postane sitan, pretvori se u poslednju šniclu.
   - ŠNICLA: povučeš nekoliko linija preko nje (bilo koji ugao), a kad zatvoriš (C), isečeni delovi postaju komadi mesa (svaki komad se u posudi kreće sam).
   Geometrija i predmeti su u game.js (meatSlicePoly, meatFinishSnicla). */
(function(){
  'use strict';
  const W=1280,H=720,BOARD={w:426*1.9,h:285*1.9},THIN=.14,MAXT=.34,MINT=.05,MWP=340,MWS=520;
  let st=null;
  const cache={};
  function load(src){return cache[src]||(cache[src]=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;}));}
  function defOf(el){return (window.CooksterCatalog&&CooksterCatalog.VEGETABLES||{})[el.dataset.vegKey]||null;}
  function onBoard(kind){
    let hit=null;
    for(const el of (window.items||[])){
      if(el.dataset.attachedToBoard!=='1'||el.dataset.vegetable!=='1')continue;
      const d=defOf(el);
      if(d&&d.meat===kind&&(kind!=='snicla'||el.dataset.cutState==='whole'))hit=el;       // the newest one
    }
    return hit;
  }
  const targetOnBoard=()=>onBoard('snicla');      // a piece of meat is cut in 3D (js/tomato-cut3d.js); the manual cut here is for a slice (into pieces)
  function close(apply){
    if(!st)return;const s=st;st=null;cancelAnimationFrame(s.raf);s.root.style.opacity='0';setTimeout(()=>s.root.remove(),220);
    if(apply!==false&&s.mode==='snicla'&&s.frags.length>1&&(window.items||[]).includes(s.target))window.meatFinishSnicla(s.target,s.frags);
  }
  const P=(a,ox,oy,mw,mh)=>[(a.x-ox)/mw,(a.y-oy)/mh];
  async function open(target){
    if(st)return;
    const d=defOf(target),mode=d&&d.meat==='snicla'?'snicla':'parce';
    const body=target.querySelector('.body');
    const src=mode==='snicla'?d.src:(target.dataset.meatSrc0||(body&&body.src)||'assets/meat/junetina_parce.png');
    const [img,board]=await Promise.all([load(src),load('assets/new_props/daska.png')]);
    const [imThin,imThick]=await Promise.all([load('assets/meat/junetina_snicla_tanka.png'),load('assets/meat/junetina_snicla_debela.png')]);
    const root=document.createElement('div');root.setAttribute('data-tool-ui','1');
    root.style.cssText='position:fixed;inset:0;z-index:30000;background:rgba(18,9,3,.62);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s';
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='max-width:100vw;max-height:100vh;touch-action:none;cursor:crosshair';
    const bar=document.createElement('div');bar.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);display:flex;gap:8px;z-index:1;font:15px system-ui,sans-serif';
    const hint=document.createElement('div');hint.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);color:#fff3d6;font:15px system-ui,sans-serif;text-shadow:0 1px 3px #000;text-align:center;max-width:90vw';
    hint.textContent=mode==='snicla'
      ?'Povuci nož preko šnicle, pod bilo kojim uglom, koliko puta hoćeš. Kad zatvoriš (C), delovi postaju komadi mesa.'
      :'Povuci nož preko mesa, pod bilo kojim uglom. Odvojeni deo je šnicla (tanka ili debela). C ili „Gotovo“ zatvara.';
    const mk=(t,fn)=>{const b=document.createElement('button');b.textContent=t;b.style.cssText='font:inherit;padding:8px 14px;border-radius:10px;border:2px solid #4a2a12;background:#f1d9a6;color:#3a1d0a;cursor:pointer';b.onclick=fn;bar.appendChild(b);};
    mk('Gotovo (C)',()=>close());
    for(const ev of ['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','click','dblclick','touchstart','touchmove','touchend','contextmenu','wheel'])root.addEventListener(ev,e=>e.stopPropagation());
    root.append(cv,bar,hint);document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';});
    const g=cv.getContext('2d'),cx=W/2,cy=H/2-10;
    const MW=mode==='snicla'?MWS:MWP,MH=MW*img.naturalHeight/img.naturalWidth,ox=mode==='snicla'?cx-MW/2:cx-BOARD.w/2+55,oy=cy-MH/2;
    const s=st={root,target,mode,raf:0,stroke:null,cur:null,cuts:[],frags:[[[0,0],[1,0],[1,1],[0,1]]],crops:{}};
    let poly=(()=>{try{const j=JSON.parse(target.dataset.meatPoly||'null');if(Array.isArray(j)&&j.length>=3)return j;}catch(_){}return [[0,0],[1,0],[1,1],[0,1]];})();
    const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
    const area=window.meatPolyArea,split=window.meatSplit;
    function chord(small,p1,p2){      // length (px) of the cut inside the meat
      const dx=p2[0]-p1[0],dy=p2[1]-p1[1],len=Math.hypot(dx,dy)||1,hits=[];
      for(const q of small){const f=Math.abs((q[0]-p1[0])*dy-(q[1]-p1[1])*dx)/len;if(f<1e-5)hits.push(q);}
      if(hits.length<2)return 0;let m=0;for(let i=0;i<hits.length;i++)for(let j=i+1;j<hits.length;j++)m=Math.max(m,Math.hypot((hits[i][0]-hits[j][0])*MW,(hits[i][1]-hits[j][1])*MH));return m;
    }
    function measure(a,b){
      if(Math.hypot(b.x-a.x,b.y-a.y)<30)return null;
      const p1=P(a,ox,oy,MW,MH),p2=P(b,ox,oy,MW,MH);
      if(mode==='snicla'){
        let any=false;const out=[];
        for(const f of s.frags){const [A,B]=split(f,p1[0],p1[1],p2[0],p2[1]);if(A&&B&&area(A)>=.015&&area(B)>=.015){out.push(A,B);any=true;}else out.push(f);}
        return any?{ok:true,frags:out,label:'Rez'}:{ok:false,label:'Rez mora da prođe kroz šniclu'};
      }
      const [A,B]=split(poly,p1[0],p1[1],p2[0],p2[1]);
      if(!A||!B)return{ok:false,label:'Rez mora da prođe kroz meso'};
      const aA=area(A),aB=area(B),small=aA<=aB?A:B,keep=small===A?B:A,as=Math.min(aA,aB);
      const ch=chord(small,p1,p2),t=ch>0?(as*MW*MH/ch)/MW:Math.sqrt(as);
      if(t<MINT)return{ok:false,label:'Pretanko'};
      if(t>MAXT)return{ok:false,label:'Preširoko, rez bliže ivici'};
      return{ok:true,keep,small,thin:t<THIN,label:t<THIN?'Tanka šnicla':'Debela šnicla'};
    }
    function cropOf(poly2,key){
      if(!s.crops[key]&&window.meatPolyCrop)s.crops[key]=window.meatPolyCrop(img,poly2,Math.max(4,Math.round(img.naturalWidth*(mode==='snicla'?.02:.05))));
      return s.crops[key];
    }
    function frame(){
      g.clearRect(0,0,W,H);
      g.save();g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=30;g.shadowOffsetY=14;g.drawImage(board,cx-BOARD.w/2,cy-BOARD.h/2+10,BOARD.w,BOARD.h);g.restore();
      if(mode==='snicla'){
        s.frags.forEach((f,i)=>{const c=cropOf(f,i+':'+JSON.stringify(f));if(!c)return;const bb=c.box,mx=(bb.x0+bb.x1)/2-.5,my=(bb.y0+bb.y1)/2-.5,l=Math.hypot(mx,my)||1,gap=s.frags.length>1?7:0;
          g.save();g.shadowColor='rgba(0,0,0,.4)';g.shadowBlur=10;g.shadowOffsetY=5;g.drawImage(c.canvas,ox+bb.x0*MW+mx/l*gap,oy+bb.y0*MH+my/l*gap,(bb.x1-bb.x0)*MW,(bb.y1-bb.y0)*MH);g.restore();});
      }else{
        const c=cropOf(poly,JSON.stringify(poly));
        if(c){const bb=c.box;g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=14;g.shadowOffsetY=8;g.drawImage(c.canvas,ox+bb.x0*MW,oy+bb.y0*MH,(bb.x1-bb.x0)*MW,(bb.y1-bb.y0)*MH);g.restore();}
        // what was cut off lies on the board, as a pile on its right side (as big as the piece)
        s.cuts.forEach((k,i)=>{const im=k.thin?imThin:imThick,w=k.thin?270:300,h=w*im.height/im.width,x=cx+10+i*26,y=cy+BOARD.h/2-h-34-i*30;
          g.save();g.shadowColor='rgba(0,0,0,.45)';g.shadowBlur=10;g.shadowOffsetY=5;g.drawImage(im,Math.min(cx+BOARD.w/2-w-6,x),y,w,h);g.restore();});
      }
      if(s.cur&&s.stroke){
        g.save();g.strokeStyle='#fff';g.lineWidth=3;g.shadowColor='#8c6bff';g.shadowBlur=14;g.setLineDash([10,6]);
        g.beginPath();g.moveTo(s.stroke.x,s.stroke.y);g.lineTo(s.cur.x,s.cur.y);g.stroke();g.restore();
        const m=measure(s.stroke,s.cur);
        if(m){g.save();g.font='700 20px system-ui';g.textAlign='center';g.fillStyle=m.ok?'#fff3d6':'#ffb4a8';g.shadowColor='#000';g.shadowBlur=4;
          g.fillText(m.label,(s.stroke.x+s.cur.x)/2,Math.min(s.stroke.y,s.cur.y)-10);g.restore();}
      }
      s.raf=requestAnimationFrame(frame);
    }
    s.raf=requestAnimationFrame(frame);
    cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);s.stroke=pos(e);s.cur=s.stroke;});
    cv.addEventListener('pointermove',e=>{if(s.stroke)s.cur=pos(e);});
    cv.addEventListener('pointerup',()=>{
      if(!s.stroke)return;const m=s.cur?measure(s.stroke,s.cur):null;s.stroke=null;
      if(!m)return;
      if(!m.ok){hint.textContent=m.label+'.';return;}
      try{window.playChop&&playChop();}catch(_){}
      if(mode==='snicla'){s.frags=m.frags;hint.textContent='Delova: '+s.frags.length+'. Seci dalje, ili C da dobiješ komade.';return;}
      const msg=window.meatSlicePoly(target,m.keep,m.small,m.thin);
      s.cuts.push({thin:m.thin});poly=m.keep;
      hint.textContent=msg+' Nastavi, ili C za kraj.';
      if(!(window.items||[]).includes(target))close(false);
    });
    cv.addEventListener('pointercancel',()=>{s.stroke=null;});
  }
  // C opens and closes the manual cut (capture: before the game's own C key)
  window.addEventListener('keydown',e=>{
    if(!(e.key==='c'||e.key==='C'||e.key==='с'||e.key==='С'||e.code==='KeyC')||e.repeat||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target&&e.target.tagName||''))return;
    if(st){e.preventDefault();e.stopImmediatePropagation();close();return;}
    const t=targetOnBoard();
    if(t){e.preventDefault();e.stopImmediatePropagation();open(t);}
  },true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&st){e.stopPropagation();close(false);}},true);
  // a visible button: it appears when meat lies on the board
  const btn=document.createElement('button');btn.type='button';btn.setAttribute('data-tool-ui','1');btn.textContent='✂ Ručno sečenje mesa (C)';
  btn.style.cssText='position:fixed;left:14px;top:230px;z-index:8000;display:none;padding:8px 12px;border-radius:10px;border:2px solid #4a2a12;background:#f1d9a6;color:#3a1d0a;font:14px system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 10px #0006';
  btn.onclick=()=>{const t=targetOnBoard();if(t)open(t);};
  document.body.appendChild(btn);
  setInterval(()=>{let ok=false;try{const b=document.body.classList;ok=!st&&!!targetOnBoard()&&!b.contains('pantry-open')&&!b.contains('garden-open')&&!b.contains('market-open');}catch(_){}btn.style.display=ok?'block':'none';},500);
  window.CooksterMeatManual={toggle:t=>{if(st)close();else open(t);},isOpen:()=>!!st};
})();
