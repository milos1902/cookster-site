/* Cookster - the egg in a pan (or any vessel).
   An egg that is put into the pan lies there as a loose, raw puddle (white + yolk). Stirring it in a hot pan turns it white and breaks it into small curds
   that move with the spoon between the other pieces. The state of the egg is `curd` (0..1) of its batch in the cooking model (js/core/pan.js);
   this file only draws it: the puddle fades into white and the curds (8-9 small pieces per egg) grow out of it and spread when the dish is stirred.
   Pictures: assets/eggs/sirovo_1..3.webp (raw puddles), assets/eggs/skuvano_1..12.webp (curds). */
(function(){
  'use strict';
  const SIM_W=100;
  const RAW=[1,2,3].map(i=>'assets/eggs/sirovo_'+i+'.webp?v=1');
  const CURD=[...Array(12)].map((_,i)=>'assets/eggs/skuvano_'+(i+1)+'.webp?v=1');
  const RAW_W=46;                 // width of a raw puddle (simulation units) for the widest picture (300 px)
  const CURD_W=15;                // width of a curd for a 150 px picture
  const PER_EGG=9;                // curds per egg
  const MAX_EGGS=8;
  const sims=new WeakMap(),live=new Set();
  let running=false;

  const imgs={};
  function load(src,whiten){
    const k=src+(whiten?'|w':'');let e=imgs[k];if(e)return e;
    e=imgs[k]={img:null,ready:false};
    const im=new Image();
    im.onload=()=>{
      if(whiten){
        // curds turn WHITE when the egg sets: a paler, less saturated copy of the picture
        const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
        const g=c.getContext('2d');
        try{g.filter='saturate(.42) brightness(1.13) contrast(.96)';}catch(_){}
        g.drawImage(im,0,0);e.img=c;
      }else e.img=im;
      e.ready=true;for(const s of live)s.dirty=true;kick();
    };
    im.src=src;
    return e;
  }
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

  function batchesOf(vessel){
    try{
      if(typeof isHeatableCookwareItem==='function'&&isHeatableCookwareItem(vessel))return window.CooksterPan.read(vessel).batches||[];
      return (window.CooksterContainer.read(vessel).transfer||{}).batches||[];
    }catch(_){return [];}
  }

  class Egg{
    constructor(sim,id,batchId){
      this.id=id;this.batchId=batchId;
      this.raw=Math.floor(Math.random()*RAW.length);
      this.rot=(Math.random()-.5)*.9;
      this.x=0;this.y=0;this.vx=0;this.vy=0;this.placed=false;
      this.frags=[];
      for(let i=0;i<PER_EGG;i++){
        const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random());
        this.frags.push({img:Math.floor(Math.random()*CURD.length),rot:Math.random()*Math.PI*2,
          ox:Math.cos(a)*r*26,oy:Math.sin(a)*r*17,x:0,y:0,vx:0,vy:0,sc:.8+Math.random()*.45});
      }
    }
  }

  class Sim{
    constructor(vessel){this.vessel=vessel;this.canvases=new Set();this.eggs=new Map();this.H=SIM_W*.8;this.dirty=true;this.activeUntil=0;this.lastCurd=-1;}
    wrapOf(){return this.vessel._panContent||this.vessel._vesselContent||null;}
    liveCanvases(){for(const c of [...this.canvases])if(!c.el.isConnected)this.canvases.delete(c);return this.canvases;}
    region(){
      const w=this.wrapOf();
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
    }
    inside(x,y){
      const poly=this.poly;let c=false;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++){
        const a=poly[i],b=poly[j];
        if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)c=!c;
      }
      return c;
    }
    pull(p){      // back into the vessel: a step towards the middle until the point is inside
      for(let i=0;i<14&&!this.inside(p.x,p.y);i++){p.x+=(this.cx-p.x)*.2;p.y+=(this.cy-p.y)*.2;}
      p.vx*=.5;p.vy*=.5;
    }
    spot(){
      const xs=this.poly.map(q=>q.x),ys=this.poly.map(q=>q.y);
      const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
      for(let i=0;i<40;i++){
        const x=this.cx+(x0+Math.random()*(x1-x0)-this.cx)*.4,y=this.cy+(y0+Math.random()*(y1-y0)-this.cy)*.4;
        if(this.inside(x,y))return{x,y};
      }
      return{x:this.cx,y:this.cy};
    }
    // eggs of the model: one puddle per egg in the vessel; every batch has one `curd`
    sync(){
      this.region();
      const want=new Set(),byBatch={};
      let n=0;
      for(const b of batchesOf(this.vessel)){
        if(b.key!=='jaje'||!(b.count>0))continue;
        byBatch[b.id]=+b.curd||0;
        const cnt=Math.min(MAX_EGGS-n,Math.round(b.count));
        for(let i=0;i<cnt;i++){
          const id=b.id+'#'+i;want.add(id);n++;
          if(!this.eggs.has(id)){
            const e=new Egg(this,id,b.id),p=this.spot();e.x=p.x;e.y=p.y;e.placed=true;
            for(const f of e.frags){f.x=e.x+f.ox*.3;f.y=e.y+f.oy*.3;}
            this.eggs.set(id,e);
          }
        }
      }
      for(const id of [...this.eggs.keys()])if(!want.has(id))this.eggs.delete(id);
      this.byBatch=byBatch;
      for(const e of this.eggs.values()){
        if(!this.inside(e.x,e.y))this.pull(e);
        for(const f of e.frags)if(!this.inside(f.x,f.y))this.pull(f);
      }
    }
    curdOf(e){return Math.max(0,Math.min(1,+this.byBatch?.[e.batchId]||0));}
    stir(clientX,clientY,mx,my){
      let rect=null;
      for(const c of this.liveCanvases()){const r=c.el.getBoundingClientRect();if(r.width>4){rect=r;break;}}
      if(!rect||!this.eggs.size)return;
      const lx=(clientX-rect.left)/rect.width*SIM_W,ly=(clientY-rect.top)/rect.height*this.H;
      const vx=mx/rect.width*SIM_W,vy=my/rect.height*this.H;
      const speed=Math.hypot(vx,vy);
      const R=30,cx=this.cx,cy=this.cy;
      const dir=((lx-cx)*vy-(ly-cy)*vx)>=0?1:-1;
      const push=(p,k)=>{
        const dx=p.x-lx,dy=p.y-ly,d=Math.hypot(dx,dy);
        if(d>=R)return;
        const w=(1-d/R)*(1-d/R*.3)*k;
        const ox=p.x-cx,oy=p.y-cy,ol=Math.hypot(ox,oy)||1,swirl=Math.min(.45,speed*.07);
        p.vx+=vx*.07*w+(-oy/ol)*dir*swirl*w*.5+(Math.random()-.5)*.05*w;
        p.vy+=vy*.07*w+(ox/ol)*dir*swirl*w*.5+(Math.random()-.5)*.05*w;
      };
      for(const e of this.eggs.values()){
        const c=this.curdOf(e);
        push(e,.45*(1-c*.6));                       // a raw puddle is slippery and heavy: it moves little
        for(const f of e.frags)push(f,.9);
      }
      this.activeUntil=performance.now()+600;this.dirty=true;kick();
    }
    step(){
      let energy=0;
      const all=[];
      for(const e of this.eggs.values()){
        const c=this.curdOf(e);
        const spread=.15+.85*smooth(.2,1,c);          // the curds start together where the puddle is and scatter as the egg sets
        for(const f of e.frags){
          // a weak pull to its place around the puddle, so a fresh egg stays one lump
          const tx=e.x+f.ox*spread,ty=e.y+f.oy*spread,k=c<.7?.06:.004;
          f.vx+=(tx-f.x)*k;f.vy+=(ty-f.y)*k;
          f.x+=f.vx;f.y+=f.vy;
          const sp=Math.hypot(f.vx,f.vy);if(sp>.3){f.vx*=.3/sp;f.vy*=.3/sp;}
          f.vx*=.85;f.vy*=.85;
          if(Math.abs(f.vx)<.002)f.vx=0;if(Math.abs(f.vy)<.002)f.vy=0;
          energy=Math.max(energy,Math.abs(f.vx)+Math.abs(f.vy));
          if(c>.35)all.push(f);
        }
        e.x+=e.vx;e.y+=e.vy;e.vx*=.8;e.vy*=.8;
        if(Math.abs(e.vx)<.002)e.vx=0;if(Math.abs(e.vy)<.002)e.vy=0;
        energy=Math.max(energy,Math.abs(e.vx)+Math.abs(e.vy));
      }
      if(energy>0){
        for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
          const a=all[i],b=all[j],dx=b.x-a.x,dy=b.y-a.y,m=5.2*(a.sc+b.sc)/2;
          if(Math.abs(dx)>m||Math.abs(dy)>m)continue;
          const d2=dx*dx+dy*dy;
          if(d2<m*m){const d=Math.sqrt(d2)||.01,f=(m-d)/d*.2;a.x-=dx*f;a.y-=dy*f;b.x+=dx*f;b.y+=dy*f;}
        }
        for(const e of this.eggs.values()){if(!this.inside(e.x,e.y))this.pull(e);for(const f of e.frags)if(!this.inside(f.x,f.y))this.pull(f);}
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
        const scratch=this.scratch||(this.scratch=document.createElement('canvas'));
        // raw puddles first (below), then the curds
        for(const e of eggs){
          const c0=this.curdOf(e),a=1-smooth(.4,.92,c0);
          const ent=load(RAW[e.raw],false);
          if(a<=.01||!ent.ready)continue;
          const im=ent.img,k=RAW_W/300,dw=im.width*k*sc,dh=im.height*k*sc;
          const white=smooth(0,.65,c0);
          if(white>.02){      // the puddle turns white: its own shape filled with white
            scratch.width=Math.max(1,Math.ceil(dw));scratch.height=Math.max(1,Math.ceil(dh));
            const sg=scratch.getContext('2d');sg.clearRect(0,0,scratch.width,scratch.height);
            sg.drawImage(im,0,0,scratch.width,scratch.height);
            sg.globalCompositeOperation='source-atop';sg.fillStyle='rgba(248,244,232,'+(white*.9).toFixed(3)+')';sg.fillRect(0,0,scratch.width,scratch.height);
            sg.globalCompositeOperation='source-over';
            g.save();g.globalAlpha=a;g.translate(e.x*sc,e.y*sc);g.rotate(e.rot);g.drawImage(scratch,-dw/2,-dh/2,dw,dh);g.restore();
          }else{
            g.save();g.globalAlpha=a;g.translate(e.x*sc,e.y*sc);g.rotate(e.rot);g.drawImage(im,-dw/2,-dh/2,dw,dh);g.restore();
          }
        }
        for(const e of eggs){
          const c0=this.curdOf(e),a=smooth(.22,.8,c0);
          if(a<=.01)continue;
          const grow=.5+.5*smooth(.15,1,c0);
          for(const f of e.frags){
            const ent=load(CURD[f.img],true);if(!ent.ready)continue;
            const im=ent.img,k=CURD_W/150*f.sc*grow,dw=im.width*k*sc,dh=im.height*k*sc;
            g.save();g.globalAlpha=a;g.translate(f.x*sc,f.y*sc);g.rotate(f.rot);g.drawImage(im,-dw/2,-dh/2,dw,dh);g.restore();
          }
        }
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
      if(energy>.004||now<sim.activeUntil+800)busy=true;
    }
    if(busy&&live.size)requestAnimationFrame(tick);else running=false;
  }
  function kick(){if(!running){running=true;requestAnimationFrame(tick);}}
  // the curd of a slowly setting egg (a hot pan, no stirring) grows without any movement: look at it now and then
  setInterval(()=>{if(live.size)kick();},500);

  window.CooksterEggSim={
    // called when a food layer is built and the vessel holds eggs
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
