/* Cookster - the egg in a pan (or any vessel).
   An egg that is put into the dish is mixed into everything. It is drawn as a pale, translucent white-cream film made of many small soft patches
   (cut out of assets/eggs/smesa_1..4.webp, about 20-30 % visible all together). Every patch is a loose particle that the spoon pushes around in the same way
   as it pushes the cut pieces of the vegetables (js/piece-sim.js), so the egg and the vegetables are stirred together.
   The state of the egg is `curd` (0..1) of its batch in the cooking model (js/core/pan.js): it rises while the dish is stirred in a hot pan.
   At the start the patches lie together where the egg fell and are faint; as `curd` rises they spread over the whole food area and become more visible. */
(function(){
  'use strict';
  const SIM_W=100;
  const FILM=[1,2,3,4].map(i=>'assets/eggs/smesa_'+i+'.webp?v=1');
  const PATCHES_PER_EGG=18;
const CURDS_PER_EGG=9;           // the pieces of fried egg (assets/eggs/skuvano_1..12.webp), they lie under the film
const CURD_W=15;                 // width of a piece of fried egg (simulation units) for a 150 px picture
const CURD=[...Array(12)].map((_,i)=>'assets/eggs/skuvano_'+(i+1)+'.webp?v=1');
const RAW=[1,2,3].map(i=>'assets/eggs/sirovo_'+i+'.webp?v=2');   // the raw egg (white + yolk) that lies in the dish right after it is put in
const RAW_W=44;
const rawImgs={};
function loadRaw(i){let e=rawImgs[i];if(e)return e;e=rawImgs[i]={img:new Image(),ready:false};e.img.onload=()=>{e.ready=true;for(const s of live)s.dirty=true;kick();};e.img.src=RAW[i];return e;}
const curdImgs={};
function loadCurd(i){let e=curdImgs[i];if(e)return e;e=curdImgs[i]={img:new Image(),ready:false};e.img.onload=()=>{e.ready=true;for(const s of live)s.dirty=true;kick();};e.img.src=CURD[i];return e;}
  const MAX_EGGS=8;
  const BASE_ALPHA=.30;           // visibility of one patch at full curd; many overlapping patches together give the 20-30 % of the whole film
  const sims=new WeakMap(),live=new Set();
  let running=false;
  const imgs={},patchSets={};
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  function load(i){
    let e=imgs[i];if(e)return e;
    e=imgs[i]={img:new Image(),ready:false};
    e.img.onload=()=>{e.ready=true;buildPatches(i);for(const s of live)s.dirty=true;kick();};
    e.img.src=FILM[i];return e;
  }
  // soft round patches cut out of the film picture where it is not empty
  function buildPatches(i){
    const im=imgs[i].img,S=96,cut=document.createElement('canvas');
    const tw=Math.min(160,im.width),th=Math.round(tw*im.height/im.width);
    cut.width=tw;cut.height=th;const cg=cut.getContext('2d');cg.drawImage(im,0,0,tw,th);
    let data=null;try{data=cg.getImageData(0,0,tw,th).data;}catch(_){}
    const out=[];
    for(let k=0;k<7;k++){
      let cx=tw/2,cy=th/2;
      for(let t=0;t<60&&data;t++){const x=Math.floor(Math.random()*tw),y=Math.floor(Math.random()*th);if(data[(y*tw+x)*4+3]>110){cx=x;cy=y;break;}}
      const size=(.26+Math.random()*.16)*Math.max(tw,th);
      const c=document.createElement('canvas');c.width=S;c.height=S;const g=c.getContext('2d');
      g.drawImage(im,(cx-size/2)/tw*im.width,(cy-size/2)/th*im.height,size/tw*im.width,size/th*im.height,0,0,S,S);
      g.globalCompositeOperation='destination-in';
      const rg=g.createRadialGradient(S/2,S/2,S*.12,S/2,S/2,S/2);
      rg.addColorStop(0,'rgba(0,0,0,1)');rg.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=rg;g.fillRect(0,0,S,S);
      out.push(c);
    }
    patchSets[i]=out;
  }
  function batchesOf(vessel){
    try{
      if(typeof isHeatableCookwareItem==='function'&&isHeatableCookwareItem(vessel))return window.CooksterPan.read(vessel).batches||[];
      return (window.CooksterContainer.read(vessel).transfer||{}).batches||[];
    }catch(_){return [];}
  }

  class Sim{
    constructor(vessel){this.vessel=vessel;this.canvases=new Set();this.eggs=new Map();this.H=SIM_W*.8;this.dirty=true;this.activeUntil=0;this.lastCurd=-1;}
    liveCanvases(){for(const c of [...this.canvases])if(!c.el.isConnected)this.canvases.delete(c);return this.canvases;}
    region(){
      const w=this.vessel._panContent||this.vessel._vesselContent||null;
      if(w&&w.clientWidth>4&&w.clientHeight>4)this.H=SIM_W*w.clientHeight/w.clientWidth;
      const cal=window.CooksterVesselFoodCalibration;
      const prof=cal?.get?.(this.vessel),frame=cal?.frame?.(this.vessel);
      let poly=null;
      if(prof?.foodVisible?.length>=3&&frame?.width&&frame?.height){
        poly=prof.foodVisible.map(([x,y])=>({x:((x-frame.left)/frame.width)*SIM_W,y:((y-frame.top)/frame.height)*this.H}));
      }
      if(!poly){poly=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2;poly.push({x:50+Math.cos(a)*46,y:this.H/2+Math.sin(a)*this.H*.44});}}
      let ar=0,cx=0,cy=0;
      for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],cr=a.x*b.y-b.x*a.y;ar+=cr;cx+=(a.x+b.x)*cr;cy+=(a.y+b.y)*cr;}
      ar/=2;this.cx=cx/(6*ar||1);this.cy=cy/(6*ar||1);this.poly=poly;
      const xs=poly.map(q=>q.x),ys=poly.map(q=>q.y);this.x0=Math.min(...xs);this.x1=Math.max(...xs);this.y0=Math.min(...ys);this.y1=Math.max(...ys);
    }
    inside(x,y){
      const poly=this.poly;let c=false;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++){
        const a=poly[i],b=poly[j];
        if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;
      }
      return c;
    }
    spot(f=1){      // a random place inside the food area (f: how much of its width/height)
      for(let i=0;i<50;i++){
        const x=this.cx+(this.x0+Math.random()*(this.x1-this.x0)-this.cx)*f,y=this.cy+(this.y0+Math.random()*(this.y1-this.y0)-this.cy)*f;
        if(this.inside(x,y))return{x,y};
      }
      return{x:this.cx,y:this.cy};
    }
    pull(p){      // outside the food area: onto the outline (a little inside) and only the speed that goes out is taken away, so it slides along the edge (no bounce)
      const poly=this.poly;let bx=p.x,by=p.y,bd=1e9;
      for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ex=b.x-a.x,ey=b.y-a.y,l2=ex*ex+ey*ey||1,
        tt=Math.max(0,Math.min(1,((p.x-a.x)*ex+(p.y-a.y)*ey)/l2)),qx=a.x+ex*tt,qy=a.y+ey*tt,d=(p.x-qx)**2+(p.y-qy)**2;if(d<bd){bd=d;bx=qx;by=qy;}}
      let nx=bx-p.x,ny=by-p.y;if(Math.hypot(nx,ny)<1e-4){nx=this.cx-bx;ny=this.cy-by;}
      const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;p.x=bx+nx*1.5;p.y=by+ny*1.5;
      const vn=p.vx*nx+p.vy*ny;if(vn<0){p.vx-=nx*vn;p.vy-=ny*vn;}
      if(!this.inside(p.x,p.y)){p.x+=(this.cx-p.x)*.2;p.y+=(this.cy-p.y)*.2;}
    }
    // one group of patches per egg of the model; all eggs of a batch share the `curd` of the batch
    sync(){
      this.region();
      const want=new Set();this.byBatch={};let n=0;
      for(const b of batchesOf(this.vessel)){
        if(b.key!=='jaje'||!(b.count>0))continue;
        this.byBatch[b.id]=+b.curd||0;
        const cnt=Math.min(MAX_EGGS-n,Math.round(b.count));
        for(let i=0;i<cnt;i++){
          const id=b.id+'#'+i;want.add(id);n++;
          if(!this.eggs.has(id)){
            const pic=Math.floor(Math.random()*4),drop=this.spot(.5),parts=[];
            for(let k=0;k<PATCHES_PER_EGG;k++){
              const a=Math.random()*6.283,r=Math.sqrt(Math.random())*9,tgt=this.spot(1);
              parts.push({x:drop.x+Math.cos(a)*r,y:drop.y+Math.sin(a)*r*.7,vx:0,vy:0,rot:Math.random()*6.283,
                pic,patch:Math.floor(Math.random()*7),size:22+Math.random()*16,mass:.8+Math.random()*.9,tx:tgt.x,ty:tgt.y});
            }
            const curds=[];
            for(let k=0;k<CURDS_PER_EGG;k++){
              const a=Math.random()*6.283,r=Math.sqrt(Math.random())*8,tgt=this.spot(1);
              curds.push({x:drop.x+Math.cos(a)*r,y:drop.y+Math.sin(a)*r*.7,vx:0,vy:0,rot:Math.random()*6.283,
                img:Math.floor(Math.random()*12),sc:.8+Math.random()*.45,mass:.9+Math.random()*.9,tx:tgt.x,ty:tgt.y});
            }
            const raw={x:drop.x,y:drop.y,vx:0,vy:0,rot:(Math.random()-.5)*.9,img:Math.floor(Math.random()*3),mass:1.6,born:performance.now()};
            this.eggs.set(id,{id,batch:b.id,parts,curds,raw,prog:0});
          }
        }
      }
      for(const id of [...this.eggs.keys()])if(!want.has(id))this.eggs.delete(id);
    }
    curdOf(e){return Math.max(0,Math.min(1,+this.byBatch?.[e.batch]||0));}
    // the same pushing of the spoon as in js/piece-sim.js
    stir(clientX,clientY,mx,my){
      let rect=null;
      for(const c of this.liveCanvases()){const r=c.el.getBoundingClientRect();if(r.width>4){rect=r;break;}}
      if(!rect||!this.eggs.size||!this.poly)return;
      const lx=(clientX-rect.left)/rect.width*SIM_W,ly=(clientY-rect.top)/rect.height*this.H;
      const vx=mx/rect.width*SIM_W,vy=my/rect.height*this.H,speed=Math.hypot(vx,vy),cx=this.cx,cy=this.cy;
      const dir=((lx-cx)*vy-(ly-cy)*vx)>=0?1:-1,R=26;
      for(const e of this.eggs.values())for(const p of e.parts.concat(e.curds,[e.raw])){
        const dx=p.x-lx,dy=p.y-ly,d=Math.hypot(dx,dy);
        if(d>=R)continue;
        const w=(1-d/R)*(1-d/R*.3)/p.mass;
        const ox=p.x-cx,oy=p.y-cy,ol=Math.hypot(ox,oy)||1,swirl=Math.min(.45,speed*.07);
        p.vx+=vx*.07*w+(-oy/ol)*dir*swirl*w*.5+(Math.random()-.5)*.05*w;
        p.vy+=vy*.07*w+(ox/ol)*dir*swirl*w*.5+(Math.random()-.5)*.05*w;
        p.rot+=(Math.random()-.5)*.05*w;
      }
      this.activeUntil=performance.now()+600;this.dirty=true;kick();
    }
    step(){
      let energy=0;
      for(const e of this.eggs.values()){
        // the patches spread over the food area while the egg sets; what the spoon has moved stays moved
        if(performance.now()-e.raw.born<300){this.dirty=true;energy=Math.max(energy,.001);}   // the egg drops in: keep drawing until it has landed
        const s=smooth(0,.8,this.curdOf(e)),ds=s-e.prog;
        if(ds>1e-5){const f=Math.min(1,ds/Math.max(.02,1-e.prog));for(const p of e.parts.concat(e.curds,[e.raw])){p.x+=(p.tx-p.x)*f;p.y+=(p.ty-p.y)*f;}e.prog=s;energy=Math.max(energy,.001);this.dirty=true;}
        for(const p of e.parts.concat(e.curds,[e.raw])){
          p.x+=p.vx;p.y+=p.vy;p.rot+=p.vx*.01;
          const sp=Math.hypot(p.vx,p.vy),cap=.27/p.mass;
          if(sp>cap){p.vx*=cap/sp;p.vy*=cap/sp;}
          p.vx*=.83;p.vy*=.83;
          if(Math.abs(p.vx)<.001)p.vx=0;if(Math.abs(p.vy)<.001)p.vy=0;
          energy=Math.max(energy,Math.abs(p.vx)+Math.abs(p.vy));
          if(energy>0&&!this.inside(p.x,p.y))this.pull(p);
        }
      }
      return energy;
    }
    draw(){
      this.sync();
      const eggs=[...this.eggs.values()];
      for(const c of this.liveCanvases()){
        const el=c.el,w=el.clientWidth,h=el.clientHeight;
        if(!w||!h)continue;
        const dpr=Math.min(1.5,window.devicePixelRatio||1);
        if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}
        const g=el.getContext('2d'),sc=w/SIM_W;
        g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
        g.save();g.beginPath();this.poly.forEach((q,i)=>i?g.lineTo(q.x*sc,q.y*sc):g.moveTo(q.x*sc,q.y*sc));g.closePath();g.clip();
        for(const e of eggs){       // the raw egg: right away visible with its yolk, it sets (turns white and fades) as the egg is stirred in the heat
          const k=this.curdOf(e),r=e.raw,ent=loadRaw(r.img);if(!ent.ready)continue;
          const a=1-smooth(.3,.85,k),white=smooth(0,.6,k),born=Math.min(1,(performance.now()-r.born)/220);
          if(a<=.01)continue;
          const im=ent.img,kk=RAW_W/300*(.6+.4*born)*(1-.15*smooth(.2,1,k)),dw=im.width*kk*sc,dh=im.height*kk*sc;
          let src=im;
          if(white>.03){
            const sc2=this.rawScratch||(this.rawScratch=document.createElement('canvas'));sc2.width=Math.max(1,Math.ceil(dw));sc2.height=Math.max(1,Math.ceil(dh));
            const sg=sc2.getContext('2d');sg.clearRect(0,0,sc2.width,sc2.height);sg.drawImage(im,0,0,sc2.width,sc2.height);
            sg.globalCompositeOperation='source-atop';sg.fillStyle='rgba(248,244,232,'+(white*.9).toFixed(3)+')';sg.fillRect(0,0,sc2.width,sc2.height);sg.globalCompositeOperation='source-over';src=sc2;
          }
          g.save();g.globalAlpha=a*born;g.translate(r.x*sc,r.y*sc);g.rotate(r.rot);g.drawImage(src,-dw/2,-dh/2,dw,dh);g.restore();
        }
        for(const e of eggs){       // the pieces of fried egg lie under the film
          const k=this.curdOf(e),ca=smooth(.2,.75,k),grow=.5+.5*smooth(.15,1,k);
          if(ca<=.01)continue;
          for(const p of e.curds){
            const ent=loadCurd(p.img);if(!ent.ready)continue;
            const im=ent.img,kk=CURD_W/150*p.sc*grow,dw=im.width*kk*sc,dh=im.height*kk*sc;
            g.save();g.globalAlpha=ca;g.translate(p.x*sc,p.y*sc);g.rotate(p.rot);g.drawImage(im,-dw/2,-dh/2,dw,dh);g.restore();
          }
        }
        for(const e of eggs){
          const k=this.curdOf(e),a=BASE_ALPHA*(.3+.7*smooth(0,1,k))/Math.sqrt(Math.max(1,eggs.length*.6));
          for(const p of e.parts){
            load(p.pic);const set=patchSets[p.pic];if(!set)continue;
            const cv=set[p.patch%set.length],sz=p.size*sc*(.75+.25*smooth(0,1,k));
            g.save();g.globalAlpha=Math.min(.6,a);g.translate(p.x*sc,p.y*sc);g.rotate(p.rot);g.drawImage(cv,-sz/2,-sz/2,sz,sz);g.restore();
          }
        }
        g.restore();
        if((+c.stage||1)>=7){g.globalCompositeOperation='source-atop';g.fillStyle='rgba(14,8,4,.78)';g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';}
      }
      this.dirty=false;
    }
  }
  function tick(){
    const now=performance.now();let busy=false;
    for(const sim of [...live]){
      if(!sim.liveCanvases().size){live.delete(sim);continue;}
      sim.sync();
      const energy=sim.step();
      let cs=0;for(const e of sim.eggs.values())cs+=sim.curdOf(e);
      const changed=Math.abs(cs-sim.lastCurd)>1e-4;sim.lastCurd=cs;
      if(energy>0||sim.dirty||changed)sim.draw();
      if(energy>.0008||now<sim.activeUntil+800)busy=true;
    }
    if(busy&&live.size)requestAnimationFrame(tick);else running=false;
  }
  function kick(){if(!running){running=true;requestAnimationFrame(tick);}}
  setInterval(()=>{if(live.size)kick();},500);       // a slowly setting egg (hot pan, no stirring) changes without any movement
  [0,1,2,3].forEach(load);

  window.CooksterEggSim={
    append(layer,vessel,stage){
      if(!layer||!vessel)return;
      let sim=sims.get(vessel);
      if(!sim){sim=new Sim(vessel);sims.set(vessel,sim);}
      if(!sim.liveCanvases().size)sim.eggs.clear();
      const el=document.createElement('canvas');
      el.className='egg-sim-canvas';
      el.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:36';
      layer.appendChild(el);
      sim.canvases.add({el,stage:+stage||1});
      live.add(sim);sim.dirty=true;
      requestAnimationFrame(()=>{sim.dirty=true;kick();});
    },
    stir(vessel,x,y,mx,my){sims.get(vessel)?.stir(x,y,mx,my);},
    debug(vessel){const s=sims.get(vessel);return s?{eggs:s.eggs.size,curd:[...s.eggs.values()].map(e=>s.curdOf(e)),canvases:s.canvases.size}:null;}
  };
})();
