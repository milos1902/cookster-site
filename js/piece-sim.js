/* Cookster - per-piece food simulation for cut ingredients.
   An ingredient cut with the knife is stored as an "atlas": one image with every piece cut out, plus where each
   piece sat in the heap. A vessel draws those pieces on a canvas and moves each one on its own when stirred
   (pieces push each other, swirl with the spoon and stay inside the vessel).
   Atlas string format: "<image data URL>#{W,H,p:[[sx,sy,sw,sh,ax,ay,x,y,rot],...]}" (see tomato-cut.js). */
(function(){
  const SIM_W=100;                       // simulation units across the food area
  const PAD=10;                          // padding baked around each piece
  const HEAP_W=62;                       // one ingredient unit's heap is this wide (units)
  const PIECE_SCALE=1.6;                 // pieces are drawn a little larger, so a few additions are enough to fill a vessel
  const LEVEL_FULL=4;                    // the food reaches the top line after about 3 additions (fill measured in floor areas)
  // how much of the floor of a vessel ONE unit of a vegetable covers: big vegetables (a head of cabbage, a zucchini, an eggplant) cover (almost) the whole floor,
  // small ones (radish, garlic) only a little. The number of pieces of a unit is multiplied by this factor (the pieces keep their own size).
  const FOOT={kupus:1.7,tikvice:1.5,patlidzan:1.55,zelena_salata:1.35,paprika:1.35,paradajz:1.05,krastavac:1.4,luk:.9,paprika_zelena:.9,sargarepa:.7,persun:.55,beli_luk:.32,rotkvice:.34};
  const hashFrac=(a,b,c)=>{let h=(a*73856093)^(b*19349663)^(c*83492791);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
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

  // The picture of the quick cut (key E) is a ready heap of cubes. In a vessel it becomes single pieces like the hand cut (key C): the picture is cut into a grid of small
  // rounded squares (one per cube), laid out exactly as in the heap, so that every piece moves on its own and takes its colours from the cooked art at the same place.
  const SNAP_W=300;                         // the size of the baked heap of the hand cut: 300 atlas pixels = the width of the diced picture on the board
  function stockAtlas(str){
    const src=str.slice(6);
    const e={img:null,meta:null,ready:false,parts:[]};
    loadImg(src,im0=>{
      let im=im0;
      const q=SNAP_W/im.width,PAD=10;
      const cv0=document.createElement('canvas');cv0.width=im.width;cv0.height=im.height;const g0=cv0.getContext('2d');g0.drawImage(im,0,0);
      let d;try{d=g0.getImageData(0,0,im.width,im.height).data;}catch(_){return;}
      // the soft grey shadow that the picture of the heap throws on the board is not food: it would become dark squares in the vessel
      for(let i=0;i<d.length;i+=4){
        const a=d[i+3];if(a>=240||!a)continue;
        const r=d[i],g=d[i+1],b=d[i+2],mxc=Math.max(r,g,b),mnc=Math.min(r,g,b);
        if(mxc<150&&mxc-mnc<60)d[i+3]=0;
      }
      g0.putImageData(new ImageData(d,im.width,im.height),0,0);
      im=cv0;
      let x0=im.width,y0=im.height,x1=-1,y1=-1;
      for(let y=0;y<im.height;y+=2)for(let x=0;x<im.width;x+=2)if(d[(y*im.width+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
      if(x1<0)return;
      const cell=Math.round(32/q),cells=[];            // a piece is about as big as a piece of the hand cut (about 32 atlas pixels)
      for(let cy=y0;cy<y1;cy+=cell)for(let cx=x0;cx<x1;cx+=cell){
        let a=0,n=0;for(let y=cy;y<Math.min(y1,cy+cell);y+=3)for(let x=cx;x<Math.min(x1,cx+cell);x+=3){n++;if(d[(y*im.width+x)*4+3]>120)a++;}
        if(n&&a/n>.55)cells.push({cx,cy,w:Math.min(cell,x1-cx),h:Math.min(cell,y1-cy)});
      }
      if(!cells.length)return;
      const mx=(x0+x1)/2,my=(y0+y1)/2;
      const cw=Math.ceil(cell*q+PAD*2),chh=Math.ceil(cell*q+PAD*2),perRow=Math.max(1,Math.floor(480/cw));
      const rows=Math.ceil(cells.length/perRow);
      const cv=document.createElement('canvas');cv.width=perRow*cw;cv.height=rows*chh;const g=cv.getContext('2d');
      const meta={W:Math.round((x1-x0)*q*10)/10,H:Math.round((y1-y0)*q*10)/10,p:[]};
      cells.forEach((c,i)=>{
        const sx=(i%perRow)*cw,sy=Math.floor(i/perRow)*chh,w=c.w*q,h=c.h*q,ox=sx+PAD+(cell*q-w)/2,oy=sy+PAD+(cell*q-h)/2;
        g.save();g.beginPath();
        const r=Math.min(w,h)*.22;if(g.roundRect)g.roundRect(ox,oy,w,h,r);else g.rect(ox,oy,w,h);
        g.clip();g.drawImage(im,c.cx,c.cy,c.w,c.h,ox,oy,w,h);g.restore();
        meta.p.push([sx,sy,cw,chh,Math.round(cw/2*10)/10,Math.round(chh/2*10)/10,Math.round(((c.cx+c.w/2)-mx)*q*10)/10,Math.round(((c.cy+c.h/2)-my)*q*10)/10,Math.round((Math.random()-.5)*600)/1000]);
      });
      e.img=cv;e.meta=meta;e.ready=true;
      for(const sm of live){if(sm.parts)sm.sync(sm.parts);sm.dirty=true;}kick();
    });
    return e;
  }
  function loadAtlas(str){
    let e=atlasCache.get(str);
    if(e)return e;
    if(str.startsWith('stock:')){e=stockAtlas(str);atlasCache.set(str,e);return e;}
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
      // the food may cover 10% more of the vessel than the drawn area (the area grows by the square root of that in every direction)
      {const k=Math.sqrt(1.1);for(const q of poly){q.x=this.cx+(q.x-this.cx)*k;q.y=this.cy+(q.y-this.cy)*k;}this.area*=1.1;}
      this.fullPoly=poly;this.fullArea=this.area;this.fullCx=this.cx;this.fullCy=this.cy;
      this.homeX=this.homeY=null;
      const hb=prof?.depth?.bottom;
      if(hb&&frame?.width&&frame?.height){const hx=((hb[0]-frame.left)/frame.width)*SIM_W,hy=((hb[1]-frame.top)/frame.height)*this.H;if(Sim.pointIn(poly,hx,hy)){this.homeX=hx;this.homeY=hy;}}
    }
    static clip(poly,yL){
      const out=[];
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],ia=a.y>=yL,ib=b.y>=yL;
        if(ia)out.push(a);
        if(ia!==ib){const t=(yL-a.y)/(b.y-a.y);out.push({x:a.x+(b.x-a.x)*t,y:yL});}
      }
      return out;
    }
    static pointIn(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;}
    static measure(poly){
      let ar=0,cx=0,cy=0;
      for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],cr=a.x*b.y-b.x*a.y;ar+=cr;cx+=(a.x+b.x)*cr;cy+=(a.y+b.y)*cr;}
      ar/=2;return {area:Math.abs(ar),cx:cx/(6*ar||1),cy:cy/(6*ar||1)};
    }
    // The food lies on the floor of the vessel and rises with every addition: the area it may occupy is the part of the
    // calibrated "food visible" area below a level line, which climbs from the bottom up to the top (the calibrated food top).
    applyLevel(){
      // The food starts as a small heap around the "bottom point" the player marked in the tool (the yellow point; the middle of the area if there is none)
      // and grows from there (the same shape, larger) up to the whole calibrated area when the vessel is full.
      const full=this.fullPoly;
      const lvl=Math.min(1,this.fill||1);   // 1 = the floor is covered (then the food only gets higher): one small heap at the start, the whole area when the floor is covered
      const hx=this.homeX!=null?this.homeX:this.fullCx,hy=this.homeY!=null?this.homeY:this.fullCy;
      const sc=lvl>=1?1:Math.sqrt(Math.max(.16,lvl));
      const poly=sc>=1?full:full.map(q=>({x:hx+(q.x-hx)*sc,y:hy+(q.y-hy)*sc}));
      if(poly.length<3)return;
      const m=Sim.measure(poly);
      this.poly=poly;this.cx=m.cx;this.cy=m.cy;this.area=m.area;this.bedSpots=null;
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
          const m=entry.meta;if(!m||!Array.isArray(m.p))continue;      // (a picture that is still loading has no pieces yet: they appear when it is ready)
          // the pieces keep the size they had on the board: one cut vegetable is a heap as wide as the diced picture is on the board (def.dicedW at the scale of the vessel)
          const wr=this.wrapOf(),wrapW=wr&&wr.clientWidth>4?wr.clientWidth:0,pw=((part.def&&(part.def.dicedW||part.def.w))||96)*(+this.vessel.dataset.vis||1);
          const heapUnits=wrapW?Math.max(10,Math.min(120,pw*SIM_W/wrapW)):PIECE_SCALE*HEAP_W;
          const k=heapUnits/SNAP_W;           // 300 atlas pixels = the width of the diced picture on the board
          const off=UNIT_OFFSETS[u%UNIT_OFFSETS.length];
          const mult=FOOT[part.kind]||1,copies=Math.ceil(mult);
          for(let cp=0;cp<copies;cp++)m.p.forEach((q,i)=>{
            const wgt=Math.min(1,mult-cp);
            if(wgt<1&&hashFrac(i+1,u+1,cp+1)>=wgt)return;   // a unit of a small vegetable keeps only part of its pieces
            const id=`${part.storageKey}|${u}|${i}${cp?'|'+cp:''}`;
            want.add(id);
            if(this.pieces.has(id))return;
            const [sx,sy,sw,sh,ax,ay,x,y,rot0]=q;const rot=(rot0||0)+cp*1.7;
            const piece={id,entry,k,sx,sy,sw,sh,ax,ay,rot:rot||0,vx:0,vy:0,mass:.8+Math.random()*.9,
              x:0,y:0,
              k0:k,r:Math.max(4,(Math.max(sw,sh)-PAD*2)/2*k)};
            piece.r0=piece.r;
            piece.n=this.counter=(this.counter||0)+1;
            this.pieces.set(id,piece);created.push(piece);this.list=null;
          });
        }
      }
      for(const id of [...this.pieces.keys()])if(!want.has(id)){this.pieces.delete(id);this.list=null;}
      this.fit();
      this.applyLevel();
      const sig=this.poly.map(q=>q.x.toFixed(1)+','+q.y.toFixed(1)).join(';');          // the area of the food has changed (the vessel was calibrated again): the pieces that lie outside are pulled in
      const moved=this._sig!==undefined&&this._sig!==sig;this._sig=sig;
      for(const p of created)this.scatter(p);
      if(created.length&&this.pieces.size>created.length){this.activeUntil=performance.now()+900;kick();}   // earlier pieces spread out gently over the larger area
      if(created.length)this.relax(60);else if(moved){for(const p of this.pieces.values())if(!this.inside(p.x,p.y))this.scatter(p);this.relax(40);}
      this.dirty=true;
    }
    // Depth: pieces keep their real size. When there are more than fit on the floor of the vessel they are
    // spread over up to 5 layers (a heap): each layer is drawn a little higher, with a soft shadow, and stirring
    // swaps pieces between layers so the ingredients really mix.
    fit(){
      let area=0;const ps=[...this.pieces.values()];
      for(const p of ps)area+=Math.PI*p.r0*p.r0;
      this.room=(this.fullArea||this.area)*.62;
      this.fill=area/this.room;   // 1 = the floor of the vessel is covered
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
      // a small amount of food lies as a heap in the middle, more and more food spreads towards the walls
      const f=1;
      for(let i=0;i<40;i++){
        const x=this.cx+(x0+Math.random()*(x1-x0)-this.cx)*f,y=this.cy+(y0+Math.random()*(y1-y0)-this.cy)*f;
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
    // the nearest point of the outline of the food area
    nearEdge(x,y){
      const poly=this.poly;let bx=x,by=y,bd=1e9;
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],ex=b.x-a.x,ey=b.y-a.y,l2=ex*ex+ey*ey||1;
        const tt=Math.max(0,Math.min(1,((x-a.x)*ex+(y-a.y)*ey)/l2)),qx=a.x+ex*tt,qy=a.y+ey*tt,d=(x-qx)**2+(y-qy)**2;
        if(d<bd){bd=d;bx=qx;by=qy;}
      }
      return {x:bx,y:by,d:Math.sqrt(bd)};
    }
    // a soft edge: a moving piece that comes near the outline is turned along it and pushed gently back, like a spring, instead of hitting a wall
    softEdge(p){
      const sp=Math.abs(p.vx)+Math.abs(p.vy);if(sp<.004)return;
      const e=this.nearEdge(p.x,p.y),m=Math.max(6,p.r*1.3);
      if(e.d>=m||!this.inside(p.x,p.y))return;
      // the true inward normal of the edge at this place (from the nearest point of the outline to the piece)
      let nx=p.x-e.x,ny=p.y-e.y;const nl=Math.hypot(nx,ny);
      if(nl<1e-4){nx=this.cx-e.x;ny=this.cy-e.y;}
      const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;
      const vn=p.vx*nx+p.vy*ny;
      // only the part of the speed that goes into the edge is taken away (more and more the closer it is), nothing pushes it back: the piece slides along the edge, it never bounces
      if(vn<0){const k=Math.min(1,1.2*(1-e.d/m)+.15);p.vx-=nx*vn*k;p.vy-=ny*vn*k;}
    }
    wall(p){
      if(this.inside(p.x,p.y))return;
      // outside: put it on the outline (a little inside) and take away only the speed that goes out; the speed along the edge stays (it slides, no bounce, no damping)
      const poly=this.poly;let bx=p.x,by=p.y,bd=1e9;
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length],ex=b.x-a.x,ey=b.y-a.y,l2=ex*ex+ey*ey||1;
        const tt=Math.max(0,Math.min(1,((p.x-a.x)*ex+(p.y-a.y)*ey)/l2)),qx=a.x+ex*tt,qy=a.y+ey*tt,d=(p.x-qx)**2+(p.y-qy)**2;
        if(d<bd){bd=d;bx=qx;by=qy;}
      }
      let nx=bx-p.x,ny=by-p.y;const dl0=Math.hypot(nx,ny);      // inwards: from the piece to the nearest point of the outline
      if(dl0<1e-4){nx=this.cx-bx;ny=this.cy-by;}
      const dl=Math.hypot(nx,ny)||1;nx/=dl;ny/=dl;
      const inset=Math.min(p.r*.35,3);
      p.x=bx+nx*inset;p.y=by+ny*inset;
      const vn=p.vx*nx+p.vy*ny;if(vn<0){p.vx-=nx*vn;p.vy-=ny*vn;}
    }
    collide(ps,push,range){
      // spatial hash (numeric keys, buckets reused between calls) so ~150 pieces stay cheap and nothing is allocated per frame
      const cell=12,grid=this._grid||(this._grid=new Map());
      for(const bk of grid.values())bk.length=0;
      for(const p of ps){
        const key=(Math.floor(p.x/cell)+64)*512+Math.floor(p.y/cell)+64;
        let bk=grid.get(key);if(!bk){bk=[];grid.set(key,bk);}bk.push(p);
      }
      for(const a of ps){
        const gx=Math.floor(a.x/cell)+64,gy=Math.floor(a.y/cell)+64;
        for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){
          const bucket=grid.get(ix*512+iy);if(!bucket||!bucket.length)continue;
          for(let j=0;j<bucket.length;j++){
            const b=bucket[j];
            if(b.n<=a.n||b.layer!==a.layer)continue;
            const dx=b.x-a.x,dy=b.y-a.y,m=(a.r+b.r)*range;
            if(dx>m||dx<-m||dy>m||dy<-m)continue;
            const d2=dx*dx+dy*dy;
            if(d2<m*m){const d=Math.sqrt(d2)||.01,f=(m-d)/d*push;a.x-=dx*f;a.y-=dy*f;b.x+=dx*f;b.y+=dy*f;}
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
      {const target=dir*Math.min(.03,speed*.004);this.swirlW=Math.max(-.03,Math.min(.03,(this.swirlW||0)*.8+target*.6));}
      this.activeUntil=performance.now()+500;
      this.dirty=true;kick();
    }
    // many pieces (several ingredients) must not move faster than a few: scale the weight with how crowded the vessel is
    crowd(){return 1+Math.max(0,this.pieces.size-20)/45;}
    step(now){
      const ps=this.list||(this.list=[...this.pieces.values()]);
      const crowd=this.crowd();
      const settling=now<this.activeUntil+1400;   // the evening-out only acts while and shortly after stirring
      let energy=0;
      // the circling of the spoon is remembered: after letting go the whole mixture keeps turning the same way and slowly stops
      const sw=this.swirlW||0;
      if(Math.abs(sw)>.003){
        const cx0=this.cx,cy0=this.cy;
        for(const p of ps){
          const ox=p.x-cx0,oy=p.y-cy0,ol=Math.hypot(ox,oy)||1,k=sw/(p.mass*Math.sqrt(crowd))*Math.min(1,ol/20);
          p.vx+=-oy/ol*k;p.vy+=ox/ol*k;
        }
        this.swirlW=sw*.965;
        energy=Math.max(energy,Math.abs(sw)*2);
      }else this.swirlW=0;
      for(const p of ps){
        // food settles back towards the middle of the vessel, so stirring never leaves it piled against one wall
        p.x+=p.vx;p.y+=p.vy;
        energy=Math.max(energy,Math.abs(p.vx)+Math.abs(p.vy));
        p.rot+=p.vx*.01;
        // cap the speed and add drag: a thick, heavy mixture, never a quick stream
        const sp=Math.hypot(p.vx,p.vy),cap=.27/(p.mass*Math.sqrt(crowd));
        if(sp>cap){p.vx*=cap/sp;p.vy*=cap/sp;}
        this.softEdge(p);
        p.vx*=.945;p.vy*=.945;   // a thick mixture keeps gliding for a moment after the spoon is let go
        if(Math.abs(p.vx)<.001)p.vx=0;
        if(Math.abs(p.vy)<.001)p.vy=0;
      }
      if(energy>0){this.collide(ps,.3,.8);for(const p of ps)this.wall(p);}
      // while and just after stirring the food evens itself out over the whole area (soft pressure between neighbours),
      // so it never ends up bunched in the middle with the floor showing at the sides
      if(settling&&(energy>0||(this.tickN=(this.tickN||0)+1)%2===0)){this.collide(ps,.045,1.9);for(const p of ps)this.wall(p);if(energy>0)this.dirty=true;}
      return energy;
    }
    // Static "bed": the stock art of the cooked vegetable covers the bottom of the vessel, so stirring never uncovers it.
    // It follows the same stages as the loose pieces (raw -> fried -> well done -> burnt).
    drawBed(g,w,h,sc,stage){
      const ps=(this.list||(this.list=[...this.pieces.values()])).filter(p=>p.entry.ready);
      if(!ps.length)return;
      // the bed never moves, so it is drawn once into its own canvas and only copied afterwards
      let cooked=0;for(const p of ps){if(p.entry.cooked?.fried)cooked|=1;if(p.entry.cooked?.well)cooked|=2;}
      const key=w+'x'+h+'|'+stage+'|'+ps.length+'|'+cooked+'|'+this.area.toFixed(1);
      const bc=this._bedCache||(this._bedCache=document.createElement('canvas'));
      if(this._bedKey!==key){
        this._bedKey=key;
        bc.width=g.canvas.width;bc.height=g.canvas.height;
        const bg=bc.getContext('2d');bg.setTransform(g.getTransform());bg.clearRect(0,0,w,h);
        this.drawBedNow(bg,w,h,sc,stage,ps);
      }
      g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(bc,0,0);g.restore();
    }
    drawBedNow(g,w,h,sc,stage,ps){
      const bl=BLEND[Math.max(1,Math.min(7,stage))-1];
      // under the loose pieces lies a settled layer made of the same cut pieces (they do not move), so stirring never
      // uncovers the floor: it covers exactly the area the food has risen to
      if(!this.bedSpots){
        const xs=this.poly.map(q=>q.x),ys=this.poly.map(q=>q.y);
        const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),st=8;
        this.bedSpots=[];let n=0;
        for(let y=y0;y<=y1+st/2;y+=st)for(let x=x0;x<=x1+st/2;x+=st){
          n++;const jx=x+((n*37%11)/11-.5)*st*.8,jy=y+((n*53%13)/13-.5)*st*.8;
          if(this.inside(jx,jy))this.bedSpots.push([jx,jy,(n*29%17)/17*6.28,n]);
        }
      }
      g.save();
      g.beginPath();this.poly.forEach((q,i)=>i?g.lineTo(q.x*sc,q.y*sc):g.moveTo(q.x*sc,q.y*sc));g.closePath();g.clip();
      for(const [x,y,rot,n] of this.bedSpots){
        const p=ps[n%ps.length],e=p.entry;
        g.save();g.translate(x*sc,y*sc);g.rotate(rot);
        const dx=-p.ax*p.k*sc,dy=-p.ay*p.k*sc,dw=p.sw*p.k*sc,dh=p.sh*p.k*sc;
        if(e.part)ensureCooked(e,e.part);
        g.drawImage(e.img,p.sx,p.sy,p.sw,p.sh,dx,dy,dw,dh);
        if(bl[0]>0&&e.cooked?.fried){g.globalAlpha=bl[0];g.drawImage(e.cooked.fried,p.sx,p.sy,p.sw,p.sh,dx,dy,dw,dh);}
        if(bl[1]>0&&e.cooked?.well){g.globalAlpha=bl[1];g.drawImage(e.cooked.well,p.sx,p.sy,p.sw,p.sh,dx,dy,dw,dh);}
        g.globalAlpha=1;g.restore();
      }
      // the settled layer lies deeper: a little darker than the loose pieces on top
      g.fillStyle='rgba(30,10,0,.32)';g.fill();
      g.restore();
    }
    draw(){
      const ps=(this.list||(this.list=[...this.pieces.values()])).slice().sort((a,b)=>a.layer-b.layer||a.y-b.y);
      for(const c of this.liveCanvases()){
        const el=c.el,w=el.clientWidth,h=el.clientHeight;
        if(!w||!h)continue;
        const dpr=Math.min(1.5,window.devicePixelRatio||1);
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
          g.translate(p.x*sc,(p.y-lift)*sc);g.rotate(p.rot);
          // a cheap soft shadow under pieces lying on others (a blurred shadow per piece is far too slow)
          // (no shadow under the pieces: with many pieces the little shadows added up to a dark see-through patch under the whole heap)
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

  let frame=0;
  function tick(){
    let busy=false;
    const now=performance.now();
    frame++;
    const sims=[...live];
    // several vessels being stirred at once: each one is redrawn every other frame, so the game keeps its frame rate
    const crowded=sims.filter(s=>s.dirty||now<s.activeUntil+1400).length>=3;
    sims.forEach((sim,i)=>{
      if(!sim.liveCanvases().size){live.delete(sim);return;}
      const energy=sim.step(now);
      if(energy>.012||now<sim.activeUntil+1500)busy=true;
      if((energy>0||sim.dirty)&&(!crowded||(frame+i)%2===0))sim.draw();
      else if(energy>0||sim.dirty)busy=true;
    });
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
    debugSim:v=>{const s=sims.get(v);return s?{fill:s.fill,H:s.H,cx:s.cx,cy:s.cy,area:s.area,layers:s.layers,ymin:Math.min(...s.poly.map(q=>q.y)),ymax:Math.max(...s.poly.map(q=>q.y)),xmin:Math.min(...s.poly.map(q=>q.x)),xmax:Math.max(...s.poly.map(q=>q.x))}:null;},
    debugBench(vessel,n){const s=sims.get(vessel);if(!s)return null;const now=performance.now();s.activeUntil=now+1e6;let t0=performance.now();for(let i=0;i<n;i++)s.step(now+i*16);const st=(performance.now()-t0)/n;t0=performance.now();for(let i=0;i<n;i++){s.dirty=true;s.draw();}return {step:st,draw:(performance.now()-t0)/n};},
    debugPieces(vessel){return [...(sims.get(vessel)?.pieces.values()||[])].map(p=>({id:p.id,x:p.x,y:p.y}));}
  };
})();
