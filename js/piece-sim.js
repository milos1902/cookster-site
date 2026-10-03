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
  const TINT=[null,null,null,null,null,null,'rgba(14,8,4,.78)'];   // only burnt gets a dark tint, the other stages use the real cooked art

  const atlasCache=new Map();
  const sims=new WeakMap();
  const live=new Set();
  let running=false;

  // Real "fried" / "well done" art of each vegetable (piles of cubes) used as the texture of the pieces.
  const imgCache=new Map();
  function loadImg(src,cb){
    let e=imgCache.get(src);
    if(!e){e={img:new Image(),ready:false,subs:[]};e.img.onload=()=>{e.ready=true;e.subs.splice(0).forEach(f=>f());};e.img.src=src;imgCache.set(src,e);}
    if(e.ready)cb(e.img);else e.subs.push(()=>cb(e.img));
  }
  // atlas copy where every piece takes its colours from the cooked art (pieces keep their own shape)
  function cookedAtlas(entry,cookedImg){
    const src=entry.img,m=entry.meta;
    const c=document.createElement('canvas');c.width=src.width;c.height=src.height;
    const g=c.getContext('2d');
    g.drawImage(src,0,0);
    g.globalCompositeOperation='source-atop';
    const cw=cookedImg.width,ch=cookedImg.height,k=.5*cw/Math.max(20,m.W||100);
    for(const q of m.p){
      const [sx,sy,sw,sh,ax,ay,x,y]=q;
      const cx=cw/2+x*k*1.0,cy=ch/2+y*k*1.0,w=sw*k,h=sh*k;
      g.save();g.beginPath();g.rect(sx,sy,sw,sh);g.clip();
      g.drawImage(cookedImg,cx-w/2,cy-h/2,w,h,sx,sy,sw,sh);
      g.restore();
    }
    return c;
  }
  function ensureCooked(entry,part){
    if(entry.cooked||!entry.ready)return;
    entry.cooked={fried:null,well:null};
    const d=part.def||{};
    if(d.friedDicedSrc)loadImg(d.friedDicedSrc,im=>{entry.cooked.fried=cookedAtlas(entry,im);for(const s of live)s.dirty=true;kick();});
    if(d.wellDoneDicedSrc)loadImg(d.wellDoneDicedSrc,im=>{entry.cooked.well=cookedAtlas(entry,im);for(const s of live)s.dirty=true;kick();});
  }
  // how much of each look is shown at a visual stage (1 raw .. 7 burnt)
  const BLEND=[[0,0],[.12,0],[.45,0],[.8,0],[1,0],[1,.85],[1,1]];

  function loadAtlas(str){
    let e=atlasCache.get(str);
    if(e)return e;
    const hash=str.indexOf('#');
    let meta=null;
    try{meta=JSON.parse(str.slice(hash+1));}catch(_){}
    const img=new Image();
    e={img,meta,ready:false};
    img.onload=()=>{e.ready=true;for(const s of live)s.dirty=true;kick();};
    e.parts=[];
    img.src=str.slice(0,hash);
    atlasCache.set(str,e);
    return e;
  }

  class Sim{
    constructor(vessel){
      this.vessel=vessel;this.pieces=new Map();this.canvases=new Set();
      this.H=SIM_W*.8;this.dirty=true;this.activeUntil=0;this.layers=1;this.room=3000;
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
    // The area where food may be: the calibrated "food visible" polygon of this vessel (floor up to the rim),
    // in simulation units. Vessels without a profile get an ellipse.
    region(){
      this.measure();
      const cal=window.CooksterVesselFoodCalibration;
      const prof=cal?.get?.(this.vessel),frame=cal?.frame?.(this.vessel);
      let poly=null;
      if(prof?.foodVisible?.length>=3&&frame?.width&&frame?.height){
        poly=prof.foodVisible.map(([x,y])=>({
          x:((x-frame.left)/frame.width)*SIM_W,
          y:((y-frame.top)/frame.height)*this.H}));
      }
      if(!poly){poly=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2;poly.push({x:50+Math.cos(a)*46,y:this.H/2+Math.sin(a)*this.H*.44});}}
      let ar=0,cx=0,cy=0;
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],cr=a.x*b.y-b.x*a.y;
        ar+=cr;cx+=(a.x+b.x)*cr;cy+=(a.y+b.y)*cr;
      }
      ar/=2;this.cx=cx/(6*ar||1);this.cy=cy/(6*ar||1);this.area=Math.abs(ar);this.poly=poly;
    }
    inside(x,y){
      const poly=this.poly;let c=false;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++){
        const a=poly[i],b=poly[j];
        if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;
      }
      return c;
    }
    sync(parts){
      this.parts=parts;
      this.region();
      const want=new Set(),created=[];
      for(const part of parts){
        const units=Math.min(MAX_UNITS,Math.max(1,Math.round(part.count||1)));
        for(let u=0;u<units;u++){
          const entry=loadAtlas(part.atlas[u%part.atlas.length]);
          entry.part=part;
          const m=entry.meta;if(!m||!Array.isArray(m.p))continue;
          const k=HEAP_W/Math.max(20,m.W||100);
          const off=UNIT_OFFSETS[u%UNIT_OFFSETS.length];
          m.p.forEach((q,i)=>{
            const id=`${part.storageKey}|${u}|${i}`;
            want.add(id);
            if(this.pieces.has(id))return;
            const [sx,sy,sw,sh,ax,ay,x,y,rot]=q;
            const piece={id,entry,k,sx,sy,sw,sh,ax,ay,rot:rot||0,vx:0,vy:0,mass:.8+Math.random()*.9,
              x:0,y:0,
              k0:k,r:Math.max(4,(Math.max(sw,sh)-PAD*2)/2*k)};
            piece.r0=piece.r;
            this.scatter(piece);
            this.pieces.set(id,piece);created.push(piece);
          });
        }
      }
      for(const id of [...this.pieces.keys()])if(!want.has(id))this.pieces.delete(id);
      this.fit();
      if(created.length)this.relax(60);
      this.dirty=true;
    }
    // Depth: pieces keep their real size. When there are more than fit on the floor of the vessel they are
    // spread over up to 5 layers (a heap): each layer is drawn a little higher, with a soft shadow, and stirring
    // swaps pieces between layers so the ingredients really mix.
    fit(){
      let area=0;const ps=[...this.pieces.values()];
      for(const p of ps)area+=Math.PI*p.r0*p.r0;
      this.room=this.area*.62;
      const need=Math.max(1,Math.ceil(area/this.room));
      this.layers=Math.min(5,need);
      // beyond 5 layers (very many pieces) shrink them a little
      const s=need>5?Math.sqrt(5*this.room/area):1;
      ps.forEach((p,i)=>{p.k=p.k0*s;p.r=p.r0*s;if(p.layer===undefined||p.layer>=this.layers)p.layer=i%this.layers;});
    }
    // new pieces land at a random spot of the whole food area, so the heap fills it from the start
    scatter(p){
      const xs=this.poly.map(q=>q.x),ys=this.poly.map(q=>q.y);
      const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
      for(let i=0;i<40;i++){
        const x=x0+Math.random()*(x1-x0),y=y0+Math.random()*(y1-y0);
        if(this.inside(x,y)){p.x=x;p.y=y;return;}
      }
      p.x=this.cx;p.y=this.cy;
    }
    relax(iters){
      const ps=[...this.pieces.values()];
      for(let it=0;it<iters;it++){
        this.collide(ps,.34,.66);
        for(const p of ps)this.wall(p);
      }
    }
    wall(p){
      if(this.inside(p.x,p.y)){
        // keep clear of the edge by about the piece's own radius
        return;
      }
      // outside: move to the nearest point on the outline, then a little way back in
      const poly=this.poly;let bx=p.x,by=p.y,bd=1e9;
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],ex=b.x-a.x,ey=b.y-a.y,l2=ex*ex+ey*ey||1;
        const tt=Math.max(0,Math.min(1,((p.x-a.x)*ex+(p.y-a.y)*ey)/l2)),qx=a.x+ex*tt,qy=a.y+ey*tt,d=(p.x-qx)**2+(p.y-qy)**2;
        if(d<bd){bd=d;bx=qx;by=qy;}
      }
      const dx=this.cx-bx,dy=this.cy-by,dl=Math.hypot(dx,dy)||1,inset=Math.min(p.r*.35,3);
      p.x=bx+dx/dl*inset;p.y=by+dy/dl*inset;p.vx*=.5;p.vy*=.5;
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
            if(b.id<=a.id||b.layer!==a.layer)continue;
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
      const cx=this.cx,cy=this.cy;
      // which way round is the spoon going? sign of the cross product of (spoon - centre) and its movement
      const dir=((lx-cx)*vy-(ly-cy)*vx)>=0?1:-1;
      const R=26;
      const crowd=this.crowd();
      for(const p of this.pieces.values()){
        const dx=p.x-lx,dy=p.y-ly,d=Math.hypot(dx,dy);
        if(d>=R)continue;
        const w=(1-d/R)*(1-d/R*.3)/(p.mass*crowd);   // heavy pieces answer more slowly, and the more food there is the heavier it all feels
        const ox=p.x-cx,oy=p.y-cy,ol=Math.hypot(ox,oy)||1;
        const swirl=Math.min(.45,speed*.07);
        p.vx+=vx*.07*w+(-oy/ol)*dir*swirl*w*.5+(Math.random()-.5)*.05*w;
        p.vy+=vy*.07*w+(ox/ol)*dir*swirl*w*.5+(Math.random()-.5)*.05*w;
        p.rot+=(Math.random()-.5)*.05*w;
      }
      if(this.layers>1){
        // pieces dive under / come up through their neighbours: swap layers of nearby pieces
        const near=[...this.pieces.values()].filter(q=>Math.hypot(q.x-lx,q.y-ly)<R);
        const swaps=Math.min(6,Math.ceil(speed*.5));
        for(let i=0;i<swaps&&near.length>1;i++){
          const a=near[Math.floor(Math.random()*near.length)],b=near[Math.floor(Math.random()*near.length)];
          if(a!==b&&a.layer!==b.layer&&Math.hypot(a.x-b.x,a.y-b.y)<9){const l=a.layer;a.layer=b.layer;b.layer=l;}
        }
      }
      this.activeUntil=performance.now()+500;
      this.dirty=true;kick();
    }
    // many pieces (several ingredients) must not move faster than a few: scale the weight with how crowded the vessel is
    crowd(){return 1+Math.max(0,this.pieces.size-20)/45;}
    step(now){
      const ps=[...this.pieces.values()];
      const crowd=this.crowd();
      const settling=now<this.activeUntil+1400;   // the pull towards the middle only acts shortly after stirring
      let energy=0;
      for(const p of ps){
        // food settles back towards the middle of the vessel, so stirring never leaves it piled against one wall
        if(settling){p.vx+=(this.cx-p.x)*.0009;p.vy+=(this.cy-p.y)*.0009;}
        p.x+=p.vx;p.y+=p.vy;
        energy=Math.max(energy,Math.abs(p.vx)+Math.abs(p.vy));
        p.rot+=p.vx*.01;
        // cap the speed and add drag: a thick, heavy mixture, never a quick stream
        const sp=Math.hypot(p.vx,p.vy),cap=.27/(p.mass*Math.sqrt(crowd));
        if(sp>cap){p.vx*=cap/sp;p.vy*=cap/sp;}
        p.vx*=.83;p.vy*=.83;
        if(Math.abs(p.vx)<.001)p.vx=0;
        if(Math.abs(p.vy)<.001)p.vy=0;
      }
      if(energy>0){this.collide(ps,.24,.8);this.collide(ps,.14,.8);for(const p of ps)this.wall(p);}
      return energy;
    }
    // Static "bed": the stock art of the cooked vegetable covers the bottom of the vessel, so stirring never uncovers it.
    // It follows the same stages as the loose pieces (raw -> fried -> well done -> burnt).
    drawBed(g,w,h,sc,stage){
      const parts=this.parts||[];
      if(!parts.length)return;
      const bl=BLEND[Math.max(1,Math.min(7,stage))-1];
      g.save();
      // the bed fills the same calibrated area as the pieces, so nothing of the floor shows
      const f=Math.sqrt(this.area/5000);
      g.beginPath();this.poly.forEach((q,i)=>i?g.lineTo(q.x*sc,q.y*sc):g.moveTo(q.x*sc,q.y*sc));g.closePath();g.clip();
      // copies of the stock art tile the whole calibrated area (jittered grid), so no floor shows anywhere
      if(!this.bedSpots){
        const xs=this.poly.map(q=>q.x),ys=this.poly.map(q=>q.y);
        const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),st=11;
        this.bedSpots=[];let n=0;
        for(let y=y0-st/2;y<=y1+st;y+=st)for(let x=x0-st/2;x<=x1+st;x+=st){
          n++;const j=(n*37%11)/11-.5,j2=(n*53%13)/13-.5;
          this.bedSpots.push([x+j*st*.8,y+j2*st*.8,(n*29%17)/17*6.28]);
        }
      }
      parts.forEach((part,i)=>{
        const d=part.def||{};
        const draw=(src,alpha)=>{
          if(!src||alpha<=0)return;
          let e=imgCache.get(src);
          if(!e){loadImg(src,()=>{this.dirty=true;kick();});return;}
          if(!e.ready)return;
          g.globalAlpha=alpha;
          // each ingredient takes a share of the tiles, so a mix of vegetables looks mixed
          this.bedSpots.forEach(([sx,sy,rot],k)=>{
            if(k%parts.length!==i)return;
            const bw=30*sc,bh=bw*.76;
            g.save();g.translate(sx*sc,sy*sc);g.rotate(rot);
            g.drawImage(e.img,-bw/2,-bh/2,bw,bh);g.restore();
          });
        };
        draw(d.dicedSrc||d.slicedSrc,1);
        draw(d.friedDicedSrc,bl[0]);
        draw(d.wellDoneDicedSrc,bl[1]);
      });
      g.globalAlpha=1;g.restore();
    }
    draw(){
      const ps=[...this.pieces.values()].sort((a,b)=>a.layer-b.layer||a.y-b.y);
      for(const c of this.liveCanvases()){
        const el=c.el,w=el.clientWidth,h=el.clientHeight;
        if(!w||!h)continue;
        const dpr=Math.min(2,window.devicePixelRatio||1);
        if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}
        const g=el.getContext('2d'),sc=w/SIM_W;
        g.setTransform(dpr,0,0,dpr,0,0);
        g.clearRect(0,0,w,h);
        this.drawBed(g,w,h,sc,c.stage);
        for(const p of ps){
          const e=p.entry;if(!e.ready)continue;
          g.save();
          // each layer sits higher; the heap is a little domed in the middle
          const rho=Math.min(1,Math.hypot((p.x-this.cx)/46,(p.y-this.cy)/(this.H*.44)));
          const lift=p.layer*1.7+(1-rho*rho)*1.6*(this.layers-1)/4;
          if(p.layer>0){g.shadowColor='rgba(20,8,0,.45)';g.shadowBlur=3*sc/1.2;g.shadowOffsetY=1.2*sc/1.2;}
          g.translate(p.x*sc,(p.y-lift)*sc);g.rotate(p.rot);
          const dx=-p.ax*p.k*sc,dy=-p.ay*p.k*sc,dw=p.sw*p.k*sc,dh=p.sh*p.k*sc;
          const bl=BLEND[Math.max(1,Math.min(7,c.stage))-1];
          if(e.part)ensureCooked(e,e.part);
          g.drawImage(e.img,p.sx,p.sy,p.sw,p.sh,dx,dy,dw,dh);
          if(bl[0]>0&&e.cooked?.fried){g.globalAlpha=bl[0];g.drawImage(e.cooked.fried,p.sx,p.sy,p.sw,p.sh,dx,dy,dw,dh);}
          if(bl[1]>0&&e.cooked?.well){g.globalAlpha=bl[1];g.drawImage(e.cooked.well,p.sx,p.sy,p.sw,p.sh,dx,dy,dw,dh);}
          g.globalAlpha=1;
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
    debugClear:v=>{const s=sims.get(v);if(s){s.pieces.clear();s.dirty=true;kick();}},
    debugBed:v=>{const s=sims.get(v);return s?{parts:(s.parts||[]).map(p=>({k:p.storageKey,c:p.count,d:p.def&&p.def.dicedSrc,f:p.def&&p.def.friedDicedSrc})),img:[...imgCache.entries()].map(([k,e])=>[k.slice(-30),e.ready])}:null;},
    debugSim:v=>{const s=sims.get(v);return s?{H:s.H,cx:s.cx,cy:s.cy,area:s.area,layers:s.layers,ymin:Math.min(...s.poly.map(q=>q.y)),ymax:Math.max(...s.poly.map(q=>q.y)),xmin:Math.min(...s.poly.map(q=>q.x)),xmax:Math.max(...s.poly.map(q=>q.x))}:null;},
    debugPieces(vessel){return [...(sims.get(vessel)?.pieces.values()||[])].map(p=>({id:p.id,x:p.x,y:p.y}));}
  };
})();
