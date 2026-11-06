/* Cookster: ručno sečenje mesa. C otvara (nad parčetom mesa na dasci), C ponovo zatvara. Povučeš nož odozgo nadole preko mesa:
   rez uzima šniclu od NAJBLIŽE ivice do reza (blizu ivice = tanka, dalje = debela). Svaki rez je jedna šnicla, a parče postaje kraće.
   Širina šnicle je deo CELE širine parčeta (game.js: meatSliceFraction). E ostaje brzo automatsko sečenje. */
(function(){
  'use strict';
  const W=1280,H=720,MW=560,GAP=.02,THIN=.14,MAXW=.34,MINW=.05,BOARD={w:426*1.9,h:285*1.9};
  let st=null;
  const cache={};
  function load(src){return cache[src]||(cache[src]=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;}));}
  function pieceOnBoard(){
    for(const el of (window.items||[])){
      if(el.dataset.attachedToBoard!=='1')continue;
      const d=(window.CooksterCatalog&&CooksterCatalog.VEGETABLES||{})[el.dataset.vegKey];
      if(d&&d.meat==='parce')return el;
    }
    return null;
  }
  function close(){
    if(!st)return;const s=st;st=null;cancelAnimationFrame(s.raf);s.root.style.opacity='0';setTimeout(()=>s.root.remove(),220);
  }
  async function open(target){
    if(st)return;
    const body=target.querySelector('.body');
    const src=(body&&body.src)||'assets/meat/junetina_parce.png';
    const [meat,board]=await Promise.all([load(src),load('assets/new_props/daska.png')]);
    const root=document.createElement('div');root.setAttribute('data-tool-ui','1');
    root.style.cssText='position:fixed;inset:0;z-index:30000;background:rgba(18,9,3,.62);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s';
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='max-width:100vw;max-height:100vh;touch-action:none;cursor:crosshair';
    const bar=document.createElement('div');bar.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);display:flex;gap:8px;z-index:1;font:15px system-ui,sans-serif';
    const hint=document.createElement('div');hint.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);color:#fff3d6;font:15px system-ui,sans-serif;text-shadow:0 1px 3px #000;text-align:center;max-width:90vw';
    hint.textContent='Povuci nož odozgo nadole preko mesa. Blizu ivice = tanka šnicla, dalje = debela. Svaki rez je jedna šnicla. C ili „Gotovo“ zatvara.';
    const btn=document.createElement('button');btn.textContent='Gotovo (C)';btn.style.cssText='font:inherit;padding:8px 14px;border-radius:10px;border:2px solid #4a2a12;background:#f1d9a6;color:#3a1d0a;cursor:pointer';btn.onclick=close;bar.appendChild(btn);
    for(const ev of ['pointerdown','pointerup','pointermove','mousedown','mouseup','mousemove','click','dblclick','touchstart','touchmove','touchend','contextmenu','wheel'])root.addEventListener(ev,e=>e.stopPropagation());
    root.append(cv,bar,hint);document.body.appendChild(root);requestAnimationFrame(()=>{root.style.opacity='1';});
    const MH=MW*meat.height/meat.width,cx=W/2,cy=H/2-10,x0=cx-MW/2,top=cy-MH/2,g=cv.getContext('2d');
    const s=st={root,target,raf:0,stroke:null,cur:null,cuts:[]};
    const LR=()=>[+(target.dataset.meatClipL||0),+(target.dataset.meatClipR||0)];
    const pos=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
    function measure(a,b){
      const dx=b.x-a.x,dy=b.y-a.y;
      if(Math.hypot(dx,dy)<30)return null;
      if(Math.abs(dy)<Math.abs(dx)*1.1)return{ok:false,label:'Seci odozgo nadole'};
      if(Math.min(a.y,b.y)>cy||Math.max(a.y,b.y)<cy)return{ok:false,label:'Rez mora da prođe preko mesa'};
      const f=(a.x+dx*(cy-a.y)/dy-x0)/MW,[L,R]=LR();
      if(f<=L+GAP||f>=1-R-GAP)return{ok:false,label:'Rez je van mesa ili na samoj ivici'};
      const wl=f-L,wr=(1-R)-f,left=wl<=wr,w=left?wl:wr;
      if(w<MINW)return{ok:false,label:'Pretanko'};
      if(w>MAXW)return{ok:false,label:'Preširoko, rez bliže ivici'};
      return{ok:true,f,w,side:left?'left':'right',label:w<THIN?'Tanka šnicla':'Debela šnicla'};
    }
    function frame(){
      g.clearRect(0,0,W,H);
      g.save();g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=30;g.shadowOffsetY=14;g.drawImage(board,cx-BOARD.w/2,cy-BOARD.h/2+10,BOARD.w,BOARD.h);g.restore();
      const [L,R]=LR(),sw=(1-L-R);
      if(sw>0){g.save();g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=14;g.shadowOffsetY=8;
        g.drawImage(meat,L*meat.width,0,sw*meat.width,meat.height,x0+L*MW,top,sw*MW,MH);g.restore();}
      // what was cut off (small slices lined up on the right of the board)
      s.cuts.forEach((c,i)=>{g.fillStyle=c.thin?'#c0392b':'#a02b20';const w=c.thin?22:36;g.fillRect(cx+BOARD.w/2+12+(i%6)*40,cy-BOARD.h/2+30+Math.floor(i/6)*60,w,48);});
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
      const msg=window.meatSliceFraction(target,m.w,m.side);
      try{window.playChop&&playChop();}catch(_){}
      s.cuts.push({thin:m.w<THIN});
      hint.textContent=msg+' Nastavi, ili C za kraj.';
      if(!(window.items||[]).includes(target))close();
    });
    cv.addEventListener('pointercancel',()=>{s.stroke=null;});
  }
  // C opens and closes the manual cut (capture: before the game's own C key)
  window.addEventListener('keydown',e=>{
    if(!(e.key==='c'||e.key==='C'||e.key==='с'||e.key==='С'||e.code==='KeyC')||e.repeat||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target&&e.target.tagName||''))return;
    if(st){e.preventDefault();e.stopImmediatePropagation();close();return;}
    const t=pieceOnBoard();
    if(t){e.preventDefault();e.stopImmediatePropagation();open(t);}
  },true);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&st){e.stopPropagation();close();}},true);
  // a visible button next to the keyboard: it appears when a piece of meat lies on the board
  const btn=document.createElement('button');btn.type='button';btn.setAttribute('data-tool-ui','1');btn.textContent='✂ Ručno sečenje mesa (C)';
  btn.style.cssText='position:fixed;left:14px;top:230px;z-index:8000;display:none;padding:8px 12px;border-radius:10px;border:2px solid #4a2a12;background:#f1d9a6;color:#3a1d0a;font:14px system-ui,sans-serif;cursor:pointer;box-shadow:0 3px 10px #0006';
  btn.onclick=()=>{const t=pieceOnBoard();if(t)open(t);};
  document.body.appendChild(btn);
  setInterval(()=>{let ok=false;try{ok=!st&&!!pieceOnBoard()&&!document.body.classList.contains('pantry-open')&&!document.body.classList.contains('garden-open')&&!document.body.classList.contains('market-open');}catch(_){}btn.style.display=ok?'block':'none';},500);
  window.CooksterMeatManual={toggle:t=>{if(st)close();else open(t);},isOpen:()=>!!st};
})();
