(function(){
  'use strict';

  if(window.CooksterRakijaAnimation)return;

  // Remove the old player's DOM, stale stylesheet and API before installing this one.
  document.getElementById('cooksterCuturaDrinkOverlay')?.remove();
  document.querySelectorAll('link[rel="stylesheet"][href*="cutura-drink-animation.css"]')
    .forEach(link=>{
        if(!/[?&]v=2\.66(?:&|$)/.test(link.href))link.remove();
    });
  try{delete window.CooksterDrinkAnimation;}catch(_){window.CooksterDrinkAnimation=undefined;}

  const CLIP_FILES=Object.freeze([
    'rakija-alpha-02.webm'
  ]);
  const CLIPS=Object.freeze(CLIP_FILES.map(file=>Object.freeze({
    file,
    url:`assets/animations/cutura-drink/${file}?v=2.74`
  })));
  const END_FADE_START_SECONDS=0.35;
  const END_FADE_SECONDS=0.35;
  const PLAYBACK_VOLUME=0.6;
  const VOICE_VERSION='2.74';
  const VOICE_DIRECTORY='assets/audio/cutura-voice';
  const VOICE_SILENCE_PROBABILITY=0.60;
  const VOICE_STAGE_PROGRESS_PROBABILITY=0.80;
  const INTOXICATION_CAMERA_START_SIP=3;
  const INTOXICATION_BLUR_START_SIP=10;
  const INTOXICATION_EFFECTS_MAX_SIP=20;
  const VOICE_VOLUME=0.6;
  const VOICE_STAGES=Object.freeze([
    Object.freeze({name:'trezan',files:Object.freeze([
      'dusicka.mp3',
      'voice_003-enhanced-v2.mp3',
      'voice_004-enhanced-v2.mp3',
      'voice_005-enhanced-v2.mp3',
      'voice_014-enhanced-v2.mp3',
      'voice_019-enhanced-v2.mp3',
      'voice_022-enhanced-v2.mp3',
      'voice_023-enhanced-v2.mp3',
      'voice_027-enhanced-v2.mp3',
      'voice_036-enhanced-v2.mp3',
      'voice_042-enhanced-v2.mp3',
      'voice_046-enhanced-v2.mp3'
    ])}),
    Object.freeze({name:'polupijan',files:Object.freeze([
      'voice_006-enhanced-v2.mp3',
      'voice_009-enhanced-v2.mp3',
      'voice_010-enhanced-v2.mp3',
      'voice_015-enhanced-v2.mp3',
      'voice_016-enhanced-v2.mp3',
      'voice_024-enhanced-v2.mp3',
      'voice_025-enhanced-v2.mp3',
      'voice_026-enhanced-v2.mp3',
      'voice_029-enhanced-v2.mp3',
      'voice_030-enhanced-v2.mp3',
      'voice_034-enhanced-v2.mp3',
      'voice_035-enhanced-v2.mp3',
      'voice_037-enhanced-v2.mp3',
      'voice_050-enhanced-v2.mp3',
      'voice_051_2-enhanced-v2.mp3',
      'voice_051_4-enhanced-v2.mp3'
    ])}),
    Object.freeze({name:'pijan',files:Object.freeze([
      'voice_002-enhanced-v2.mp3',
      'voice_007-enhanced-v2.mp3',
      'voice_008-enhanced-v2.mp3',
      'voice_011-enhanced-v2.mp3',
      'voice_012_013-enhanced-v2.mp3',
      'voice_032-enhanced-v2.mp3',
      'voice_033-enhanced-v2.mp3',
      'voice_038-enhanced-v2.mp3',
      'voice_039-enhanced-v2.mp3',
      'voice_040-enhanced-v2.mp3',
      'voice_043-enhanced-v2.mp3',
      'voice_044-enhanced-v2.mp3',
      'voice_047-enhanced-v2.mp3',
      'voice_049-enhanced-v2.mp3',
      'voice_051_1-enhanced-v2.mp3',
      'voice_051_3-enhanced-v2.mp3'
    ])})
  ]);
  const voiceDecks=VOICE_STAGES.map(()=>null);
  const voicePlayer=new Audio();
  voicePlayer.preload='auto';
  voicePlayer.volume=VOICE_VOLUME;

  const oldOverlay=document.getElementById('cooksterRakijaAnimationOverlay');
  oldOverlay?.remove();
  const overlay=document.createElement('div');
  overlay.id='cooksterRakijaAnimationOverlay';
  overlay.hidden=true;
  overlay.setAttribute('aria-hidden','true');
  const video=document.createElement('video');
  video.className='rakija-animation-video';
  video.preload='metadata';
  video.autoplay=false;
  video.loop=false;
  video.muted=false;
  video.volume=PLAYBACK_VOLUME;
  video.playsInline=true;
  video.disablePictureInPicture=true;
  video.setAttribute('playsinline','');
  video.setAttribute('webkit-playsinline','');
  video.setAttribute('aria-hidden','true');
  overlay.appendChild(video);
  document.body.appendChild(overlay);

  let playing=false;
  let currentClipIndex=-1;
  let lastClipIndex=-1;
  let lastDurationMs=0;
  let playToken=0;
  let endCheckInterval=0;
  let voiceStageIndex=0;
  let voiceStageProgressCount=0;
  let lastVoiceStageName=null;
  let lastVoiceFile=null;
  let lastVoiceWasSilent=false;
  let voicePlayCount=0;
  let voiceSilenceCount=0;
  let intoxicationCamera=null;
  let rakijaSipCount=0;

  function clamp01(value){return Math.max(0,Math.min(1,value));}

  function setEffectVariable(element,name,value,unit=''){
    element.style.setProperty(name,`${Number(value.toFixed(3))}${unit}`);
  }

  function ensureIntoxicationLayer(viewport,id,stageName){
    let layer=document.getElementById(id);
    if(!layer){
      layer=document.createElement('div');
      layer.id=id;
      layer.setAttribute('aria-hidden','true');
      viewport.appendChild(layer);
    }
    layer.dataset.intoxication=stageName;
    return layer;
  }

  function refillVoiceDeck(stageIndex){
    const deck=[...VOICE_STAGES[stageIndex].files];
    for(let index=deck.length-1;index>0;index--){
      const swapIndex=Math.floor(Math.random()*(index+1));
      [deck[index],deck[swapIndex]]=[deck[swapIndex],deck[index]];
    }
    const stageName=VOICE_STAGES[stageIndex].name;
    if(stageName==='pijan'&&deck.length>1&&lastVoiceStageName===stageName&&deck[deck.length-1]===lastVoiceFile){
      const alternateIndex=deck.findIndex(file=>file!==lastVoiceFile);
      [deck[deck.length-1],deck[alternateIndex]]=[deck[alternateIndex],deck[deck.length-1]];
    }
    voiceDecks[stageIndex]=deck;
  }

  function ensureIntoxicationCamera(){
    if(intoxicationCamera?.isConnected)return intoxicationCamera;
    const sceneElement=document.getElementById('scene');
    if(!sceneElement?.parentNode)return null;
    if(sceneElement.parentNode.id==='cooksterIntoxicationCamera'){
      intoxicationCamera=sceneElement.parentNode;
      return intoxicationCamera;
    }
    const frame=document.createElement('div');
    frame.id='cooksterIntoxicationCamera';
    frame.dataset.intoxication='trezan';
    sceneElement.parentNode.insertBefore(frame,sceneElement);
    frame.appendChild(sceneElement);
    intoxicationCamera=frame;
    return frame;
  }

  function updateIntoxicationEffects(sipCount){
    if(sipCount<INTOXICATION_CAMERA_START_SIP)return;
    const camera=ensureIntoxicationCamera();
    const swayProgress=clamp01((sipCount-INTOXICATION_CAMERA_START_SIP+1)/(INTOXICATION_EFFECTS_MAX_SIP-INTOXICATION_CAMERA_START_SIP+1));
    const swayX=1+54*swayProgress;
    const swayY=swayX*.14;
    const swayAngle=.04+.46*swayProgress;
    const zoom=1+.1*swayProgress;
    const cycle=7-1.2*swayProgress;
    if(camera){
      camera.dataset.intoxication='active';
      setEffectVariable(camera,'--cookster-cycle',cycle,'s');
      setEffectVariable(camera,'--cookster-zoom',zoom);
      setEffectVariable(camera,'--cookster-sway-x',swayX,'px');
      setEffectVariable(camera,'--cookster-sway-negative-x',-swayX,'px');
      setEffectVariable(camera,'--cookster-sway-half-x',swayX*.35,'px');
      setEffectVariable(camera,'--cookster-sway-y',swayY,'px');
      setEffectVariable(camera,'--cookster-sway-negative-y',-swayY,'px');
      setEffectVariable(camera,'--cookster-sway-half-y',swayY*.4,'px');
      setEffectVariable(camera,'--cookster-sway-angle',swayAngle,'deg');
      setEffectVariable(camera,'--cookster-sway-negative-angle',-swayAngle,'deg');
      setEffectVariable(camera,'--cookster-sway-half-angle',swayAngle*.35,'deg');
    }
    if(sipCount<INTOXICATION_BLUR_START_SIP)return;
    const viewport=document.getElementById('viewport');
    if(!viewport)return;
    const blurProgress=clamp01((sipCount-INTOXICATION_BLUR_START_SIP+1)/(INTOXICATION_EFFECTS_MAX_SIP-INTOXICATION_BLUR_START_SIP+1));
    const blur=ensureIntoxicationLayer(viewport,'cooksterIntoxicationBlur','active');
    const shade=ensureIntoxicationLayer(viewport,'cooksterIntoxicationShade','active');
    const glow=ensureIntoxicationLayer(viewport,'cooksterIntoxicationGlow','active');
    const shadePeak=.035+.37*blurProgress;
    const glowPeak=.025+.24*blurProgress;
    for(const layer of [blur,shade,glow])setEffectVariable(layer,'--cookster-cycle',cycle,'s');
    setEffectVariable(blur,'--cookster-blur-strength',.8+3.2*blurProgress,'px');
    setEffectVariable(blur,'--cookster-blur-clear',52-24*blurProgress,'%');
    setEffectVariable(blur,'--cookster-blur-opacity-low',.16+.24*blurProgress);
    setEffectVariable(blur,'--cookster-blur-opacity-mid',.25+.35*blurProgress);
    setEffectVariable(blur,'--cookster-blur-opacity-high',.32+.5*blurProgress);
    setEffectVariable(shade,'--cookster-shade-peak',shadePeak);
    setEffectVariable(shade,'--cookster-shade-mid',shadePeak*.45);
    setEffectVariable(glow,'--cookster-glow-peak',glowPeak);
    setEffectVariable(glow,'--cookster-glow-mid',.08+.18*blurProgress);
  }

  function progressIntoxicationStage(){
    if(voiceStageIndex>=VOICE_STAGES.length-1)return;
    if(Math.random()<1-VOICE_STAGE_PROGRESS_PROBABILITY)return;
    voiceStageProgressCount++;
    const stage=VOICE_STAGES[voiceStageIndex];
    if(voiceStageProgressCount>=stage.files.length+1){
      voiceStageIndex++;
      voiceStageProgressCount=0;
    }
  }

  function chooseVoiceFile(){
    if(voiceDecks[voiceStageIndex]===null)refillVoiceDeck(voiceStageIndex);
    if(voiceDecks[voiceStageIndex].length===0)refillVoiceDeck(voiceStageIndex);
    const stage=VOICE_STAGES[voiceStageIndex];
    const file=voiceDecks[voiceStageIndex].pop();
    lastVoiceStageName=stage.name;
    lastVoiceFile=file;
    voicePlayCount++;
    return {stageName:stage.name,file};
  }

  function prepareVoiceForSip(){
    voicePlayer.pause();
    try{voicePlayer.currentTime=0;}catch(_){}
    rakijaSipCount++;
    updateIntoxicationEffects(rakijaSipCount);
    progressIntoxicationStage();
    lastVoiceWasSilent=Math.random()<VOICE_SILENCE_PROBABILITY;
    if(lastVoiceWasSilent){
      voiceSilenceCount++;
      return null;
    }
    const selection=chooseVoiceFile();
    voicePlayer.volume=VOICE_VOLUME;
    voicePlayer.muted=false;
    voicePlayer.src=`${VOICE_DIRECTORY}/${selection.stageName}/${selection.file}?v=${VOICE_VERSION}`;
    voicePlayer.load();
    return selection;
  }

  function playPreparedVoice(selection){
    if(!selection)return false;
    try{
      const playback=voicePlayer.play();
      if(playback&&typeof playback.catch==='function'){
        playback.catch(error=>{
          console.warn('Glasovna replika rakije nije mogla da se pusti.',error);
        });
      }
      return true;
    }catch(error){
      console.warn('Glasovna replika rakije nije mogla da se pusti.',error);
      return false;
    }
  }

  function finishPlayback(token){
    if(token!==playToken)return;
    if(endCheckInterval){
      clearInterval(endCheckInterval);
      endCheckInterval=0;
    }
    playing=false;
    currentClipIndex=-1;
    video.onended=null;
    video.onerror=null;
    video.pause();
    video.style.opacity='';
    if(Number.isFinite(video.currentTime)&&video.currentTime>0)lastDurationMs=video.currentTime*1000;
    overlay.classList.remove('is-visible');
    overlay.hidden=true;
    playToken++;
  }

  function chooseClipIndex(){
    if(CLIPS.length<=1)return 0;
    const candidates=CLIPS.map((_,index)=>index).filter(index=>index!==lastClipIndex);
    return candidates[Math.floor(Math.random()*candidates.length)];
  }

  function playSequence(){
    if(CLIPS.length===0)return false;
    const voiceSelection=prepareVoiceForSip();
    let voiceTriggered=false;
    const clipIndex=chooseClipIndex();
    const clip=CLIPS[clipIndex];
    const token=++playToken;
    if(endCheckInterval){
      clearInterval(endCheckInterval);
      endCheckInterval=0;
    }
    currentClipIndex=clipIndex;
    lastClipIndex=clipIndex;
    playing=true;
    video.pause();
    video.muted=false;
    video.volume=PLAYBACK_VOLUME;
    video.onended=()=>finishPlayback(token);
    video.onerror=()=>{
      console.warn('Video animacija rakije nije mogla da se učita.',video.error);
      finishPlayback(token);
    };
    endCheckInterval=setInterval(()=>{
      if(token!==playToken||!playing)return;
      if(Number.isFinite(video.duration)&&video.duration>0){
        const remaining=video.duration-video.currentTime;
        if(voiceSelection&&!voiceTriggered&&video.currentTime>=video.duration*0.5){
          voiceTriggered=true;
          playPreparedVoice(voiceSelection);
        }
        if(remaining<=END_FADE_START_SECONDS){
          const fadeProgress=(END_FADE_START_SECONDS-remaining)/END_FADE_SECONDS;
          video.style.opacity=String(Math.max(0,1-Math.min(1,fadeProgress)));
        }
        if(remaining<=END_FADE_START_SECONDS-END_FADE_SECONDS)finishPlayback(token);
      }
    },20);
    overlay.hidden=false;
    overlay.classList.add('is-visible');
    video.src=clip.url;
    video.load();
    try{
      const playback=video.play();
      if(playback&&typeof playback.catch==='function'){
        playback.catch(error=>{
          if(token!==playToken)return;
          console.warn('Preglednik nije dozvolio reprodukciju zvuka rakije.',error);
          finishPlayback(token);
        });
      }
    }catch(error){
      console.warn('Video animacija rakije nije mogla da se pusti.',error);
      finishPlayback(token);
    }
    return true;
  }

  window.CooksterRakijaAnimation=Object.freeze({
    play:playSequence,
    get isPlaying(){return playing;},
    get clipCount(){return CLIPS.length;},
    get clipFiles(){return CLIP_FILES;},
    get currentClipName(){return currentClipIndex<0?null:CLIPS[currentClipIndex].file;},
    get lastClipName(){return lastClipIndex<0?null:CLIPS[lastClipIndex].file;},
    get lastDurationMs(){return lastDurationMs;},
    get endFadeStartSeconds(){return END_FADE_START_SECONDS;},
    get endFadeSeconds(){return END_FADE_SECONDS;},
    get hasAudio(){return !video.muted&&video.volume>0;},
    get voiceStage(){return VOICE_STAGES[voiceStageIndex].name;},
    get intoxicationStage(){return VOICE_STAGES[voiceStageIndex].name;},
    get rakijaSipCount(){return rakijaSipCount;},
    get voiceCounts(){return Object.freeze(VOICE_STAGES.map((stage,index)=>Object.freeze({
      stage:stage.name,
      total:stage.files.length,
      remaining:voiceDecks[index]?.length??stage.files.length
    })));},
    get lastVoiceStage(){return lastVoiceStageName;},
    get lastVoiceFile(){return lastVoiceFile;},
    get lastVoiceWasSilent(){return lastVoiceWasSilent;},
    get voicePlayCount(){return voicePlayCount;},
    get voiceSilenceCount(){return voiceSilenceCount;},
    get voiceSilenceProbability(){return VOICE_SILENCE_PROBABILITY;},
    get voicePlaybackProbability(){return 1-VOICE_SILENCE_PROBABILITY;},
    get voiceStageProgressProbability(){return VOICE_STAGE_PROGRESS_PROBABILITY;},
    get voiceStartsAtVideoFraction(){return 0.5;},
    get canPlayWebM(){return video.canPlayType('video/webm; codecs="vp9, opus"')!=='';}
  });

  document.addEventListener('click',event=>{
    const flask=event.target?.closest?.('[data-item-id="cutura_srbija"]');
    if(!flask||flask.closest('#cooksterBottomButtonLayer'))return;
    event.preventDefault();
    event.stopPropagation();
    window.CooksterRakijaAnimation.play();
  },true);
})();