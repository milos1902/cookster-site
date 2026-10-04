/* Cookster - water hose.
   The hose lies coiled on the floor behind the table. Take one end (click and drag, or click, move, click) and bring it to the
   tap: it snaps on. The other end can then be carried anywhere; it swings like a real hose. Open the tap and the water runs
   down the hose and pours straight out of the free end. Above an open barrel (kaca) it fills the barrel.

   The hose is a verlet chain. Every point has a place on the floor (x, y) and a height h above it, and is drawn at (x, y - h).
   The calibrated scene (assets/scene-calibration.json, or what was saved in the browser) gives the solid things it can not go
   through: the table (it can lie on the top, hang over the edge, fall behind it or under it), the stove, the sink counter,
   the table legs and the walls (the edge of the floor). Parts of the hose behind a solid thing are hidden by it.
   Points that nobody pulls are "asleep" and keep their place; pulling an end wakes them one by one like a rope out of a coil. */
(function(){
  'use strict';
  const N=80,SEG=21,W=17,TH=17;                     // points, length of one piece, thickness (scene pixels)
  const LEN=(N-1)*SEG;
  const TAP_SCREEN={x:1482,y:116};                  // where the tap's spout is on the picture
  const TAP_FIT=50;                                 // an end let go within this distance of the spout snaps to the tap
  const COIL={x:960,y:186};                         // centre of the coil on the floor (behind the table)
  const SQ=.3;                                     // the coil is squashed because of the camera angle
  const RES=1.5,G=2600,DAMP=.945,STEP=1/90,STICK=.7,STICK_END=8;   // STICK: a point lying on something does not move for pulls smaller than this per step (friction)
  const FILL_PER_SEC=5,POUR_H=95;                   // percent of the barrel per second; how high above the opening it still pours in
  // heights above the floor, in scene pixels (read from the legs of the table, the front of the stove ...)
  const H_TABLE=185,SLAB=24,H_STOVE=265,H_COUNTER=300,HOLD=14;
  const TAP3={x:TAP_SCREEN.x,y:TAP_SCREEN.y+H_COUNTER+5,h:H_COUNTER+5};
  let scene=null,cv=null,cx=null,SW=1672,SH=941;
  let P=[];                                         // {x,y,h,px,py,ph,asleep}
  let scr=[];                                       // the same points as drawn on the picture
  const ends=[{mode:'floor'},{mode:'floor'}];       // per end: 'floor' (still in the coil) | 'free' | 'held' | 'tap'
  let held=null;                                    // {end, sx, sy, t0, carry}
  let mouse={x:0,y:0},hand={x:0,y:0,h:HOLD};
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
  const maxY=poly=>poly.reduce((m,q)=>Math.max(m,q[1]),-1e9);

  // ---------- the calibrated scene ----------
  let FLOOR=null,SOLIDS=[],LEGS=[],SILH={};
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
    SOLIDS=[];SILH={};
    const add=(name,poly,h,hollow,thick)=>{
      if(!poly)return;
      const tp=hull(poly);
      SOLIDS.push({name,top:tp,F:shift(tp,h),h,hollow:!!hollow,th:thick||0,front:maxY(shift(tp,h))});
      const sil=hull(tp.concat(shift(tp,hollow?thick:h)));
      SILH[name]=sil;
    };
    const tb=top('table');
    add('table',tb,H_TABLE,true,(z.table&&z.table.depth)?Math.max(SLAB,z.table.depth):SLAB);
    const sl=top('stove-left'),sr=top('stove-right');
    add('stove',sl&&sr?sl.concat(sr):(sl||sr),H_STOVE,false,0);
    add('counter',top('sink-rim'),H_COUNTER,false,0);
    SOLIDS.sort((a,b)=>b.h-a.h);                    // highest first: that is the one you hold the hose over
    LEGS=[];
    for(const id of ['left-leg','right-leg']){
      const pl=top(id);if(!pl)continue;
      const my=maxY(pl),bot=pl.filter(q=>q[1]>my-30);
      const xs=bot.map(q=>q[0]);
      LEGS.push({x0:Math.min(...xs)-3,x1:Math.max(...xs)+3,y0:my-30,y1:my+4,poly:pl,front:my});
      SILH[id]=pl;
    }
  }
  function supportBelow(x,y,h){                     // height of the surface a point at (x,y,h) would land on
    let s=0;
    for(const o of SOLIDS)if(h>=o.h-2&&pip(o.F,x,y))s=Math.max(s,o.h);
    return s;
  }
  // mouse position on the picture -> a place for the hand in the room
  function handFrom(sx,sy){
    let g=null;
    for(const o of SOLIDS)if(pip(o.top,sx,sy)){g={x:sx,y:sy+o.h,h:o.h+HOLD};break;}
    if(!g)g={x:sx,y:sy,h:HOLD};
    if(FLOOR&&!pip(FLOOR,g.x,g.y)){const e=nearestEdge(FLOOR,g.x,g.y);g.x=e.x;g.y=e.y;}
    return g;
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
    P=pts.map(p=>({x:p.x+dx,y:p.y,h:0,px:p.x+dx,py:p.y,ph:0,asleep:true}));
    ends[0]={mode:'floor'};ends[1]={mode:'floor'};
  }

  // ---------- where the points are on the picture, and what hides them ----------
  const MASK={table:1,'left-leg':2,'right-leg':4,stove:8,counter:16};
  function refreshScr(){
    scr=P.map((p,i)=>{
      const sy=p.y-p.h,sh=supportBelow(p.x,p.y,p.h);
      let m=0;
      for(const o of SOLIDS)if(p.h<o.h-(o.hollow?o.th:0)-1&&p.y<o.front&&pip(SILH[o.name],p.x,p.y-p.h))m|=MASK[o.name];
      for(const l of LEGS)if(p.h<H_TABLE&&p.y<l.front&&pip(l.poly,p.x,p.y-p.h))m|=l.poly===SILH['left-leg']?2:4;
      return{x:p.x,y:sy,sx:p.x+2,sy:p.y-sh+1,m,h:p.h,sh};
    });
  }

  // ---------- picking the ends with the mouse ----------
  const chainDist=(i,end)=>Math.abs(i-idxOf(end))*SEG;
  function nearestOnHose(x,y){
    let best=-1,bd=1e9;
    for(let i=0;i<N-1;i++){
      const a=scr[i],b=scr[i+1],vx=b.x-a.x,vy=b.y-a.y,l2=vx*vx+vy*vy||1;
      const t=Math.max(0,Math.min(1,((x-a.x)*vx+(y-a.y)*vy)/l2));
      const d=Math.hypot(a.x+vx*t-x,a.y+vy*t-y);
      if(d<bd){bd=d;best=t<.5?i:i+1;}
    }
    return{i:best,d:bd};
  }
  function pickEnd(x,y){
    refreshScr();
    const h=nearestOnHose(x,y);
    if(h.d>W*1.6+4)return -1;
    const d0=chainDist(h.i,0),d1=chainDist(h.i,1);
    const near=d0<=d1?0:1;
    if(Math.min(d0,d1)<=SEG*3.4)return near;       // clicked close to an end: that end
    const free=[0,1].filter(e=>ends[e].mode!=='tap');
    if(!free.length)return -1;
    return free.length===1?free[0]:near;           // clicked the middle: the end that is not on the tap
  }

  // ---------- physics ----------
  function wake(p){if(p.asleep){p.asleep=false;p.px=p.x;p.py=p.y;p.ph=p.h;}}
  const isFixed=i=>{
    const m=i===0?ends[0].mode:i===N-1?ends[1].mode:null;
    return m==='held'||m==='tap';
  };
  function collide(p){
    // the walls: the edge of the floor
    if(FLOOR&&!pip(FLOOR,p.x,p.y)){
      const e=nearestEdge(FLOOR,p.x,p.y);
      let cxm=0,cym=0;for(const q of FLOOR){cxm+=q[0];cym+=q[1];}cxm/=FLOOR.length;cym/=FLOOR.length;
      const dx=cxm-e.x,dy=cym-e.y,l=Math.hypot(dx,dy)||1;
      p.x=e.x+dx/l*.8;p.y=e.y+dy/l*.8;p.px=p.x;p.py=p.y;
    }
    // the floor
    if(p.h<0){p.h=0;p.ph=0;p.px=p.x-(p.x-p.px)*.8;p.py=p.y-(p.y-p.py)*.8;p.rest=true;}
    // solid things
    for(const o of SOLIDS){
      if(!pip(o.F,p.x,p.y))continue;
      const wasIn=pip(o.F,p.px,p.py);
      const lowEdge=o.hollow?o.h-o.th:0;            // for the table the space under the top plate is free
      if(p.h>=o.h||p.h<=lowEdge&&o.hollow)continue;
      let landed=false;
      if(wasIn){
        if(p.ph>=o.h-.5){p.h=o.h;landed=true;}
        else if(o.hollow&&p.ph<=lowEdge+.5){p.h=lowEdge;p.ph=lowEdge;continue;}
        else{pushOut(o.F,p);continue;}
      }else{pushOut(o.F,p);continue;}
      if(landed){p.ph=o.h;p.px=p.x-(p.x-p.px)*.8;p.py=p.y-(p.y-p.py)*.8;p.rest=true;}   // lying on top: it drags a little
    }
    // the table legs
    for(const l of LEGS){
      if(p.h>=H_TABLE||p.x<l.x0||p.x>l.x1||p.y<l.y0||p.y>l.y1)continue;
      const dl=p.x-l.x0,dr=l.x1-p.x,dt=p.y-l.y0,db=l.y1-p.y,m=Math.min(dl,dr,dt,db);
      if(m===dl)p.x=l.x0-.6;else if(m===dr)p.x=l.x1+.6;else if(m===dt)p.y=l.y0-.6;else p.y=l.y1+.6;
      p.px=p.x;p.py=p.y;
    }
  }
  function pushOut(poly,p){
    const e=nearestEdge(poly,p.x,p.y),dx=e.x-p.x,dy=e.y-p.y,l=Math.hypot(dx,dy)||1;
    p.x=e.x+dx/l*.8;p.y=e.y+dy/l*.8;p.px=p.x;p.py=p.y;
  }
  function step(dt){
    const g=G*dt*dt;
    // the hand and the tap act as fixed points
    for(let e=0;e<2;e++){
      const p=P[idxOf(e)],m=ends[e];
      if(m.mode==='held'){                         // the heavy hose lags a little behind the hand, and the hand can not go through a table either
        wake(p);const k=.2;
        p.px=p.x;p.py=p.y;p.ph=p.h;
        p.x+=(hand.x-p.x)*k;p.y+=(hand.y-p.y)*k;p.h+=(hand.h-p.h)*k;
        collide(p);
        p.px=p.x;p.py=p.y;p.ph=p.h;
      }
      else if(m.mode==='tap'){p.x=p.px=TAP3.x;p.y=p.py=TAP3.y;p.h=p.ph=TAP3.h;p.asleep=false;}
    }
    let speed=0,awake=0;
    for(let i=0;i<N;i++){
      const p=P[i];if(p.asleep||isFixed(i))continue;
      const vx=(p.x-p.px)*DAMP,vy=(p.y-p.py)*DAMP,vh=(p.h-p.ph)*DAMP;
      p.px=p.x;p.py=p.y;p.ph=p.h;p.x0=p.x;p.y0=p.y;p.rest=false;
      p.x+=vx;p.y+=vy;p.h+=vh-g;
      awake++;speed+=Math.abs(vx)+Math.abs(vy)+Math.abs(vh);
    }
    for(let it=0;it<10;it++){
      for(let i=0;i<N-1;i++){
        const a=P[i],b=P[i+1];
        const dx=b.x-a.x,dy=b.y-a.y,dh=b.h-a.h,d=Math.sqrt(dx*dx+dy*dy+dh*dh)||1e-6;
        const fa=isFixed(i),fb=isFixed(i+1);
        let wa=(a.asleep||fa)?0:1,wb=(b.asleep||fb)?0:1;
        if(wa+wb===0&&a.asleep===b.asleep)continue;
        // a pulled sleeping point wakes up
        if((a.asleep&&!fa)||(b.asleep&&!fb)){
          if(d>SEG*1.05||d<SEG*.9){if(a.asleep&&!fa){wake(a);wa=1;}if(b.asleep&&!fb){wake(b);wb=1;}}
        }
        const diff=(d-SEG)/d,ws=wa+wb;
        if(!ws)continue;
        a.x+=dx*diff*wa/ws;a.y+=dy*diff*wa/ws;a.h+=dh*diff*wa/ws;
        b.x-=dx*diff*wb/ws;b.y-=dy*diff*wb/ws;b.h-=dh*diff*wb/ws;
      }
      for(let i=0;i<N;i++){const p=P[i];if(!p.asleep&&!isFixed(i))collide(p);}
    }
    for(let i=0;i<N;i++){                            // friction: something lying on the floor or a table stays put unless it is really pulled
      const p=P[i];
      const endFree=(i===0&&ends[0].mode==='free')||(i===N-1&&ends[1].mode==='free');
      if(p.asleep||isFixed(i)||(!p.rest&&!endFree))continue;
      const lim=endFree?STICK_END:STICK;   // an end that was put down stays where it is
      if(Math.hypot(p.x-p.x0,p.y-p.y0)<lim){p.x=p.x0;p.y=p.y0;p.px=p.x;p.py=p.y;}
    }
    return{speed:awake?speed/awake:0,awake};
  }
  function settle(){for(const p of P){p.px=p.x;p.py=p.y;p.ph=p.h;}settled=true;}

  // ---------- picture of the hose ----------
  const IMG=new Image();IMG.src='assets/calibration_props/crevo/crevo.webp';
  IMG.onload=()=>{if(cx){refreshScr();frameDraw(performance.now());}};
  const BODY={x:200,w:850,y:24,h:108},FIT_F={x:0,w:172},FIT_M={x:1078,w:164},IMG_H=153;
  const SC=TH/BODY.h,ST=4;
  function dense(){                                 // the smooth curve through the chain as points 4 px apart
    const pt=i=>scr[i];
    const raw=[{x:scr[0].x,y:scr[0].y,sx:scr[0].sx,sy:scr[0].sy,m:scr[0].m}];
    let prev={x:scr[0].x,y:scr[0].y,sx:scr[0].sx,sy:scr[0].sy};
    for(let i=1;i<N;i++){
      const a=pt(i-1),b=pt(i);
      const m={x:(a.x+b.x)/2,y:(a.y+b.y)/2,sx:(a.sx+b.sx)/2,sy:(a.sy+b.sy)/2};
      for(let k=1;k<=4;k++){
        const t=k/4,u=1-t;
        raw.push({x:u*u*prev.x+2*u*t*a.x+t*t*m.x,y:u*u*prev.y+2*u*t*a.y+t*t*m.y,
          sx:u*u*prev.sx+2*u*t*a.sx+t*t*m.sx,sy:u*u*prev.sy+2*u*t*a.sy+t*t*m.sy,m:t<.5?a.m:b.m});
      }
      prev=m;
    }
    const last=scr[N-1];
    raw.push({x:last.x,y:last.y,sx:last.sx,sy:last.sy,m:last.m});
    const out=[raw[0]];out[0].s=0;
    let carry=0,len=0;
    for(let i=1;i<raw.length;i++){
      let ax=raw[i-1].x,ay=raw[i-1].y,asx=raw[i-1].sx,asy=raw[i-1].sy;const b=raw[i];
      let d=Math.hypot(b.x-ax,b.y-ay);
      while(carry+d>=ST&&d>0){
        const t=(ST-carry)/d;
        ax+=(b.x-ax)*t;ay+=(b.y-ay)*t;asx+=(b.sx-asx)*t;asy+=(b.sy-asy)*t;
        d=Math.hypot(b.x-ax,b.y-ay);len+=ST;
        out.push({x:ax,y:ay,sx:asx,sy:asy,m:b.m,s:len});carry=0;
      }
      carry+=d;
    }
    for(let i=0;i<out.length;i++){
      const a=out[Math.max(0,i-1)],b=out[Math.min(out.length-1,i+1)];
      out[i].a=Math.atan2(b.y-a.y,b.x-a.x);
    }
    return out;
  }
  // draw `fn(from,to)` for each stretch of samples that is hidden by the same things; hidden parts are cut out
  function runs(S,fn){
    let a=0;
    while(a<S.length){
      let b=a;while(b+1<S.length&&S[b+1].m===S[a].m)b++;
      const m=S[a].m;
      cx.save();
      if(m){
        for(const name of Object.keys(MASK)){
          if(!(m&MASK[name]))continue;
          const poly=SILH[name];if(!poly)continue;
          cx.beginPath();cx.rect(0,0,SW,SH);cx.moveTo(poly[0][0],poly[0][1]);for(let i=1;i<poly.length;i++)cx.lineTo(poly[i][0],poly[i][1]);cx.closePath();
          cx.clip('evenodd');
        }
      }
      fn(Math.max(0,a-1),b);                         // one sample more so the pieces join
      cx.restore();
      a=b+1;
    }
  }
  function poly(S,a,b,sh){
    cx.beginPath();
    cx.moveTo(sh?S[a].sx:S[a].x,sh?S[a].sy:S[a].y);
    for(let i=a+1;i<=b;i++)cx.lineTo(sh?S[i].sx:S[i].x,sh?S[i].sy:S[i].y);
  }
  function drawBodyRun(S,a,b){
    if(!IMG.complete||!IMG.naturalWidth){poly(S,a,b);cx.strokeStyle='#3f9650';cx.lineWidth=TH;cx.lineCap='round';cx.stroke();return;}
    const sw=ST/SC+.9,wrap=BODY.w-sw;
    for(let i=a;i<=b;i++){
      const q=S[i],c=Math.cos(q.a),sn=Math.sin(q.a),flip=c<0;
      const sx=BODY.x+((q.s/SC)%wrap),k=flip?-1:1;   // strips that run leftwards are turned round to keep the light from above
      cx.setTransform(RES*c*k,RES*sn*k,-RES*sn*k,RES*c*k,RES*q.x,RES*q.y);
      if(flip)cx.drawImage(IMG,sx,BODY.y,sw,BODY.h,-ST-.4,-TH/2,ST+.9,TH);
      else cx.drawImage(IMG,sx,BODY.y,sw,BODY.h,-.4,-TH/2,ST+.9,TH);
    }
    cx.setTransform(RES,0,0,RES,0,0);
  }
  function endDir(e){
    const a=scr[idxOf(e)],b=scr[e===0?3:N-4];
    return Math.atan2(a.y-b.y,a.x-b.x);              // pointing out of the hose
  }
  function tipOf(e){                                 // where the water comes out
    const p=scr[idxOf(e)],a=endDir(e),L=(e===0?FIT_F.w:FIT_M.w)*SC;
    return{x:p.x+Math.cos(a)*L*.65,y:p.y+Math.sin(a)*L*.65};
  }
  function drawFitting(e){
    if(!IMG.complete||!IMG.naturalWidth)return;
    const p=scr[idxOf(e)],a=endDir(e),c=Math.cos(a),sn=Math.sin(a),flip=c<0;
    const src=e===0?FIT_F:FIT_M,L=src.w*SC,H=IMG_H*SC;
    cx.save();
    const m=p.m;
    if(m)for(const name of Object.keys(MASK)){
      if(!(m&MASK[name])||!SILH[name])continue;
      const pl=SILH[name];
      cx.beginPath();cx.rect(0,0,SW,SH);cx.moveTo(pl[0][0],pl[0][1]);for(let i=1;i<pl.length;i++)cx.lineTo(pl[i][0],pl[i][1]);cx.closePath();cx.clip('evenodd');
    }
    cx.setTransform(RES*c,RES*sn,-RES*sn,RES*c,RES*p.x,RES*p.y);
    cx.translate(L*.65,0);
    if(flip)cx.scale(1,-1);
    if(e===0){cx.scale(-1,1);cx.drawImage(IMG,src.x,0,src.w,IMG_H,0,-H/2,L,H);}
    else{cx.translate(-L,0);cx.drawImage(IMG,src.x,0,src.w,IMG_H,0,-H/2,L,H);}
    cx.restore();
    cx.setTransform(RES,0,0,RES,0,0);
  }
  function frameDraw(now,fresh){
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
      const near=Math.hypot(mouse.x-TAP_SCREEN.x,mouse.y-TAP_SCREEN.y)<TAP_FIT&&!ends.some(m=>m.mode==='tap');
      if(near){cx.save();cx.strokeStyle='rgba(255,255,255,.9)';cx.lineWidth=2.5;cx.setLineDash([5,4]);cx.beginPath();cx.arc(TAP_SCREEN.x,TAP_SCREEN.y,16,0,Math.PI*2);cx.stroke();cx.restore();}
    }
    if(!fresh)refreshScr();
    const S=dense();
    // shadows lie on the thing under the hose, then the picture of the hose, then the water inside, then the couplings
    runs(S,(a,b)=>{cx.lineCap='round';cx.lineJoin='round';
      poly(S,a,b,true);cx.strokeStyle='rgba(0,0,0,.13)';cx.lineWidth=TH+6;cx.stroke();
      poly(S,a,b,true);cx.strokeStyle='rgba(0,0,0,.20)';cx.lineWidth=TH+1;cx.stroke();});
    runs(S,drawBodyRun.bind(null,S));
    const tapEnd=ends[0].mode==='tap'?0:ends[1].mode==='tap'?1:-1;
    if(tapEnd>=0&&flow>0){
      const total=S[S.length-1].s,reach=flow*total;
      const off=tapEnd===0?-now/35:now/35;
      runs(S,(a,b)=>{
        let i0=a,i1=b;
        if(tapEnd===0){while(i1>i0&&S[i1].s>reach)i1--;}else{while(i0<i1&&S[i0].s<total-reach)i0++;}
        if(i1<=i0)return;
        cx.lineCap='round';cx.lineJoin='round';
        cx.setLineDash([9,11]);cx.lineDashOffset=off;poly(S,i0,i1,false);cx.strokeStyle='rgba(150,222,255,.5)';cx.lineWidth=5.2;cx.stroke();
        cx.setLineDash([5,15]);cx.lineDashOffset=off*1.3;poly(S,i0,i1,false);cx.strokeStyle='rgba(240,252,255,.5)';cx.lineWidth=1.8;cx.stroke();
        cx.setLineDash([]);
      });
    }
    drawFitting(0);drawFitting(1);
    // the stream
    const out=freeEnd();
    if(out>=0&&flow>=.995){
      const land=landing(out);
      if(!land.inside){
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
  function landing(e){                              // where the water from end e goes: the barrel, or the thing under it
    const p=P[idxOf(e)],s=scr[idxOf(e)];
    const o=window.CooksterKaca&&CooksterKaca.openingAt(s.x,s.y);
    if(o&&!o.closed){
      if(o.inside)return{y:s.y,barrel:o,inside:true};                    // the end is down in the barrel
      if(s.y<=o.y&&o.y-s.y<=POUR_H)return{y:o.y,barrel:o};               // close above the opening: pours in
    }
    return{y:p.y-supportBelow(p.x,p.y,p.h),barrel:null,x:s.x};          // otherwise it falls to the table, stove or floor under it
  }
  // the front of the barrel is drawn over the hose while an end is inside the barrel
  let maskEl=null,maskImg=null;
  function updateMask(){
    let o=null;
    for(let e=0;e<2&&!o;e++){
      const s=scr[idxOf(e)];
      const q=window.CooksterKaca&&CooksterKaca.openingAt(s.x,s.y);
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
          calm=r.speed<.12?calm+STEP:0;
          if(calm>.5||settleT>5){settle();calm=0;settleT=0;}
        }else{settleT=0;calm=0;}
      }
    }
    // water: ramps up while the tap is open and one end is on it
    const on=!!(typeof faucetOn!=='undefined'&&faucetOn)&&ends.some(m=>m.mode==='tap');
    const prev=flow;
    flow=on?Math.min(1,flow+dt/.9):Math.max(0,flow-dt/.25);
    scene.classList.toggle('hose-on',ends.some(m=>m.mode==='tap'));
    refreshScr();
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
        // pours on whatever is under it (once the end is put down): a puddle grows under the stream
        const x=scr[idxOf(out)].x,y=land.y;
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
    frameDraw(t,true);updateMask();
    if(active)requestAnimationFrame(loop);else{running=false;}
  }
  function kick(){if(!running){running=true;lastT=performance.now();requestAnimationFrame(loop);}}

  // ---------- pointer handling ----------
  function inScene(e){return !!(e.target&&e.target.closest&&e.target.closest('#scene'));}
  function setHand(e){
    const s=sceneOf(e.clientX,e.clientY);
    mouse.x=Math.max(8,Math.min(SW-8,s.x));mouse.y=Math.max(8,Math.min(SH-8,s.y));
    const g=handFrom(mouse.x,mouse.y);
    // while the other end is on the tap the hose can only reach so far
    if(ends.some(m=>m.mode==='tap')){
      const dx=g.x-TAP3.x,dy=g.y-TAP3.y,dh=g.h-TAP3.h,d=Math.sqrt(dx*dx+dy*dy+dh*dh),lim=LEN*.985;
      if(d>lim){const k=lim/d;g.x=TAP3.x+dx*k;g.y=TAP3.y+dy*k;g.h=Math.max(0,TAP3.h+dh*k);}
    }
    hand.x=g.x;hand.y=g.y;hand.h=g.h;
  }
  function release(){
    if(!held)return;
    const e=held.end,p=P[idxOf(e)];
    const tapFree=!ends.some(m=>m.mode==='tap');
    if(tapFree&&Math.hypot(mouse.x-TAP_SCREEN.x,mouse.y-TAP_SCREEN.y)<TAP_FIT){
      ends[e]={mode:'tap'};p.x=p.px=TAP3.x;p.y=p.py=TAP3.y;p.h=p.ph=TAP3.h;
      if(!(typeof faucetOn!=='undefined'&&faucetOn)){
        try{showToast('Crevo je na slavini. Klikni na slavinu da pustiš vodu.');}catch(_){}
      }
    }else{
      ends[e]={mode:'free'};                         // let go: it falls by its own weight
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
    refreshScr();frameDraw(0);
  }
  window.CooksterHose={
    debug(){refreshScr();return{ends:JSON.parse(JSON.stringify(ends)),flow,held:!!held,settled,
      P:P.map((p,i)=>[Math.round(p.x),Math.round(p.y),Math.round(p.h),p.asleep?1:0,Math.round(scr[i].x),Math.round(scr[i].y),scr[i].m]),
      puddles:puddles.length,running,solids:SOLIDS.map(o=>o.name),legs:LEGS.length,floor:!!FLOOR};},
    grab(end,sx,sy){settled=false;ends[end]={mode:'held'};held={end,sx:0,sy:0,t0:0,carry:true,dragged:true};mouse.x=sx;mouse.y=sy;const g=handFrom(sx,sy);hand.x=g.x;hand.y=g.y;hand.h=g.h;kick();},
    move(sx,sy){mouse.x=sx;mouse.y=sy;const g=handFrom(sx,sy);hand.x=g.x;hand.y=g.y;hand.h=g.h;kick();},
    drop(){release();},
    TAP_SCREEN,COIL
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
