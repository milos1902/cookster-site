/* Cookster — imported vessel food visibility calibration.
   Source: the latest populated profiles from calibration exports (3)–(8).
   The large-pot insertion and juggling behavior remains project-specific. */
(function(){
  'use strict';
  // Retire the old inline geometry snapshots before the gameplay runtime
  // starts. They belong to the previous calibration system and must not be
  // allowed to become an alternate source for the large pot.
  try{
    delete window.__COOKSTER_IMPORTED_GEOMETRY__;
    delete window.__COOKSTER_IMPORTED_CALIBRATION__;
  }catch(_){}
  const points=s=>s.split(';').map(p=>p.split(',').map(Number));
  // Rough starting profiles (a guess from the picture) for the vessels that have not been calibrated yet, so that the food stays inside the opening.
  // They are made from the ellipse of the opening (centre, radii, percent of the picture) and the top of the heap.
  // Replace any of them by calibrating the vessel in the tool "Maska posude" and putting the exported profile into PROFILES.
  const ellipse=(cx,cy,rx,ry,n,from=0,to=Math.PI*2)=>{const o=[];for(let i=0;i<=n;i++){const a=from+(to-from)*i/n;o.push([+(cx+rx*Math.cos(a)).toFixed(2),+(cy+ry*Math.sin(a)).toFixed(2)])}return o};
  function guessProfile(cx,cy,rx,ry,top,wallBottom=100){
    // food: the upper half of the opening reaches up to the top of the heap, the lower half is the opening itself
    const upper=[[cx-rx*.92,cy],[cx-rx*.8,top+(cy-top)*.45],[cx-rx*.5,top+(cy-top)*.12],[cx,top],[cx+rx*.5,top+(cy-top)*.12],[cx+rx*.8,top+(cy-top)*.45],[cx+rx*.92,cy]];
    const lower=ellipse(cx,cy,rx*.92,ry*.92,10,0,Math.PI).map(p=>p);
    // the front wall hides what is below the front rim
    const rim=ellipse(cx,cy,rx,ry,10,Math.PI,0);          // from the right side ... see below
    const front=ellipse(cx,cy,rx,ry,10,0,Math.PI);          // right -> bottom -> left (the front rim line)
    const mask=front.concat([[Math.max(0,cx-rx*1.02),Math.min(wallBottom,cy+ry+(wallBottom-cy-ry)*.5)],[Math.max(0,cx-rx*.7),wallBottom],[Math.min(100,cx+rx*.7),wallBottom],[Math.min(100,cx+rx*1.02),Math.min(wallBottom,cy+ry+(wallBottom-cy-ry)*.5)]]);
    return {
      mask:mask.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),
      foodVisible:upper.concat(lower.slice().reverse().map(p=>[p[0],p[1]])).map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),
      bottom:ellipse(cx,cy+ry*.15,rx*.6,ry*.5,12),
      depth:{bottom:[cx,+(cy+ry*.2).toFixed(2)],foodTop:[cx,+(top+(cy-top)*.2).toFixed(2)]}
    };
  }
  const PROFILES={
    serpa_velika:{
      mask:[
        [22.368,60.217],[28.158,63.725],[38.289,67.76],[49.211,68.988],
        [60.658,66.883],[71.053,62.322],[76.842,57.41],[82.105,50.392],
        [84.868,41.796],[86.447,37.585],[86.579,50.392],[85.263,61.796],
        [84.737,69.515],[83.026,77.059],[79.211,84.076],[72.763,91.445],
        [64.211,95.831],[54.474,98.813],[42.237,97.936],[32.237,95.129],
        [23.816,88.111],[17.237,78.111],[15.789,71.445],[14.737,59.164],
        [13.684,49.339],[14.211,45.655],[17.5,54.076]
      ],
      foodVisible:[
        [15.658,50.392],[16.579,40.392],[20.789,32.322],[25.526,26.357],
        [30.921,21.445],[38.158,18.111],[45.263,15.831],[52.895,14.778],
        [60.263,16.357],[67.368,18.638],[72.895,23.024],[76.842,28.462],
        [79.474,33.55],[81.184,39.69],[81.579,46.708],[80.395,53.199],
        [73.947,59.69],[67.105,64.603],[56.974,67.936],[44.868,68.988],
        [32.763,66.006],[25.526,61.971],[19.474,56.532]
      ],
      bottom:[
        [21.842,57.41],[23.684,49.164],[29.079,42.146],[35.789,37.76],
        [43.289,34.603],[52.5,33.725],[61.184,35.304],[68.421,38.287],
        [73.816,42.848],[77.5,48.111],[78.947,51.796],[78.816,55.304],
        [72.763,61.62],[64.342,66.532],[53.684,69.164],[41.711,68.988],
        [35.526,67.059],[30.132,65.655],[23.816,61.269]
      ],
      depth:{
        bottom:[50.526,64.252],
        foodTop:[50.789,6.883]
      }
    },
    tiganj_veliki:{
      // Latest user export: vessel-image-local-percent (blue bottom / green foodVisible).
      mask:[],
      foodVisible:points('20.329,55.911;16.908,45.83;16.513,34.629;21.382,24.827;27.961,18.386;36.513,13.066;47.697,9.985;58.75,9.985;68.882,12.645;79.013,16.846;86.118,23.847;90.855,33.368;91.776,43.45;89.408,54.091;82.961,61.652;75.329,66.273;63.355,70.053;50.461,71.034;36.382,67.813;26.645,62.352'),
      bottom:points('21.645,53.951;21.118,46.67;24.408,34.909;32.697,25.807;41.645,20.627;54.408,18.246;66.118,20.067;76.513,24.267;83.355,31.688;87.961,41.489;87.829,51.291;84.671,58.852;80.329,63.192;66.908,69.633;55.329,71.034;40.461,69.213;30.461,64.733;23.882,59.692'),
      depth:{bottom:points('53.882,56.612')[0],foodTop:points('60.855,5.084')[0]}
    },
    tiganj_mali:{
      mask:points('22.697,59.935;27.171,69.845;36.776,73.188;48.092,74.859;61.513,72.83;71.25,70.442;77.171,68.293;79.539,55.996;69.276,62.562;55.987,65.786;41.908,66.263;31.25,63.995'),
      foodVisible:points('18.75,57.07;12.961,48.235;12.303,36.893;15.329,28.058;23.355,19.224;31.776,14.09;42.566,11.344;59.539,10.866;71.382,13.732;79.803,19.224;86.118,27.342;88.75,35.699;88.092,44.176;83.882,52.295;72.829,60.532;60.855,64.711;45.329,66.382;29.013,63.159'),
      bottom:points('26.25,61.607;20.855,57.428;17.961,49.668;17.566,41.669;21.776,33.909;28.355,27.223;39.145,22.328;49.671,20.298;62.961,21.611;72.697,25.79;79.539,31.76;83.092,38.803;83.092,46.206;80.855,53.369;76.382,57.906;65.724,63.398;51.513,66.263;36.776,65.308'),
      depth:{bottom:points('50.197,50.265')[0],foodTop:points('27.303,9.911')[0]}
    },
    vangla_srednja:{
      mask:points('88.947,56.389;79.737,67.821;65.658,74.014;48.289,76.396;30.789,72.426;20.132,67.027;10.395,54.324;10.263,62.422;15,73.379;21.053,81.794;30.132,89.416;40.395,94.021;51.579,94.973;63.816,92.592;74.342,86.081;81.842,77.666;87.237,69.091;90.132,62.422'),
      foodVisible:points('16.579,63.693;13.289,51.625;14.605,39.081;20.526,30.348;28.553,24.155;37.895,20.027;48.421,18.439;59.211,19.074;69.342,22.726;77.895,29.078;84.737,36.382;88.289,46.226;88.421,53.53;87.632,59.723;81.447,65.757;72.632,71.791;61.711,75.919;51.316,76.713;37.368,75.602;28.158,72.267;18.289,65.757'),
      bottom:points('22.237,68.298;21.184,61.787;24.868,53.372;30.395,47.655;39.737,43.845;49.737,41.939;61.184,43.686;69.474,47.973;75.526,54.642;78.026,60.835;77.632,68.456;69.211,73.061;58.684,75.919;43.816,76.237;33.158,74.331;25.658,70.838'),
      depth:{bottom:points('49.474,65.598')[0],foodTop:points('49.211,7.324')[0]}
    },
    vangla_mala:{
      mask:points('14.013,53.734;10.987,58.619;14.803,68.389;20.592,78.455;27.303,85.856;36.382,91.185;45.461,93.998;58.618,93.702;69.013,88.373;77.303,80.971;82.829,72.682;88.224,62.764;90.329,54.918;89.276,50.478;82.566,59.359;68.618,66.317;53.75,69.721;38.75,68.981;26.776,64.836;19.276,59.359'),
      foodVisible:points('17.039,57.287;14.671,48.109;15.329,39.376;20.197,30.79;27.566,25.017;36.645,21.168;47.171,19.688;57.697,19.836;66.382,22.056;76.25,26.645;82.961,33.158;85.329,38.783;86.25,45.741;85.987,54.918;79.145,61.876;65.066,67.797;50.855,70.313;41.645,69.425;31.776,67.501;21.25,61.432'),
      bottom:points('23.224,62.468;23.487,56.695;26.776,50.478;33.618,45.445;41.776,42.928;52.434,42.336;61.776,44.408;70.461,49.737;75.066,55.955;76.382,62.764;70.987,66.169;59.145,68.833;47.303,69.869;34.539,67.945;29.276,66.021'),
      depth:{bottom:points('49.803,63.652')[0],foodTop:points('50.066,8.734')[0]}
    },
    vangla_velika:{
      mask:points('11.053,56.398;9.342,59.813;13.158,70.368;18.289,78.594;25.658,86.355;33.158,91.322;43.553,95.358;52.632,96.289;63.816,93.185;74.211,86.976;81.579,79.681;86.579,71.92;91.184,61.365;92.237,56.398;91.184,52.983;83.421,62.607;74.079,68.815;57.895,74.093;40.132,74.248;26.053,70.212;16.579,64.159'),
      foodVisible:points('14.868,60.589;12.368,50.81;12.237,40.876;15.789,31.873;22.632,25.354;31.579,19.611;41.711,16.351;53.158,15.575;64.474,17.593;75.132,22.094;82.5,30.011;87.368,36.996;89.474,46.464;88.816,56.243;77.895,67.108;65.395,72.696;48.684,75.335;36.447,73.627;29.211,71.454;18.947,65.245'),
      bottom:points('20.921,66.332;20.526,60.123;23.026,52.517;28.947,46.153;39.474,41.186;51.711,39.789;63.026,41.807;72.368,46.464;77.895,53.449;80.132,59.192;80.395,64.314;68.816,71.299;53.684,74.714;43.684,75.024;33.421,73.006;24.079,68.971'),
      depth:{bottom:points('49.474,67.108')[0],foodTop:points('50.263,6.262')[0]}
    },
    lavor_emajl_veliki:{
      mask:points('10.789,49.061;13.289,61.648;17.895,73.054;21.974,79.937;27.237,85.641;38.026,90.754;48.158,92.72;59.737,91.54;70.263,87.214;78.158,80.331;82.5,74.037;86.447,64.008;90.263,54.371;89.474,50.045;83.816,55.748;75.263,60.664;63.421,64.008;48.947,64.991;32.632,63.024;21.316,58.108'),
      foodVisible:points('15.395,56.928;12.763,46.505;15.395,39.818;21.447,34.115;28.684,30.378;38.421,26.642;49.342,25.462;59.079,25.265;69.342,27.625;76.184,31.165;83.026,35.098;87.763,40.801;89.868,47.685;87.368,54.174;81.579,58.304;72.368,63.614;59.079,66.171;44.605,66.564;35.789,65.778;25.263,62.041;18.553,59.091'),
      bottom:points('22.5,60.664;25.789,53.388;31.711,49.455;38.026,46.111;45.789,44.931;53.684,44.341;61.053,45.718;68.553,48.078;74.211,51.618;77.237,54.371;79.605,58.894;69.605,64.204;55.658,66.368;40.658,66.171;27.632,62.828'),
      depth:{bottom:points('51.842,62.631')[0],foodTop:points('51.316,15.235')[0]}
    },
    kal_02_cinija_mala:guessProfile(50.2,20.4,42.4,12.1,0,100),
    kal_02_cinija_velika:guessProfile(50.3,19.8,43.3,15.6,0,100),
    kal_02_tanjir_ravni:guessProfile(48.6,42.8,29.2,22.8,18,100),
    kal_02_duboki_tanjir:guessProfile(53,52,29,24,22,100),
    kal_01_okrugli_pleh:guessProfile(49.3,42.8,46,38,8,100),
    kal_01_pravougaoni_pleh:{
      mask:[[19.4,76],[95.8,33.8],[97,46],[96,70],[70,96],[19,96],[16,80]],
      foodVisible:[[12.5,35],[40,12],[91.7,8],[95.8,33.8],[19.4,76]],
      bottom:[[22,38],[44,22],[86,16],[90,32],[26,64]],
      depth:{bottom:[54,38],foodTop:[54,14]}
    },
    posuda_za_kupus:{
      // Miloš's export (vessel-image-local-percent): the bowl for the sour cabbage
      mask:points('14.868,66.128;25.132,73.41;42.105,79.677;59.211,79.507;74.868,74.426;85.526,65.62;95.263,52.918;93.947,67.652;87.632,80.185;79.868,88.483;69.079,95.427;55.789,99.831;38.947,98.984;21.579,89.838;10.263,77.814;8.026,59.015'),
      foodVisible:points('12.105,63.079;8.421,50.377;8.421,38.352;12.763,27.005;20.263,19.553;29.737,13.456;44.474,9.561;57.763,9.392;73.816,14.472;81.974,20.908;90.395,32.594;93.553,44.111;92.895,54.272;89.605,61.724;81.974,70.023;68.684,77.306;55.526,80.185;46.842,79.846;35.789,78.152;20,70.7'),
      bottom:points('22.763,71.717;19.868,65.789;19.342,58.506;22.105,49.53;29.079,42.586;37.368,37.506;47.368,35.135;57.5,35.135;66.316,37.844;72.237,42.248;78.289,49.192;81.184,58.845;81.316,65.958;79.211,71.717;71.184,76.628;62.237,79.338;50.395,80.015;39.211,78.83;28.947,75.612'),
      depth:{bottom:points('51.053,65.62')[0],foodTop:points('51.053,3.633')[0]}
    }
  };
  const copy=v=>JSON.parse(JSON.stringify(v));
  const polygon=points=>`polygon(${points.map(p=>`${p[0]}% ${p[1]}%`).join(',')})`;
  function frameFor(vesselOrId){
    const profile=get(vesselOrId);
    if(!profile?.foodVisible?.length)return null;
    let left=100,top=100,right=0,bottom=0;
    for(const [x,y] of profile.foodVisible){
      left=Math.min(left,x);top=Math.min(top,y);
      right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    return {
      left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top),
      clipX:50,clipY:50,frontTop:50,roastBottom:66
    };
  }

  try{
    [
      'cookster.chopped-calibration.v1',
      'cookster.vessel-food-area.v1',
      'cookster.vessel-depth-calibration.v1'
    ].forEach(key=>localStorage.removeItem(key));
  }catch(_){}
  try{
    const saveKey='cookster.save.v1';
    const saved=JSON.parse(localStorage.getItem(saveKey)||'null');
    if(saved&&typeof saved==='object'&&
       (Object.prototype.hasOwnProperty.call(saved,'choppedCalibration')||
        Object.prototype.hasOwnProperty.call(saved,'vesselDepthCalibration'))){
      delete saved.choppedCalibration;
      delete saved.vesselDepthCalibration;
      localStorage.setItem(saveKey,JSON.stringify(saved));
    }
  }catch(_){}

  function get(vesselOrId){
    const id=typeof vesselOrId==='string'
      ?vesselOrId
      :(vesselOrId?.dataset?.itemId||'');
    return PROFILES[id]||null;
  }
  function applyToVessel(vessel,wrap,front,preset){
    const profile=get(vessel);
    if(!profile||!vessel)return false;
    const frame=preset||frameFor(vessel);
    vessel.dataset.foodVisibilityCalibration='imported';
    vessel.dataset.foodDepthBottom=`${profile.depth.bottom[0]},${profile.depth.bottom[1]}`;
    vessel.dataset.foodDepthTop=`${profile.depth.foodTop[0]},${profile.depth.foodTop[1]}`;

    if(front){
      const mask=polygon(profile.mask);
      front.style.clipPath=mask;
      front.style.webkitClipPath=mask;
      front.dataset.foodVisibilityMask='imported';
    }
    if(wrap&&frame?.width&&frame?.height){
      const local=profile.foodVisible.map(([x,y])=>[
        +(((x-frame.left)/frame.width)*100).toFixed(3),
        +(((y-frame.top)/frame.height)*100).toFixed(3)
      ]);
      const visible=polygon(local);
      wrap.style.clipPath=visible;
      wrap.style.webkitClipPath=visible;
      wrap.style.maskImage='none';
      wrap.style.webkitMaskImage='none';
      wrap.dataset.foodVisibilityArea='imported';
    }
    return true;
  }
  function depthProgress(vessel,n){
    const profile=get(vessel);
    if(!profile?.depth?.bottom||!profile.depth.foodTop)return null;
    const steps=6;
    const t=Math.max(0,Math.min(1,(Math.max(1,+n||1)-1)/(steps-1)));
    return {step:Math.round(t*(steps-1)),t};
  }
  function pointAtDepth(vessel,t){
    const profile=get(vessel);
    const frame=frameFor(vessel);
    if(!profile?.depth?.bottom||!profile.depth.foodTop||!frame)return null;
    const f=Math.max(0,Math.min(1,+t||0));
    const x=profile.depth.bottom[0]+
      (profile.depth.foodTop[0]-profile.depth.bottom[0])*f;
    const y=profile.depth.bottom[1]+
      (profile.depth.foodTop[1]-profile.depth.bottom[1])*f;
    return {
      x:+(((x-frame.left)/frame.width)*100).toFixed(3),
      y:+(((y-frame.top)/frame.height)*100).toFixed(3)
    };
  }
  function horizontalRangeAtDepth(vessel,t){
    const profile=get(vessel);
    const frame=frameFor(vessel);
    if(!profile?.foodVisible?.length||!profile?.depth?.bottom||
       !profile.depth.foodTop||!frame)return null;
    const f=Math.max(0,Math.min(1,+t||0));
    const fullY=profile.depth.bottom[1]+
      (profile.depth.foodTop[1]-profile.depth.bottom[1])*f;
    const xs=[];
    const points=profile.foodVisible;
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      const ay=+a[1]||0,by=+b[1]||0;
      const ax=+a[0]||0,bx=+b[0]||0;
      if(Math.abs(ay-by)<1e-8){
        if(Math.abs(fullY-ay)<1e-5){xs.push(ax,bx);}
        continue;
      }
      const crosses=(ay<=fullY&&fullY<by)||(by<=fullY&&fullY<ay);
      if(crosses)xs.push(ax+(bx-ax)*((fullY-ay)/(by-ay)));
    }
    const point=pointAtDepth(vessel,f);
    if(!point)return null;
    if(xs.length<2)return {left:point.x-20,right:point.x+20,y:point.y};
    const left=Math.min(...xs),right=Math.max(...xs);
    return {
      left:+(((left-frame.left)/frame.width)*100).toFixed(3),
      right:+(((right-frame.left)/frame.width)*100).toFixed(3),
      y:point.y
    };
  }
  function bottomSlots(vessel,count=3){
    const profile=get(vessel);
    const frame=frameFor(vessel);
    const source=profile?.bottom;
    if(!Array.isArray(source)||source.length<3||!frame)return null;
    const points=source.map(p=>Array.isArray(p)?p:[p.x,p.y]).filter(p=>Number.isFinite(+p[0])&&Number.isFinite(+p[1]));
    if(points.length<3)return null;
    const local=points.map(([x,y])=>[
      (x-frame.left)/frame.width*100,
      (y-frame.top)/frame.height*100
    ]);
    const n=Math.max(1,Math.round(+count||3));
    const minY=Math.min(...local.map(p=>p[1])),maxY=Math.max(...local.map(p=>p[1]));
    const cols=n<=2?n:Math.ceil(Math.sqrt(n));
    const rows=Math.max(1,Math.ceil(n/cols));
    const intersectionsAt=(y)=>{
      const xs=[];
      for(let i=0;i<local.length;i++){
        const a=local[i],b=local[(i+1)%local.length];
        if(Math.abs(a[1]-b[1])<1e-8)continue;
        const crosses=(a[1]<=y&&y<b[1])||(b[1]<=y&&y<a[1]);
        if(crosses)xs.push(a[0]+(b[0]-a[0])*((y-a[1])/(b[1]-a[1])));
      }
      return xs;
    };
    const slots=[];
    for(let i=0;i<n;i++){
      const row=Math.floor(i/cols),col=i%cols;
      const y=minY+(maxY-minY)*(rows===1?.52:(.22+.56*(row/Math.max(1,rows-1))));
      const xs=intersectionsAt(y);
      const left=xs.length>=2?Math.min(...xs):Math.min(...local.map(p=>p[0]));
      const right=xs.length>=2?Math.max(...xs):Math.max(...local.map(p=>p[0]));
      slots.push({
        x:+(left+(right-left)*((col+.5)/cols)).toFixed(3),
        y:+y.toFixed(3)
      });
    }
    return slots;
  }
  window.CooksterVesselFoodCalibration={
    get:v=>copy(get(v)),
    frame:v=>copy(frameFor(v)),
    applyToVessel,
    depthProgress,
    pointAtDepth,
    horizontalRangeAtDepth,
    bottomSlots,
    profiles:copy(PROFILES)
  };
})();