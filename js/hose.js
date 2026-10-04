/* Cookster - water hose.
   The hose lies coiled on the floor above the table. Take one end (click and drag, or click, move, click) and bring it to the
   tap: it snaps on. The other end can then be carried anywhere; it swings like a real hose. Open the tap and the water runs
   down the hose and pours straight out of the free end. Above an open barrel (kaca) it fills the barrel.
   The hose is a verlet chain of points drawn on a canvas inside #scene (so it moves with the camera). Points that nobody
   pulls are "asleep" and keep their place; pulling an end wakes them one by one, like pulling a rope out of a coil. */
(function(){
  'use strict';
  const N=40,SEG=27,W=17,TH=17;                           // points, length of one piece, thickness (scene pixels)
  const LEN=(N-1)*SEG;
  const TAP={x:1482,y:116};                         // where the tap's spout is (scene coordinates)
  const TAP_FIT=50;                                 // an end let go within this distance snaps to the tap
  const COIL={x:960,y:194};                         // centre of the coil on the floor
  const SQ=.34;                                      // the coil is squashed because of the camera angle
  const RES=1.5,G=2600,DAMP=.945,STEP=1/90;
  const FILL_PER_SEC=5,POUR_H=95;                             // percent of the barrel per second
  let scene=null,cv=null,cx=null;
  let P=[];                                         // {x,y,px,py,asleep}
  const ends=[{mode:'floor',floor:0},{mode:'floor',floor:0}];   // per end: 'floor' | 'tap' | 'held'
  let held=null;                                    // {end, sx, sy, t0, carry}
  let hand={x:0,y:0};
  let settled=true,flow=0,flowT=0,running=false,lastT=0,acc=0,calm=0,settleT=0,dirty=true,spilledFull=false,tapToastShown=false;
  let puddles=[];                                   // {x,y,r,a,live}
  let fillSaveT=0,fillUiT=0,lastLanding=null;

  const sceneOf=(cX,cY)=>{try{return screenToScene(cX,cY);}catch(_){return{x:cX,y:cY};}};
  const idxOf=end=>end===0?0:N-1;

  // ---------- coil on the floor ----------
  function buildCoil(){
    const pts=[];let theta=0,len=0,r=5;const dense=[];
    const k=W+1.5;                                  // radius grows by this much per turn
    let prev=null;
    while(len<LEN+SEG&&theta<200){
      r=5+k*theta/(Math.PI*2);
      const x=COIL.x+r*Math.cos(theta),y=COIL.y+r*SQ*Math.sin(theta);
      if(prev)len+=Math.hypot(x-prev.x,y-prev.y);
      prev={x,y};dense.push({x,y,len});
      theta+=.06;
    }
    // resample at equal distances SEG
    let j=0;
    for(let i=0;i<N;i++){
      const target=i*SEG;
      while(j<dense.length-2&&dense[j+1].len<target)j++;
      const a=dense[j],b=dense[j+1],t=(target-a.len)/Math.max(1e-6,b.len-a.len);
      pts.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    }
    // centre the coil on COIL
    let minx=1e9,maxx=-1e9;for(const p of pts){minx=Math.min(minx,p.x);maxx=Math.max(maxx,p.x);}
    const dx=COIL.x-(minx+maxx)/2;
    P=pts.map(p=>({x:p.x+dx,y:p.y,px:p.x+dx,py:p.y,asleep:true}));
    ends[0]={mode:'floor',floor:P[0].y+14};ends[1]={mode:'floor',floor:P[N-1].y+14};
  }

  // ---------- helpers ----------
  const chainDist=(i,end)=>Math.abs(i-idxOf(end))*SEG;
  function nearestOnHose(x,y){
    let best=-1,bd=1e9;
    for(let i=0;i<N;i++){const d=Math.hypot(P[i].x-x,P[i].y-y);if(d<bd){bd=d;best=i;}}
    for(let i=0;i<N-1;i++){                         // also between the points
      const a=P[i],b=P[i+1],vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy||1;
      const t=Math.max(0,Math.min(1,((x-a.x)*vx+(y-a.y)*vy)/l2));
      const d=Math.hypot(a.x+vx*t-x,a.y+vy*t-y);
      if(d<bd){bd=d;best=t<.5?i:i+1;}
    }
    return{i:best,d:bd};
  }
  function pickEnd(x,y){
    const h=nearestOnHose(x,y);
    if(h.d>W*1.6+4)return -1;
    const d0=chainDist(h.i,0),d1=chainDist(h.i,1);
    const near=d0<=d1?0:1;
    if(Math.min(d0,d1)<=SEG*3.4)return near;       // clicked close to an end: that end
    const free=[0,1].filter(e=>ends[e].mode!=='tap');
    if(!free.length)return -1;
    return free.length===1?free[0]:near;           // clicked the middle: the end that is not on the tap
  }
  const floorY=()=>930;                              // no floor under the hose: it hangs by its weight wherever the ends are, only the bottom of the screen stops it

  // ---------- physics ----------
  function wake(p){if(p.asleep){p.asleep=false;p.px=p.x;p.py=p.y;}}
  function step(dt){
    const fl=floorY(),g=G*dt*dt;
    // hand and tap act as fixed points
    for(let e=0;e<2;e++){
      const p=P[idxOf(e)],m=ends[e];
      if(m.mode==='held'){wake(p);const k=.2;p.x+=(hand.x-p.x)*k;p.y+=(hand.y-p.y)*k;p.px=p.x;p.py=p.y;}   // the heavy hose lags a little behind the hand
      else if(m.mode==='tap'){p.x=p.px=TAP.x;p.y=p.py=TAP.y;p.asleep=false;}
      else if(m.mode==='drop'){p.x=p.px=m.x;p.y=p.py=m.y;p.asleep=false;}   // an end let go in mid-air stays where it was put
    }
    const fixed=(p,i)=>{
      const fx=m=>m==='held'||m==='tap'||m==='drop';
      if(i===0&&fx(ends[0].mode))return true;
      if(i===N-1&&fx(ends[1].mode))return true;
      return false;
    };
    let speed=0,awake=0;
    for(let i=0;i<N;i++){
      const p=P[i];if(p.asleep||fixed(p,i))continue;
      let vx=(p.x-p.px)*DAMP,vy=(p.y-p.py)*DAMP;
      p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy+g;
      awake++;speed+=Math.abs(vx)+Math.abs(vy);
    }
    for(let it=0;it<12;it++){
      for(let i=0;i<N-1;i++){
        const a=P[i],b=P[i+1];
        let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1e-6;
        const fa=fixed(a,i),fb=fixed(b,i+1);
        let wa=(a.asleep||fa)?0:1,wb=(b.asleep||fb)?0:1;
        if(wa+wb===0&&!(a.asleep!==b.asleep))continue;
        // a pulled sleeping point wakes up
        if(wa===0&&wb===0){
          const pull=d>SEG*1.05||d<SEG*.9;
          if(!pull)continue;
          if(a.asleep&&!fa){wake(a);wa=1;}
          if(b.asleep&&!fb){wake(b);wb=1;}
          if(wa+wb===0)continue;
        }else if((a.asleep&&!fa&&wb)||(b.asleep&&!fb&&wa)){
          if(d>SEG*1.05||d<SEG*.9){if(a.asleep&&!fa){wake(a);wa=1;}if(b.asleep&&!fb){wake(b);wb=1;}}
        }
        const diff=(d-SEG)/d,ws=wa+wb;
        if(!ws)continue;
        a.x+=dx*diff*wa/ws;a.y+=dy*diff*wa/ws;
        b.x-=dx*diff*wb/ws;b.y-=dy*diff*wb/ws;
      }
      // the floor: points never go below it, and they slow down when they lie on it
      for(let i=0;i<N;i++){
        const p=P[i];if(p.asleep||fixed(p,i))continue;
        if(p.y>fl){p.y=fl;p.px=p.x-(p.x-p.px)*.7;}
      }
    }
    return{speed:awake?speed/awake:0,awake};
  }
  function settle(){for(const p of P){p.px=p.x;p.py=p.y;}settled=true;}

  // ---------- drawing ----------
  function path(from,to){
    cx.beginPath();cx.moveTo(P[from].x,P[from].y);
    for(let i=from+1;i<=to;i++){
      const a=P[i-1],b=P[i],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      cx.quadraticCurveTo(a.x,a.y,mx,my);
    }
    cx.lineTo(P[to].x,P[to].y);
  }
  function stroke(col,w,ox,oy,from,to,dash,dashOff){
    cx.save();cx.translate(ox||0,oy||0);
    cx.strokeStyle=col;cx.lineWidth=w;cx.lineCap='round';cx.lineJoin='round';
    cx.setLineDash(dash||[]);cx.lineDashOffset=dashOff||0;
    path(from===undefined?0:from,to===undefined?N-1:to);cx.stroke();cx.restore();
  }
  // ---------- picture of the hose ----------
  const IMG=new Image();IMG.src='assets/calibration_props/crevo/crevo.webp';
  IMG.onload=()=>{dirty=true;if(cx)frameDraw(performance.now());};
  const BODY={x:200,w:850,y:24,h:108},FIT_F={x:0,w:172},FIT_M={x:1078,w:164},IMG_H=153;
  const SC=TH/BODY.h,ST=4;
  function dense(){                                 // the smooth curve through the chain, as points 4 px apart: {x,y,a,s}
    const raw=[{x:P[0].x,y:P[0].y}];
    let prev={x:P[0].x,y:P[0].y};
    for(let i=1;i<N;i++){
      const a=P[i-1],m={x:(a.x+P[i].x)/2,y:(a.y+P[i].y)/2};
      for(let k=1;k<=4;k++){
        const t=k/4,u=1-t;
        raw.push({x:u*u*prev.x+2*u*t*a.x+t*t*m.x,y:u*u*prev.y+2*u*t*a.y+t*t*m.y});
      }
      prev=m;
    }
    raw.push({x:P[N-1].x,y:P[N-1].y});
    const out=[];let carry=0,len=0;
    out.push({x:raw[0].x,y:raw[0].y,s:0});
    for(let i=1;i<raw.length;i++){
      let ax=raw[i-1].x,ay=raw[i-1].y;const bx=raw[i].x,by=raw[i].y;
      let d=Math.hypot(bx-ax,by-ay);
      while(carry+d>=ST&&d>0){
        const t=(ST-carry)/d;ax+=(bx-ax)*t;ay+=(by-ay)*t;d=Math.hypot(bx-ax,by-ay);
        len+=ST;out.push({x:ax,y:ay,s:len});carry=0;
      }
      carry+=d;
    }
    for(let i=0;i<out.length;i++){
      const a=out[Math.max(0,i-1)],b=out[Math.min(out.length-1,i+1)];
      out[i].a=Math.atan2(b.y-a.y,b.x-a.x);
    }
    return out;
  }
  function drawBody(){
    if(!IMG.complete||!IMG.naturalWidth){stroke('#3f9650',TH);return;}
    const pts=dense(),sw=ST/SC+.9,wrap=BODY.w-sw;
    for(const q of pts){
      const c=Math.cos(q.a),sn=Math.sin(q.a),flip=c<0;
      const sx=BODY.x+((q.s/SC)%wrap);
      // keep the light coming from above: strips that run leftwards are drawn turned round
      const k=flip?-1:1;
      cx.setTransform(RES*c*k,RES*sn*k,-RES*sn*k,RES*c*k,RES*q.x,RES*q.y);
      if(flip)cx.drawImage(IMG,sx,BODY.y,sw,BODY.h,-ST-.4,-TH/2,ST+.9,TH);
      else cx.drawImage(IMG,sx,BODY.y,sw,BODY.h,-.4,-TH/2,ST+.9,TH);
    }
    cx.setTransform(RES,0,0,RES,0,0);
  }
  function endDir(e){
    const a=P[idxOf(e)],b=P[e===0?2:N-3];
    return Math.atan2(a.y-b.y,a.x-b.x);              // pointing out of the hose
  }
  function tipOf(e){                                 // where the water comes out
    const p=P[e===0?0:N-1],a=endDir(e),L=(e===0?FIT_F.w:FIT_M.w)*SC;
    return{x:p.x+Math.cos(a)*L*.65,y:p.y+Math.sin(a)*L*.65};
  }
  function drawFitting(e){
    if(!IMG.complete||!IMG.naturalWidth)return;
    const p=P[idxOf(e)],a=endDir(e),c=Math.cos(a),sn=Math.sin(a),flip=c<0;
    const src=e===0?FIT_F:FIT_M,L=src.w*SC,H=IMG_H*SC;
    cx.setTransform(RES*c,RES*sn,-RES*sn,RES*c,RES*p.x,RES*p.y);
    cx.translate(L*.65,0);
    if(flip)cx.scale(1,-1);
    if(e===0){cx.scale(-1,1);cx.drawImage(IMG,src.x,0,src.w,IMG_H,0,-H/2,L,H);}
    else{cx.translate(-L,0);cx.drawImage(IMG,src.x,0,src.w,IMG_H,0,-H/2,L,H);}
    cx.setTransform(RES,0,0,RES,0,0);
  }
  function frameDraw(now){
    cx.setTransform(RES,0,0,RES,0,0);
    cx.clearRect(0,0,cv.width/RES,cv.height/RES);
    // puddles
    for(const q of puddles){
      cx.save();cx.globalAlpha=q.a*.6;
      const gr=cx.createRadialGradient(q.x,q.y,2,q.x,q.y,q.r);
      gr.addColorStop(0,'rgba(120,190,215,.75)');gr.addColorStop(.8,'rgba(96,170,200,.5)');gr.addColorStop(1,'rgba(96,170,200,0)');
      cx.fillStyle=gr;cx.beginPath();cx.ellipse(q.x,q.y,q.r,q.r*.38,0,0,Math.PI*2);cx.fill();cx.restore();
    }
    // snap ring at the tap while an end is carried near it
    if(held&&ends.some(m=>m.mode==='held')){
      const near=Math.hypot(hand.x-TAP.x,hand.y-TAP.y)<TAP_FIT&&!ends.some(m=>m.mode==='tap');
      if(near){cx.save();cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=2.5;cx.setLineDash([5,4]);cx.beginPath();cx.arc(TAP.x,TAP.y,16,0,Math.PI*2);cx.stroke();cx.restore();}
    }
    // hose: shadow, then the picture of the hose (body strips + the two brass couplings), then the water inside
    stroke('rgba(0,0,0,.13)',TH+6,5,9);
    stroke('rgba(0,0,0,.20)',TH+2,3,6);
    drawBody();
    const tapEnd=ends[0].mode==='tap'?0:ends[1].mode==='tap'?1:-1;
    if(tapEnd>=0&&flow>0){
      const reach=Math.max(1,Math.round(flow*(N-1)));
      const from=tapEnd===0?0:N-1-reach,to=tapEnd===0?reach:N-1;
      const off=tapEnd===0?-now/35:now/35;
      stroke('rgba(150,222,255,.5)',5.2,0,0,from,to,[9,11],off);
      stroke('rgba(240,252,255,.5)',1.8,-.6,-.8,from,to,[5,15],off*1.3);
    }
    drawFitting(0);drawFitting(1);
    // the stream
    const out=freeEnd();
    if(out>=0&&flow>=.995&&!landing(P[idxOf(out)]).inside){
      const p=P[idxOf(out)],land=landing(p),tip=tipOf(out);
      const x=tip.x+Math.sin(now/90)*.8,len=Math.max(8,land.y-tip.y);
      const gr=cx.createLinearGradient(0,tip.y,0,tip.y+len);
      gr.addColorStop(0,'rgba(190,232,252,.95)');gr.addColorStop(1,'rgba(150,215,245,.78)');
      cx.save();cx.lineCap='round';
      cx.strokeStyle=gr;cx.lineWidth=7;cx.beginPath();cx.moveTo(x,tip.y+2);cx.lineTo(x+Math.sin(now/130)*.6,land.y);cx.stroke();
      cx.strokeStyle='rgba(255,255,255,.85)';cx.lineWidth=2;cx.setLineDash([7,9]);cx.lineDashOffset=-now/9;
      cx.beginPath();cx.moveTo(x-1.4,tip.y+2);cx.lineTo(x-1.4,land.y);cx.stroke();
      cx.setLineDash([]);
      // splash at the bottom
      for(let k=0;k<7;k++){
        const ph=(now/260+k*.37)%1,ang=(k/7)*Math.PI*2+k;
        const sx=x+Math.cos(ang)*(4+ph*14),sy=land.y-Math.abs(Math.sin(ang))*ph*14+ph*ph*8;
        cx.fillStyle=`rgba(225,246,255,${(1-ph)*.85})`;cx.beginPath();cx.arc(sx,sy,2.6*(1-ph*.5),0,Math.PI*2);cx.fill();
      }
      cx.fillStyle='rgba(215,242,255,.55)';cx.beginPath();cx.ellipse(x,land.y,13,4.5,0,0,Math.PI*2);cx.fill();
      cx.restore();
    }
  }

  // ---------- water ----------
  function freeEnd(){                               // the end the water comes out of
    const t=ends[0].mode==='tap'?0:ends[1].mode==='tap'?1:-1;
    return t<0?-1:1-t;
  }
  function landing(p){
    const o=window.CooksterKaca&&CooksterKaca.openingAt(p.x,p.y);
    if(o&&!o.closed){
      if(o.inside)return{y:p.y,barrel:o,inside:true};                    // the end is down in the barrel
      if(p.y<=o.y&&o.y-p.y<=POUR_H)return{y:o.y,barrel:o};               // close above the opening: pours in
    }
    return{y:p.y+56,barrel:null};
  }
  // the front of the barrel is drawn over the hose while an end is inside the barrel
  let maskEl=null,maskImg=null,maskFor=null;
  function updateMask(){
    let o=null;
    for(let e=0;e<2&&!o;e++){
      const q=window.CooksterKaca&&CooksterKaca.openingAt(P[idxOf(e)].x,P[idxOf(e)].y);
      if(q&&q.inside&&!q.closed)o=q;
    }
    if(!maskEl){
      maskEl=document.createElement('div');maskEl.id='hoseBarrelMask';
      maskEl.style.cssText='position:absolute;z-index:10401;pointer-events:none;display:none';
      maskImg=document.createElement('img');maskImg.alt='';maskImg.draggable=false;
      maskImg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      maskEl.appendChild(maskImg);scene.appendChild(maskEl);
    }
    if(!o){maskEl.style.display='none';maskFor=null;return;}
    const m=CooksterKaca.maskInfo(o.el);
    maskEl.style.left=m.x+'px';maskEl.style.top=m.y+'px';maskEl.style.width=m.w+'px';maskEl.style.height=m.h+'px';
    if(maskImg.getAttribute('src')!==m.src)maskImg.src=m.src;
    maskImg.style.clipPath=maskImg.style.webkitClipPath='polygon('+m.poly+')';
    maskEl.style.display='block';maskFor=o.el;
  }

  // ---------- main loop ----------
  function loop(t){
    const dt=Math.min(.05,(t-lastT)/1000||.016);lastT=t;
    acc+=dt;
    let moving=false;
    const heldNow=ends.some(m=>m.mode==='held');
    let guard=0;
    if(settled&&!heldNow)acc=0;
    while(acc>=STEP&&guard++<5){
      acc-=STEP;
      const r=step(STEP);
      if(r.awake){
        moving=true;
        if(!heldNow){
          settleT+=STEP;
          calm=r.speed<.12?calm+STEP:0;
          if(calm>.5||settleT>4){settle();calm=0;settleT=0;}
        }else{settleT=0;calm=0;}
      }
    }
    // water: ramps up while the tap is open and one end is on it
    const on=!!(typeof faucetOn!=='undefined'&&faucetOn)&&ends.some(m=>m.mode==='tap');
    const prev=flow;
    flow=on?Math.min(1,flow+dt/.9):Math.max(0,flow-dt/.25);
    scene.classList.toggle('hose-on',ends.some(m=>m.mode==='tap'));
    const out=freeEnd();
    let flowing=false;
    if(out>=0&&flow>=.995){
      flowing=true;
      const p=P[idxOf(out)],land=landing(p);
      if(land.barrel){
        const o=land.barrel;
        if(o.full){
          if(!spilledFull){spilledFull=true;try{showToast('Bure je puno vode.');}catch(_){}}
        }else{
          const w=CooksterKaca.addWater(o.el,FILL_PER_SEC*dt);
          fillSaveT+=dt;
          if(w>=100||fillSaveT>2){fillSaveT=0;try{CooksterSave.schedule();}catch(_){}}
        }
      }else if(!heldNow){
        // pours on the floor (once the end is put down): a puddle grows under the stream
        const x=p.x,y=land.y;
        let q=puddles.length?puddles[puddles.length-1]:null;
        if(!q||!q.live||Math.hypot(q.x-x,q.y-y)>34){
          q={x,y,r:6,a:1,live:true};puddles.push(q);if(puddles.length>4)puddles.shift();
        }
        q.r=Math.min(46,q.r+dt*9);q.a=1;
      }
    }else{
      for(const q of puddles)q.live=false;
      spilledFull=false;
    }
    for(const q of puddles){if(!q.live)q.a-=dt*.22;}
    puddles=puddles.filter(q=>q.a>0);
    const active=moving||heldNow||flow>0||puddles.length>0||prev!==flow;
    frameDraw(t);updateMask();
    if(active)requestAnimationFrame(loop);else{running=false;}
  }
  function kick(){if(!running){running=true;lastT=performance.now();requestAnimationFrame(loop);}}

  // ---------- pointer handling ----------
  function inScene(e){return !!(e.target&&e.target.closest&&e.target.closest('#scene'));}
  function setHand(e){const s=sceneOf(e.clientX,e.clientY);hand.x=Math.max(8,Math.min(1664,s.x));hand.y=Math.max(8,Math.min(930,s.y));
    // while the other end is on the tap the hose can only reach so far
    for(let e=0;e<2;e++){
      const m=ends[e];
      if(m.mode!=='tap'&&m.mode!=='drop')continue;
      const ax=m.mode==='tap'?TAP.x:m.x,ay=m.mode==='tap'?TAP.y:m.y;
      const dx=hand.x-ax,dy=hand.y-ay,d=Math.hypot(dx,dy),lim=LEN*.985;
      if(d>lim){hand.x=ax+dx/d*lim;hand.y=ay+dy/d*lim;}
    }
  }
  function release(){
    if(!held)return;
    const e=held.end,p=P[idxOf(e)];
    const tapFree=!ends.some(m=>m.mode==='tap');
    if(tapFree&&Math.hypot(hand.x-TAP.x,hand.y-TAP.y)<TAP_FIT){
      ends[e]={mode:'tap'};p.x=p.px=TAP.x;p.y=p.py=TAP.y;
      if(!(typeof faucetOn!=='undefined'&&faucetOn)){
        try{showToast('Crevo je na slavini. Klikni na slavinu da pustiš vodu.');}catch(_){}
      }
    }else{
      ends[e]={mode:'drop',x:hand.x,y:hand.y};p.x=p.px=hand.x;p.y=p.py=hand.y;
    }
    held=null;settleT=0;calm=0;settled=false;
    kick();
  }
  function onDown(e){
    if(e.button!==0)return;
    if(held){                                       // carried end: this click puts it down
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      setHand(e);release();return;
    }
    if(!inScene(e))return;
    try{if(holding||placing||picking||isCutting)return;}catch(_){}
    let s=sceneOf(e.clientX,e.clientY);
    try{if(faucetHit(e.clientX,e.clientY))return;}catch(_){}   // the tap itself is for opening and closing the water
    const end=pickEnd(s.x,s.y);
    if(end<0)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    ends[end]={mode:'held'};
    held={end,sx:e.clientX,sy:e.clientY,t0:performance.now(),carry:false};
    settled=false;setHand(e);
    try{playSfxVariant('woodDrop',.08);}catch(_){}
    kick();
  }
  function onMove(e){
    if(!held)return;
    setHand(e);
    if(!held.carry&&Math.hypot(e.clientX-held.sx,e.clientY-held.sy)>10)held.dragged=true;
    kick();
  }
  function onUp(e){
    if(!held||held.carry)return;
    if(e.button!==undefined&&e.button!==0)return;
    const quick=!held.dragged&&performance.now()-held.t0<350;
    if(quick){held.carry=true;return;}               // a short click: keep carrying the end until the next click
    setHand(e);release();
  }

  function init(){
    scene=document.getElementById('scene');
    if(!scene||typeof screenToScene!=='function')return setTimeout(init,300);
    cv=document.createElement('canvas');cv.id='hoseCanvas';
    cv.width=Math.round(1672*RES);cv.height=Math.round(941*RES);
    cv.style.cssText='position:absolute;left:0;top:0;width:1672px;height:941px;z-index:10400;pointer-events:none';
    scene.appendChild(cv);cx=cv.getContext('2d');
    const css=document.createElement('style');
    css.textContent='#scene.hose-on #waterStream,#scene.hose-on #waterSplash{opacity:0!important}';
    document.head.appendChild(css);
    buildCoil();
    window.addEventListener('pointerdown',onDown,{capture:true});
    window.addEventListener('pointermove',onMove,{capture:true,passive:true});
    window.addEventListener('pointerup',onUp,{capture:true});
    window.addEventListener('contextmenu',e=>{if(held){e.preventDefault();}},{capture:true});
    // the tap can be opened while the hose is already on it
    setInterval(()=>{if(ends.some(m=>m.mode==='tap')&&((typeof faucetOn!=='undefined'&&faucetOn)||flow>0))kick();},200);
    frameDraw(0);
  }
  window.CooksterHose={
    debug(){return{ends:JSON.parse(JSON.stringify(ends)),flow,held:!!held,P:P.map(p=>[Math.round(p.x),Math.round(p.y),p.asleep?1:0]),puddles:puddles.length,running};},
    grab(end,x,y){settled=false;ends[end]={mode:'held'};held={end,sx:0,sy:0,t0:0,carry:true,dragged:true};hand.x=x;hand.y=y;kick();},
    move(x,y){hand.x=x;hand.y=y;kick();},
    drop(){release();},
    TAP,COIL
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
