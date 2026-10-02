/* Cookster - per-piece food simulation for cut ingredients.
   An ingredient cut with the knife is stored as an "atlas": one image with every piece cut out, plus where each
   piece sat in the heap. A vessel draws those pieces on a canvas and moves each one on its own when stirred
   (pieces push each other, swirl with the spoon and stay inside the vessel).
   Atlas string format: "<image data URL>#{W,H,p:[[sx,sy,sw,sh,ax,ay,x,y,rot],...]}" (see tomato-cut.js). */
(function(){
  const SIM_W=100;                       // simulation units across the food area
  const PAD=10;                          // padding baked around each piece
  const HEAP_W=62;                       // one ingredient unit's heap is this wide (units)
  const MAX_UNITS=6;                     // units of one ingredient drawn as pieces
  const UNIT_OFFSETS=[[0,0],[-16,5],[16,-5],[-6,-14],[8,13],[-21,-8],[21,10]];
  // cooking tint per visual stage (1 raw .. 7 burnt), painted over the pieces only
  const TINT=[null,null,'rgba(150,60,20,.07)','rgba(125,45,14,.16)','rgba(100,34,10,.27)','rgba(70,24,8,.40)','rgba(14,8,4,.78)'];

  const atlasCache=new Map();
  const sims=new WeakMap();
  const live=new Set();
  let running=false;

  function loadAtlas(str){
    let e=atlasCache.get(str);
    if(e)return e;
    const hash=str.indexOf('#');
    let meta=null;
    try{meta=JSON.parse(str.slice(hash+1));}catch(_){}
    const img=new Image();
    e={img,meta,ready:false};
    img.onload=()=>{e.ready=true;for(const s of live)s.dirty=true;kick();};
    img.src=str.slice(0,hash);
    atlasCache.set(str,e);
    return e;
  }

  class Sim{
    constructor(vessel){
      this.vessel=vessel;this.pieces=new Map();this.canvases=new Set();
      this.H=SIM_W*.8;this.dirty=true;this.activeUntil=0;
    }
    wrapOf(){return this.vessel._panContent||this.vessel._vesselContent||null;}
    measure(){
      const w=this.wrapOf();
      if(w&&w.clientWidth>4&&w.clientHeight>4)this.H=SIM_W*w.clientHeight/w.clientWidth;
    }
    liveCanvases(){
      for(const c of [...this.canvases])if(!c.el.isConnected)this.canvases.delete(c);
      return this.canvases;
    }
    sync(parts){
      this.measure();
      const want=new Set(),created=[];
      for(const part of parts){
        const units=Math.min(MAX_UNITS,Math.max(1,Math.round(part.count||1)));
        for(let u=0;u<units;u++){
          const entry=loadAtlas(part.atlas[u%part.atlas.length]);
          const m=entry.meta;if(!m||!Array.isArray(m.p))continue;
          const k=HEAP_W/Math.max(20,m.W||100);
          const off=UNIT_OFFSETS[u%UNIT_OFFSETS.length];
          m.p.forEach((q,i)=>{
            const id=`${part.storageKey}|${u}|${i}`;
            want.add(id);
            if(this.pieces.has(id))return;
            const [sx,sy,sw,sh,ax,ay,x,y,rot]=q;
            const piece={id,entry,k,sx,sy,sw,sh,ax,ay,rot:rot||0,vx:0,vy:0,
              x:50+off[0]+x*k,y:this.H/2+off[1]*this.H/100+y*k,
              r:Math.max(4,(Math.max(sw,sh)-PAD*2)/2*k)};
            this.pieces.set(id,piece);created.push(piece);
          });
        }
      }
      for(const id of [...this.pieces.keys()])if(!want.has(id))this.pieces.delete(id);
      if(created.length)this.relax(26);
      this.dirty=true;
    }
    relax(iters){
      const ps=[...this.pieces.values()];
      for(let it=0;it<iters;it++){
        this.collide(ps,.34,.66);
        for(const p of ps)this.wall(p);
      }
    }
    wall(p){
      const rx=46-p.r*.5,ry=this.H*.44-p.r*.5;
      const dx=p.x-50,dy=p.y-this.H/2,q=(dx/rx)**2+(dy/ry)**2;
      if(q>1){const k=1/Math.sqrt(q);p.x=50+dx*k;p.y=this.H/2+dy*k;p.vx*=.5;p.vy*=.5;}
    }
    collide(ps,push,range){
      // spatial hash so ~150 pieces stay cheap
      const cell=12,grid=new Map();
      for(const p of ps){
        const key=Math.floor(p.x/cell)+','+Math.floor(p.y/cell);
        (grid.get(key)||grid.set(key,[]).get(key)).push(p);
      }
      for(const a of ps){
        const gx=Math.floor(a.x/cell),gy=Math.floor(a.y/cell);
        for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){
          const bucket=grid.get(ix+','+iy);if(!bucket)continue;
          for(const b of bucket){
            if(b.id<=a.id)continue;
            const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,m=(a.r+b.r)*range;
            if(d<m){const f=(m-d)/d*push;a.x-=dx*f;a.y-=dy*f;b.x+=dx*f;b.y+=dy*f;}
          }
        }
      }
    }
    stir(clientX,clientY,mx,my){
      let rect=null;
      for(const c of this.liveCanvases()){const r=c.el.getBoundingClientRect();if(r.width>4){rect=r;break;}}
      if(!rect||!this.pieces.size)return;
      const lx=(clientX-rect.left)/rect.width*SIM_W,ly=(clientY-rect.top)/rect.height*this.H;
      const vx=mx/rect.width*SIM_W,vy=my/rect.height*this.H;
      const speed=Math.hypot(vx,vy);
      const cx=50,cy=this.H/2;
      // which way round is the spoon going? sign of the cross product of (spoon - centre) and its movement
      const dir=((lx-cx)*vy-(ly-cy)*vx)>=0?1:-1;
      const R=36;
      for(const p of this.pieces.values()){
        const dx=p.x-lx,dy=p.y-ly,d=Math.hypot(dx,dy);
        if(d>=R)continue;
        const w=(1-d/R)*(1-d/R*.3);
        const ox=p.x-cx,oy=p.y-cy,ol=Math.hypot(ox,oy)||1;
        const swirl=Math.min(1.4,speed*.25);
        p.vx+=vx*.55*w+(-oy/ol)*dir*swirl*w+(Math.random()-.5)*.25*w;
        p.vy+=vy*.55*w+(ox/ol)*dir*swirl*w+(Math.random()-.5)*.25*w;
        p.rot+=(Math.random()-.5)*.12*w;
      }
      this.activeUntil=performance.now()+500;
      this.dirty=true;kick();
    }
    step(now){
      const ps=[...this.pieces.values()];
      const settling=now<this.activeUntil+1400;   // the pull towards the middle only acts shortly after stirring
      let energy=0;
      for(const p of ps){
        // food settles back towards the middle of the vessel, so stirring never leaves it piled against one wall
        if(settling){p.vx+=(50-p.x)*.0025;p.vy+=(this.H/2-p.y)*.0025;}
        p.x+=p.vx;p.y+=p.vy;
        energy=Math.max(energy,Math.abs(p.vx)+Math.abs(p.vy));
        p.rot+=p.vx*.012;
        p.vx*=.9;p.vy*=.9;
        if(Math.abs(p.vx)<.001)p.vx=0;
        if(Math.abs(p.vy)<.001)p.vy=0;
      }
      if(energy>0){this.collide(ps,.32,.8);this.collide(ps,.2,.8);for(const p of ps)this.wall(p);}
      return energy;
    }
    draw(){
      const ps=[...this.pieces.values()].sort((a,b)=>a.y-b.y);
      for(const c of this.liveCanvases()){
        const el=c.el,w=el.clientWidth,h=el.clientHeight;
        if(!w||!h)continue;
        const dpr=Math.min(2,window.devicePixelRatio||1);
        if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}
        const g=el.getContext('2d'),sc=w/SIM_W;
        g.setTransform(dpr,0,0,dpr,0,0);
        g.clearRect(0,0,w,h);
        for(const p of ps){
          const e=p.entry;if(!e.ready)continue;
          g.save();
          g.translate(p.x*sc,p.y*sc);g.rotate(p.rot);
          g.drawImage(e.img,p.sx,p.sy,p.sw,p.sh,-p.ax*p.k*sc,-p.ay*p.k*sc,p.sw*p.k*sc,p.sh*p.k*sc);
          g.restore();
        }
        const tint=TINT[Math.max(1,Math.min(7,c.stage))-1];
        if(tint){g.globalCompositeOperation='source-atop';g.fillStyle=tint;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';}
      }
      this.dirty=false;
    }
  }

  function tick(){
    let busy=false;
    const now=performance.now();
    for(const sim of [...live]){
      if(!sim.liveCanvases().size){live.delete(sim);continue;}
      const energy=sim.step(now);
      if(energy>.012||now<sim.activeUntil+1500)busy=true;
      if(energy>0||sim.dirty)sim.draw();
    }
    if(busy&&live.size)requestAnimationFrame(tick);else running=false;
  }
  function kick(){if(!running){running=true;requestAnimationFrame(tick);}}

  window.CooksterPieceSim={
    // called while a food layer is built: parts = cut ingredients that carry atlases
    append(layer,parts,stage,vessel){
      if(!layer||!vessel||!parts?.length)return;
      let sim=sims.get(vessel);
      if(!sim){sim=new Sim(vessel);sims.set(vessel,sim);}
      // vessel was emptied in between: start from a fresh arrangement
      if(!sim.liveCanvases().size)sim.pieces.clear();
      sim.sync(parts);
      const el=document.createElement('canvas');
      el.className='piece-sim-canvas';
      el.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:35';
      layer.appendChild(el);
      sim.canvases.add({el,stage:+stage||1});
      live.add(sim);sim.dirty=true;
      requestAnimationFrame(()=>{sim.dirty=true;kick();});
    },
    stir(vessel,x,y,mx,my){sims.get(vessel)?.stir(x,y,mx,my);},
    running:()=>running,
    debugPieces(vessel){return [...(sims.get(vessel)?.pieces.values()||[])].map(p=>({id:p.id,x:p.x,y:p.y}));}
  };
})();
