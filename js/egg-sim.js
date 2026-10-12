/* Cookster - the egg in a pan (or any vessel).
   An egg that is put into the dish does not lie there as a lump: it is mixed into everything. It is drawn as a pale, translucent white-cream film
   (assets/eggs/smesa_1..4.webp) over the whole food, 20-30 % visible at most. The state of the egg is `curd` (0..1) of its batch in the cooking model
   (js/core/pan.js): it rises while the dish is stirred in a hot pan. At the start only a small, faint patch of film lies where the egg fell;
   stirring spreads it over the whole food area, turns it slowly and makes it more visible. */
(function(){
  'use strict';
  const SIM_W=100;
  const FILM=[1,2,3,4].map(i=>'assets/eggs/smesa_'+i+'.webp?v=1');
  const MAX_ALPHA=.62;            // the film is never more visible than this
  const sims=new WeakMap(),live=new Set();
  let running=false;
  const imgs={};
  function load(src){
    let e=imgs[src];if(e)return e;
    e=imgs[src]={img:new Image(),ready:false};
    e.img.onload=()=>{e.ready=true;for(const s of live)s.dirty=true;kick();};
    e.img.src=src;return e;
  }
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  function batchesOf(vessel){
    try{
      if(typeof isHeatableCookwareItem==='function'&&isHeatableCookwareItem(vessel))return window.CooksterPan.read(vessel).batches||[];
      return (window.CooksterContainer.read(vessel).transfer||{}).batches||[];
    }catch(_){return [];}
  }

  class Sim{
    constructor(vessel){this.vessel=vessel;this.canvases=new Set();this.films=new Map();this.H=SIM_W*.8;this.dirty=true;this.activeUntil=0;this.lastCurd=-1;}
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
      const xs=poly.map(q=>q.x),ys=poly.map(q=>q.y);
      this.poly=poly;this.x0=Math.min(...xs);this.x1=Math.max(...xs);this.y0=Math.min(...ys);this.y1=Math.max(...ys);
    }
    // one film per egg in the vessel (at most 4), all of them follow the curd of their batch
    sync(){
      this.region();
      const want=new Set();this.byBatch={};let n=0;
      for(const b of batchesOf(this.vessel)){
        if(b.key!=='jaje'||!(b.count>0))continue;
        this.byBatch[b.id]=+b.curd||0;
        for(let i=0;i<Math.min(4-n,Math.round(b.count));i++){
          const id=b.id+'#'+i;want.add(id);n++;
          if(!this.films.has(id)){
            const rx=(Math.random()-.5)*.5,ry=(Math.random()-.5)*.4;     // where the egg fell (a part of the whole food area)
            this.films.set(id,{id,batch:b.id,pic:(this.films.size+Math.floor(Math.random()*4))%4,rot:Math.random()*6.28,spin:0,rx,ry});
          }
        }
      }
      for(const id of [...this.films.keys()])if(!want.has(id))this.films.delete(id);
    }
    curdOf(f){return Math.max(0,Math.min(1,+this.byBatch?.[f.batch]||0));}
    stir(mx,my){
      const sp=Math.hypot(mx,my);
      for(const f of this.films.values())f.spin+=Math.min(.06,sp*.0016)*(mx>=0?1:-1);
      this.activeUntil=performance.now()+600;this.dirty=true;kick();
    }
    step(){
      let energy=0;
      for(const f of this.films.values()){f.rot+=f.spin;f.spin*=.9;if(Math.abs(f.spin)<.0005)f.spin=0;energy=Math.max(energy,Math.abs(f.spin));}
      return energy;
    }
    draw(){
      this.sync();
      const films=[...this.films.values()];
      for(const c of this.liveCanvases()){
        const el=c.el,w=el.clientWidth,h=el.clientHeight;
        if(!w||!h)continue;
        const dpr=Math.min(1.5,window.devicePixelRatio||1);
        if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}
        const g=el.getContext('2d'),sc=w/SIM_W;
        g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
        // only inside the food area
        g.save();g.beginPath();this.poly.forEach((q,i)=>i?g.lineTo(q.x*sc,q.y*sc):g.moveTo(q.x*sc,q.y*sc));g.closePath();g.clip();
        const bw=(this.x1-this.x0),bh=(this.y1-this.y0),cx=(this.x0+this.x1)/2,cy=(this.y0+this.y1)/2;
        const per=films.length?Math.min(MAX_ALPHA,MAX_ALPHA*1.15/Math.sqrt(films.length)):0;
        for(const f of films){
          const ent=load(FILM[f.pic]);if(!ent.ready)continue;
          const k=this.curdOf(f);
          const a=per*(.25+.75*smooth(0,1,k));          // faint when raw, full (20-30 %) when set
          const grow=.42+.7*smooth(0,.9,k);             // a patch where it fell, then the whole food area
          const spreadX=f.rx*(1-smooth(0,.8,k)),spreadY=f.ry*(1-smooth(0,.8,k));
          const iw=bw*1.25*grow,ih=iw*ent.img.height/ent.img.width;
          g.save();g.globalAlpha=a;g.translate((cx+spreadX*bw)*sc,(cy+spreadY*bh)*sc);g.rotate(f.rot);
          g.drawImage(ent.img,-iw/2*sc,-ih/2*sc,iw*sc,ih*sc);g.restore();
        }
        g.restore();
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
      let cs=0;for(const f of sim.films.values())cs+=sim.curdOf(f);
      const changed=Math.abs(cs-sim.lastCurd)>1e-4;sim.lastCurd=cs;
      if(energy>0||sim.dirty||changed)sim.draw();
      if(energy>.0008||now<sim.activeUntil+800)busy=true;
    }
    if(busy&&live.size)requestAnimationFrame(tick);else running=false;
  }
  function kick(){if(!running){running=true;requestAnimationFrame(tick);}}
  setInterval(()=>{if(live.size)kick();},500);       // a slowly setting egg (hot pan, no stirring) changes without any movement

  window.CooksterEggSim={
    append(layer,vessel,stage){
      if(!layer||!vessel)return;
      let sim=sims.get(vessel);
      if(!sim){sim=new Sim(vessel);sims.set(vessel,sim);}
      if(!sim.liveCanvases().size)sim.films.clear();
      const el=document.createElement('canvas');
      el.className='egg-sim-canvas';
      el.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:36';
      layer.appendChild(el);
      sim.canvases.add({el,stage:+stage||1});
      live.add(sim);sim.dirty=true;
      requestAnimationFrame(()=>{sim.dirty=true;kick();});
    },
    stir(vessel,x,y,mx,my){sims.get(vessel)?.stir(mx,my);},
    debug(vessel){const s=sims.get(vessel);return s?{films:s.films.size,curd:[...s.films.values()].map(f=>s.curdOf(f)),canvases:s.canvases.size}:null;}
  };
})();
