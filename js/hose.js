/* Cookster - water hose.
   The hose lies coiled on the floor behind the table. Take one end (click and drag, or click, move, click) and bring it to the
   tap: it snaps on. The other end can then be carried anywhere on the floor; the hose slides over the floor and swings a
   little like a real, heavy hose. Open the tap and the water runs down the hose and pours out of the free end. Put the free
   end into an open barrel (kaca) and it fills the barrel.

   The hose is a flat chain of points on the floor (the floor of the calibrated scene: assets/scene-calibration.json, or what
   was saved in the browser). It never goes over anything: the table, the table legs, the cabinet, the chimneys and the pile of
   wood are MASKS that hide the part of the hose behind them, and the stove can not be entered. At the barrel the hose is seen
   only where the user drew it in the tool "Maska posude" (green = visible, red = the front of the barrel hides it).
   Points that nobody pulls are "asleep" and keep their place; pulling an end wakes them one by one like a rope out of a coil. */
(function(){
  'use strict';
  const N=80,SEG=21,W=17,TH=17;                     // points, length of one piece, thickness (scene pixels)
  const LEN=(N-1)*SEG;
  const TAP={x:1482,y:116};                         // where the tap's spout is on the picture
  const TAP_FIT=50;                                 // an end let go within this distance of the spout snaps to the tap
  const COIL={x:960,y:186};                         // centre of the coil on the floor (behind the table)
  const SQ=.3;                                      // the coil is squashed because of the camera angle
  const RES=1.5,DAMP=.82,STEP=1/90,STICK=.5,STICK_END=6,BEND=1.93;   // STICK: pulls smaller than this (per step) do not move a hose lying on the floor
  const FILL_PER_SEC=5,POUR_H=95;                   // percent of the barrel per second; how high above the opening it still pours in
  const H_STOVE=265,SLAB=24;                        // the stove stands on the floor, the table top is a plate this thick
  let scene=null,cv=null,cx=null,SW=1672,SH=941;
  let P=[];                                         // {x,y,px,py,asleep}
  const ends=[{mode:'floor'},{mode:'floor'}];       // per end: 'floor' (still in the coil) | 'free' | 'held' | 'tap'
  let held=null;                                    // {end, sx, sy, t0, carry}
  let hand={x:0,y:0};
  let settled=true,flow=0,running=false,lastT=0,acc=0,calm=0,settleT=0,spilledFull=false;
  let puddles=[];                                   // {x,y,r,a,live}
  let fillSaveT=0;

  const sceneOf=(cX,cY)=>{try{return screenToScene(cX,cY);}catch(_){return{x:cX,y:cY};}};
  const idxOf=end=>end===0?0:N-1;

  // ---------- geometry helpers ----------
  function pip(poly,x,y){
    let ins=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])ins=!ins;
    }
    return ins;
  }
  function nearestEdge(poly,x,y){
    let best={d:1e18,x,y};
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],vx=b[0]-a[0],vy=b[1]-a[1],l2=vx*vx+vy*vy||1;
      const t=Math.max(0,Math.min(1,((x-a[0])*vx+(y-a[1])*vy)/l2)),qx=a[0]+vx*t,qy=a[1]+vy*t,d=(qx-x)*(qx-x)+(qy-y)*(qy-y);
      if(d<best.d)best={d,x:qx,y:qy};
    }
    return best;
  }
  function hull(pts){
    const p=pts.map(q=>[q[0],q[1]]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lo=[],up=[];
    for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}
    for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q);}
    lo.pop();up.pop();return lo.concat(up);
  }
  const shift=(poly,dy)=>poly.map(q=>[q[0],q[1]+dy]);
  const centroid=poly=>{let x=0,y=0;for(const q of poly){x+=q[0];y+=q[1];}return[x/poly.length,y/poly.length];};

  // ---------- the calibrated scene ----------
  let FLOOR=null,CORRIDOR=null,STOVE=null,MASKS=[];
  function loadZones(){
    let z={};
    try{const x=new XMLHttpRequest();x.open('GET','assets/scene-calibration.json',false);x.send(null);if(x.status>=200&&x.status<300)z=JSON.parse(x.responseText)||{};}catch(_){}
    try{const s=JSON.parse(localStorage.getItem('cookster.scene-volumes.v3')||'null');if(s)z={...z,...s};}catch(_){}
    return z;
  }
  function buildWorld(){
    const z=loadZones();
    const top=id=>{const q=z[id];if(!q)return null;const a=q.kind==='volume'?(q.v||[]).slice(0,4):(q.points||[]);return a.length>=3?a:null;};
    FLOOR=top('floor');
    // the hose hangs from the tap down along the sink and then along the back of the stove: a narrow strip that is allowed too
    CORRIDOR=[[1440,96],[1530,96],[1530,248],[1180,248],[1180,196],[1440,196]];
    MASKS=[];
    // the whole table (top and the front of the plate) hides the hose; so do the legs and the other masks of the scene
    const tb=top('table');
    if(tb){const depth=(z.table&&z.table.depth)?Math.max(SLAB,z.table.depth):SLAB;MASKS.push(hull(tb.concat(shift(tb,depth))));}
    for(const id of ['left-leg','right-leg','cabinet-left','chimney-left','chimney-right','woodpile-left']){const pl=top(id);if(pl)MASKS.push(pl);}
    const sl=top('stove-left'),sr=top('stove-right'),st=sl&&sr?sl.concat(sr):(sl||sr);
    STOVE=st?hull(st.concat(shift(st,H_STOVE))):null;        // the stove: not walkable, and it hides the hose behind it
    if(STOVE)MASKS.push(STOVE);
  }
  const walkable=(x,y)=>(!FLOOR||pip(FLOOR,x,y))||pip(CORRIDOR,x,y);
  // keep a point on the floor: inside the floor (or the strip along the tap), outside the stove
  function fixPoint(p){
    if(FLOOR&&!walkable(p.x,p.y)){
      const e1=nearestEdge(FLOOR,p.x,p.y),e2=nearestEdge(CORRIDOR,p.x,p.y),e=e1.d<e2.d?e1:e2,poly=e1.d<e2.d?FLOOR:CORRIDOR;
      const c=centroid(poly),dx=c[0]-e.x,dy=c[1]-e.y,l=Math.hypot(dx,dy)||1;
      p.x=e.x+dx/l*.8;p.y=e.y+dy/l*.8;p.px=p.x;p.py=p.y;
    }
    if(STOVE&&pip(STOVE,p.x,p.y)&&!pip(CORRIDOR,p.x,p.y)){
      const e=nearestEdge(STOVE,p.x,p.y),dx=e.x-p.x,dy=e.y-p.y,l=Math.hypot(dx,dy)||1;
      p.x=e.x+dx/l*.8;p.y=e.y+dy/l*.8;p.px=p.x;p.py=p.y;
    }
  }

  // ---------- coil on the floor ----------
  function buildCoil(){
    const pts=[];let theta=0,len=0;const dense=[];
    const k=W+1.5;                                  // radius grows by this much per turn
    let prev=null;
    while(len<LEN+SEG&&theta<300){
      const r=5+k*theta/(Math.PI*2);
      const x=COIL.x+r*Math.cos(theta),y=COIL.y+r*SQ*Math.sin(theta);
      if(prev)len+=Math.hypot(x-prev.x,y-prev.y);
      prev={x,y};dense.push({x,y,len});
      theta+=.05;
    }
    let j=0;
    for(let i=0;i<N;i++){
      const target=i*SEG;
      while(j<dense.length-2&&dense[j+1].len<target)j++;
      const a=dense[j],b=dense[j+1],t=(target-a.len)/Math.max(1e-6,b.len-a.len);
      pts.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    }
    let minx=1e9,maxx=-1e9;for(const p of pts){minx=Math.min(minx,p.x);maxx=Math.max(maxx,p.x);}
    const dx=COIL.x-(minx+maxx)/2;
    P=pts.map(p=>({x:p.x+dx,y:p.y,px:p.x+dx,py:p.y,asleep:true}));
    ends[0]={mode:'floor'};ends[1]={mode:'floor'};
  }

  // ---------- picking the ends with the mouse ----------
  const chainDist=(i,end)=>Math.abs(i-idxOf(end))*SEG;
  function nearestOnHose(x,y){
    let best=-1,bd=1e9;
    for(let i=0;i<N-1;i++){
      const a=P[i],b=P[i+1],vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy||1;
      const t=Math.max(0,Math.min(1,((x-a.x)*vx+(y-a.y)*vy)/l2));
      const d=Math.hypot(a.x+vx*t-x,a.y+vy*t-y);
      if(d<bd){bd=d;best=t<.5?i:i+1;}
    }
    return{i:best,d:bd};
  }
  // can this spot of the hose be seen? (not behind a mask, or inside the open barrel)
  function visibleAt(x,y){
    for(const v of areas())if(pip(v,x,y))return true;
    for(const m of MASKS)if(pip(m,x,y))return false;
    return true;
  }
  function pickEnd(x,y){
    const h=nearestOnHose(x,y);
    if(h.d>W*1.6+4)return -1;
    if(!visibleAt(P[h.i].x,P[h.i].y))return -1;     // what you can not see you can not grab
    const d0=chainDist(h.i,0),d1=chainDist(h.i,1);
    const near=d0<=d1?0:1;
    if(Math.min(d0,d1)<=SEG*3.4)return near;       // clicked close to an end: that end
    const free=[0,1].filter(e=>ends[e].mode!=='tap');
    if(!free.length)return -1;
    return free.length===1?free[0]:near;           // clicked the middle: the end that is not on the tap
  }

  // ---------- physics ----------
  function wake(p){if(p.asleep){p.asleep=false;p.px=p.x;p.py=p.y;}}
  const isFixed=i=>{
    const m=i===0?ends[0].mode:i===N-1?ends[1].mode:null;
    return m==='held'||m==='tap';
  };
  function step(dt){
    // the hand and the tap act as fixed points
    for(let e=0;e<2;e++){
      const p=P[idxOf(e)],m=ends[e];
      if(m.mode==='held'){                         // the heavy hose lags a little behind the hand
        wake(p);const k=.2;
        p.x+=(hand.x-p.x)*k;p.y+=(hand.y-p.y)*k;
        fixPoint(p);
        p.px=p.x;p.py=p.y;
      }else if(m.mode==='tap'){p.x=p.px=TAP.x;p.y=p.py=TAP.y;p.asleep=false;}
    }
    let speed=0,awake=0;
    for(let i=0;i<N;i++){
      const p=P[i];if(p.asleep||isFixed(i))continue;
      const vx=(p.x-p.px)*DAMP,vy=(p.y-p.py)*DAMP;
      p.px=p.x;p.py=p.y;p.x0=p.x;p.y0=p.y;
      p.x+=vx;p.y+=vy;
      awake++;speed+=Math.abs(vx)+Math.abs(vy);
    }
    for(let it=0;it<10;it++){
      for(let i=0;i<N-1;i++){
        const a=P[i],b=P[i+1];
        const dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1e-6;
        const fa=isFixed(i),fb=isFixed(i+1);
        let wa=(a.asleep||fa)?0:1,wb=(b.asleep||fb)?0:1;
        if(wa+wb===0&&a.asleep===b.asleep)continue;
        // a pulled sleeping point wakes up
        if((a.asleep&&!fa)||(b.asleep&&!fb)){
          if(d>SEG*1.05||d<SEG*.9){if(a.asleep&&!fa){wake(a);wa=1;}if(b.asleep&&!fb){wake(b);wb=1;}}
        }
        const diff=(d-SEG)/d,ws=wa+wb;
        if(!ws)continue;
        a.x+=dx*diff*wa/ws;a.y+=dy*diff*wa/ws;
        b.x-=dx*diff*wb/ws;b.y-=dy*diff*wb/ws;
      }
      // a hose does not fold sharply: points two apart keep some distance
      for(let i=0;i<N-2;i++){
        const a=P[i],b=P[i+2];
        if(a.asleep&&b.asleep)continue;
        const dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)||1e-6,min=SEG*BEND;
        if(d>=min)continue;
        const fa=isFixed(i)||a.asleep,fb=isFixed(i+2)||b.asleep,ws=(fa?0:1)+(fb?0:1);
        if(!ws)continue;
        const diff=(d-min)/d*.5;
        if(!fa){a.x+=dx*diff/ws*1.0;a.y+=dy*diff/ws*1.0;}
        if(!fb){b.x-=dx*diff/ws*1.0;b.y-=dy*diff/ws*1.0;}
      }
      for(let i=0;i<N;i++){const p=P[i];if(!p.asleep&&!isFixed(i))fixPoint(p);}
    }
    for(let i=0;i<N;i++){                            // friction: a hose lying on the floor stays put unless it is really pulled
      const p=P[i];
      if(p.asleep||isFixed(i))continue;
      const endFree=(i===0&&ends[0].mode==='free')||(i===N-1&&ends[1].mode==='free');
      if(Math.hypot(p.x-p.x0,p.y-p.y0)<(endFree?STICK_END:STICK)){p.x=p.x0;p.y=p.y0;p.px=p.x;p.py=p.y;}
    }
    return{speed:awake?speed/awake:0,awake};
  }
  function settle(){for(const p of P){p.px=p.x;p.py=p.y;}settled=true;}

  // ---------- picture of the hose ----------
  const IMG=new Image();IMG.src='assets/calibration_props/crevo/crevo.webp';
  IMG.onload=()=>{if(cx)frameDraw(performance.now());};
  const BODY={x:200,w:850,y:24,h:108},FIT_F={x:0,w:172},FIT_M={x:1078,w:164},IMG_H=153;
  const SC=TH/BODY.h,ST=4;
  function dense(){                                 // the smooth curve through the chain as points 4 px apart
    const raw=[{x:P[0].x,y:P[0].y}];
    let prev={x:P[0].x,y:P[0].y};
    for(let i=1;i<N;i++){
      const a=P[i-1],b=P[i];
      const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      for(let k=1;k<=4;k++){
        const t=k/4,u=1-t;
        raw.push({x:u*u*prev.x+2*u*t*a.x+t*t*m.x,y:u*u*prev.y+2*u*t*a.y+t*t*m.y});
      }
      prev=m;
    }
    raw.push({x:P[N-1].x,y:P[N-1].y});
    const out=[raw[0]];out[0].s=0;
    let carry=0,len=0;
    for(let i=1;i<raw.length;i++){
      let ax=raw[i-1].x,ay=raw[i-1].y;const b=raw[i];
      let d=Math.hypot(b.x-ax,b.y-ay);
      while(carry+d>=ST&&d>0){
        const t=(ST-carry)/d;
        ax+=(b.x-ax)*t;ay+=(b.y-ay)*t;
        d=Math.hypot(b.x-ax,b.y-ay);len+=ST;
        out.push({x:ax,y:ay,s:len});carry=0;
      }
      carry+=d;
    }
    for(let i=0;i<out.length;i++){
      const a=out[Math.max(0,i-1)],b=out[Math.min(out.length-1,i+1)];
      out[i].a=Math.atan2(b.y-a.y,b.x-a.x);
    }
    return out;
  }
  function poly(S,a,b,dx,dy){
    cx.beginPath();
    cx.moveTo(S[a].x+(dx||0),S[a].y+(dy||0));
    for(let i=a+1;i<=b;i++)cx.lineTo(S[i].x+(dx||0),S[i].y+(dy||0));
  }
  function drawBody(S){
    if(!IMG.complete||!IMG.naturalWidth){poly(S,0,S.length-1);cx.strokeStyle='#3f9650';cx.lineWidth=TH;cx.lineCap='round';cx.stroke();return;}
    const sw=ST/SC+.9,wrap=BODY.w-sw;
    for(let i=0;i<S.length;i++){
      const q=S[i],c=Math.cos(q.a),sn=Math.sin(q.a),flip=c<0;
      const sx=BODY.x+((q.s/SC)%wrap),k=flip?-1:1;   // strips that run leftwards are turned round to keep the light from above
      cx.setTransform(RES*c*k,RES*sn*k,-RES*sn*k,RES*c*k,RES*q.x,RES*q.y);
      if(flip)cx.drawImage(IMG,sx,BODY.y,sw,BODY.h,-ST-.4,-TH/2,ST+.9,TH);
      else cx.drawImage(IMG,sx,BODY.y,sw,BODY.h,-.4,-TH/2,ST+.9,TH);
    }
    cx.setTransform(RES,0,0,RES,0,0);
  }
  function endDir(e){
    const a=P[idxOf(e)],b=P[e===0?3:N-4];
    return Math.atan2(a.y-b.y,a.x-b.x);              // pointing out of the hose
  }
  function tipOf(e){                                 // where the water comes out
    const p=P[idxOf(e)],a=endDir(e),L=(e===0?FIT_F.w:FIT_M.w)*SC;
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
  const areas=()=>{try{return window.CooksterKaca?CooksterKaca.visibleAreas():[];}catch(_){return[];}};
  // everything about the hose itself: shadow, the picture, the water inside, the couplings
  function paintHose(S,now){
    cx.lineCap='round';cx.lineJoin='round';
    poly(S,0,S.length-1,3,4);cx.strokeStyle='rgba(0,0,0,.15)';cx.lineWidth=TH+5;cx.stroke();
    poly(S,0,S.length-1,2,3);cx.strokeStyle='rgba(0,0,0,.2)';cx.lineWidth=TH+1;cx.stroke();
    drawBody(S);
    const tapEnd=ends[0].mode==='tap'?0:ends[1].mode==='tap'?1:-1;
    if(tapEnd>=0&&flow>0){
      const total=S[S.length-1].s,reach=flow*total;
      let i0=0,i1=S.length-1;
      if(tapEnd===0){while(i1>i0&&S[i1].s>reach)i1--;}else{while(i0<i1&&S[i0].s<total-reach)i0++;}
      if(i1>i0){
        const off=tapEnd===0?-now/35:now/35;
        cx.setLineDash([9,11]);cx.lineDashOffset=off;poly(S,i0,i1);cx.strokeStyle='rgba(150,222,255,.5)';cx.lineWidth=5.2;cx.stroke();
        cx.setLineDash([5,15]);cx.lineDashOffset=off*1.3;poly(S,i0,i1);cx.strokeStyle='rgba(240,252,255,.5)';cx.lineWidth=1.8;cx.stroke();
        cx.setLineDash([]);
      }
    }
    drawFitting(0);drawFitting(1);
  }
  function frameDraw(now){
    cx.setTransform(RES,0,0,RES,0,0);
    cx.clearRect(0,0,SW,SH);
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
    const S=dense();
    // 1. the hose, with the table, the legs and the other masks cut out of it
    cx.save();
    for(const m of MASKS){
      cx.beginPath();cx.rect(0,0,SW,SH);cx.moveTo(m[0][0],m[0][1]);for(let i=1;i<m.length;i++)cx.lineTo(m[i][0],m[i][1]);cx.closePath();
      cx.clip('evenodd');
    }
    paintHose(S,now);
    cx.restore();
    // 2. inside an open barrel the hose is seen even if the table is behind it
    for(const v of areas()){
      cx.save();
      cx.beginPath();cx.moveTo(v[0][0],v[0][1]);for(let i=1;i<v.length;i++)cx.lineTo(v[i][0],v[i][1]);cx.closePath();cx.clip();
      paintHose(S,now);
      cx.restore();
    }
    // the stream
    const out=freeEnd();
    if(out>=0&&flow>=.995){
      const land=landing(out);
      if(!land.inside&&visibleAt(P[idxOf(out)].x,P[idxOf(out)].y)){
        const tip=tipOf(out),x=tip.x+Math.sin(now/90)*.8,ly=Math.max(tip.y+6,land.y),len=ly-tip.y;
        const gr=cx.createLinearGradient(0,tip.y,0,tip.y+len);
        gr.addColorStop(0,'rgba(190,232,252,.95)');gr.addColorStop(1,'rgba(150,215,245,.78)');
        cx.save();cx.lineCap='round';
        cx.strokeStyle=gr;cx.lineWidth=7;cx.beginPath();cx.moveTo(x,tip.y+2);cx.lineTo(x+Math.sin(now/130)*.6,ly);cx.stroke();
        cx.strokeStyle='rgba(255,255,255,.85)';cx.lineWidth=2;cx.setLineDash([7,9]);cx.lineDashOffset=-now/9;
        cx.beginPath();cx.moveTo(x-1.4,tip.y+2);cx.lineTo(x-1.4,ly);cx.stroke();
        cx.setLineDash([]);
        for(let k=0;k<7;k++){                        // splash at the bottom
          const ph=(now/260+k*.37)%1,ang=(k/7)*Math.PI*2+k;
          const sx=x+Math.cos(ang)*(4+ph*14),sy=ly-Math.abs(Math.sin(ang))*ph*14+ph*ph*8;
          cx.fillStyle=`rgba(225,246,255,${(1-ph)*.85})`;cx.beginPath();cx.arc(sx,sy,2.6*(1-ph*.5),0,Math.PI*2);cx.fill();
        }
        cx.fillStyle='rgba(215,242,255,.55)';cx.beginPath();cx.ellipse(x,ly,13,4.5,0,0,Math.PI*2);cx.fill();
        cx.restore();
      }
    }
  }

  // ---------- water ----------
  function freeEnd(){                               // the end the water comes out of
    const t=ends[0].mode==='tap'?0:ends[1].mode==='tap'?1:-1;
    return t<0?-1:1-t;
  }
  function landing(e){                              // where the water from end e goes: into the barrel, or onto the floor
    const p=P[idxOf(e)];
    const o=window.CooksterKaca&&CooksterKaca.openingAt(p.x,p.y);
    if(o&&!o.closed){
      if(o.inside)return{y:p.y,barrel:o,inside:true};                    // the end is down in the barrel
      if(p.y<=o.y&&o.y-p.y<=POUR_H)return{y:o.y,barrel:o};               // close above the opening: pours in
    }
    return{y:p.y+38,barrel:null};
  }
  // the front of the barrel is drawn over the hose while an end is inside the barrel
  let maskEl=null,maskImg=null;
  function updateMask(){
    let o=null;
    for(let e=0;e<2&&!o;e++){
      const p=P[idxOf(e)];
      const q=window.CooksterKaca&&CooksterKaca.openingAt(p.x,p.y);
      if(q&&q.inside&&!q.closed)o=q;
    }
    if(!maskEl){
      maskEl=document.createElement('div');maskEl.id='hoseBarrelMask';
      maskEl.style.cssText='position:absolute;z-index:10401;pointer-events:none;display:none';
      maskImg=document.createElement('img');maskImg.alt='';maskImg.draggable=false;
      maskImg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
      maskEl.appendChild(maskImg);scene.appendChild(maskEl);
    }
    if(!o){maskEl.style.display='none';return;}
    const m=CooksterKaca.maskInfo(o.el);
    maskEl.style.left=m.x+'px';maskEl.style.top=m.y+'px';maskEl.style.width=m.w+'px';maskEl.style.height=m.h+'px';
    if(maskImg.getAttribute('src')!==m.src)maskImg.src=m.src;
    maskImg.style.clipPath=maskImg.style.webkitClipPath='polygon('+m.poly+')';
    maskEl.style.display='block';
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
          calm=r.speed<.1?calm+STEP:0;
          if(calm>.4||settleT>4){settle();calm=0;settleT=0;}
        }else{settleT=0;calm=0;}
      }
    }
    // water: ramps up while the tap is open and one end is on it
    const on=!!(typeof faucetOn!=='undefined'&&faucetOn)&&ends.some(m=>m.mode==='tap');
    const prev=flow;
    flow=on?Math.min(1,flow+dt/.9):Math.max(0,flow-dt/.25);
    scene.classList.toggle('hose-on',ends.some(m=>m.mode==='tap'));
    const out=freeEnd();
    if(out>=0&&flow>=.995){
      const land=landing(out);
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
        const p=P[idxOf(out)],x=p.x,y=land.y;
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
  function setHand(e){
    const s=sceneOf(e.clientX,e.clientY);
    hand.x=Math.max(8,Math.min(SW-8,s.x));hand.y=Math.max(8,Math.min(SH-8,s.y));
    // while the other end is on the tap the hose can only reach so far
    if(ends.some(m=>m.mode==='tap')){
      const dx=hand.x-TAP.x,dy=hand.y-TAP.y,d=Math.hypot(dx,dy),lim=LEN*.985;
      if(d>lim){hand.x=TAP.x+dx/d*lim;hand.y=TAP.y+dy/d*lim;}
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
      ends[e]={mode:'free'};                         // let go: it stays where it lies
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
    const s=sceneOf(e.clientX,e.clientY);
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
    cv.width=Math.round(SW*RES);cv.height=Math.round(SH*RES);
    cv.style.cssText='position:absolute;left:0;top:0;width:'+SW+'px;height:'+SH+'px;z-index:10400;pointer-events:none';
    scene.appendChild(cv);cx=cv.getContext('2d');
    const css=document.createElement('style');
    css.textContent='#scene.hose-on #waterStream,#scene.hose-on #waterSplash{opacity:0!important}';
    document.head.appendChild(css);
    buildWorld();
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
    debug(){return{ends:JSON.parse(JSON.stringify(ends)),flow,held:!!held,settled,
      P:P.map(p=>[Math.round(p.x),Math.round(p.y),0,p.asleep?1:0,Math.round(p.x),Math.round(p.y),visibleAt(p.x,p.y)?0:1]),
      puddles:puddles.length,running,masks:MASKS.length,floor:!!FLOOR};},
    grab(end,sx,sy){settled=false;ends[end]={mode:'held'};held={end,sx:0,sy:0,t0:0,carry:true,dragged:true};hand.x=sx;hand.y=sy;kick();},
    move(sx,sy){hand.x=sx;hand.y=sy;kick();},
    drop(){release();},
    TAP,COIL
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
