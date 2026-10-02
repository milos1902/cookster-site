(() => {
  'use strict';

  const scene = document.getElementById('woodSupplyScene');
  const frame = document.getElementById('woodSupplyFrame');
  const basketImage = document.getElementById('woodSupplyBasket');
  const pile = document.getElementById('woodSupplyPile');
  const logLayer = document.getElementById('woodSupplyLogLayer');
  const message = document.getElementById('woodSupplyMessage');
  const countOutput = document.getElementById('woodSupplyCount');
  const menu = document.getElementById('woodSupplyContextMenu');
  const returnButton = document.getElementById('woodSupplyReturn');
  const shadowElement = document.getElementById('woodSupplyShadow');
  const scalePanel = document.getElementById('woodSupplyScalePanel');
  const scaleToggle = document.getElementById('woodSupplyScaleToggle');
  const shadowToggle = document.getElementById('woodSupplyShadowToggle');
  const scaleExport = document.getElementById('woodSupplyScaleExport');
  const scaleReset = document.getElementById('woodSupplyScaleReset');
  const geometryKey = 'cookster.wood-yard-basket-geometry.v1';
  const geometryUpdateKey = 'cookster.wood-yard-basket-geometry.v2.93';

  if (!scene || !frame || !basketImage || !pile || !logLayer || !message || !countOutput || !menu || !returnButton ||
      !shadowElement || !scalePanel || !scaleToggle || !shadowToggle || !scaleExport || !scaleReset) {
    return;
  }

  const stageImages = {
    empty: 'assets/wood_basket/basket-empty.png?v=2.87',
    low: 'assets/wood_basket/basket-low.png?v=2.87',
    medium: 'assets/wood_basket/basket-medium.png?v=2.87',
    full: 'assets/wood_basket/basket-full.png?v=2.87'
  };
  let activeBasket = null;
  let previousVisibility = '';
  let progress = 0;
  let pointerAction = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const isOpen = () => scene.classList.contains('open');
  const geometry = { scale: 2.2, tiltX: 0, tiltY: 0 };
  let shadow = { shadowX: 0, shadowY: 0, width: .8, height: .22, blur: 7, opacity: .48, angle: 0 };
  const ranges = [
    ['scale', .5, 2.2, 'woodSupplyScale', 'woodSupplyScaleValue'],
    ['tiltX', -55, 55, 'woodSupplyTiltX', 'woodSupplyTiltXValue'],
    ['tiltY', -55, 55, 'woodSupplyTiltY', 'woodSupplyTiltYValue']
  ].map(([key, min, max, inputId, outputId]) => ({
    key, min, max, input: document.getElementById(inputId), output: document.getElementById(outputId)
  }));
  try {
    const needsUpdate = localStorage.getItem(geometryUpdateKey) !== 'done';
    const stored = needsUpdate ? {} : JSON.parse(localStorage.getItem(geometryKey) || '{}');
    for (const row of ranges) if (Number.isFinite(stored[row.key]))
      geometry[row.key] = clamp(stored[row.key], row.min, row.max);
    if (needsUpdate) {
      localStorage.setItem(geometryKey, JSON.stringify(geometry));
      localStorage.setItem(geometryUpdateKey, 'done');
    }
  } catch (_) {}

  function renderShadow() {
    if (!isOpen()) return;
    const basket = basketImage.getBoundingClientRect();
    const area = frame.getBoundingClientRect();
    const scale = area.width / 1672;
    const width = basket.width * clamp(+shadow.width || .8, .15, 2.5);
    const height = basket.height * clamp(+shadow.height || .22, .01, 1.2);
    shadowElement.style.left = `${basket.left - area.left + basket.width / 2 + (+shadow.shadowX || 0) * scale}px`;
    shadowElement.style.top = `${basket.bottom - area.top - basket.height * .07 + (+shadow.shadowY || 0) * scale}px`;
    shadowElement.style.width = `${width}px`;
    shadowElement.style.height = `${height}px`;
    shadowElement.style.background = `rgba(29,23,17,${clamp(+shadow.opacity || 0, 0, 1)})`;
    shadowElement.style.filter = `blur(${clamp(+shadow.blur || 0, 0, 30) * scale}px)`;
    shadowElement.style.transform = `translate(-50%, -50%) rotate(${+shadow.angle || 0}deg)`;
  }

  function renderGeometry() {
    basketImage.style.transform = `translate(-50%,-50%) perspective(900px) rotateX(${geometry.tiltX}deg) rotateY(${geometry.tiltY}deg) scale(${geometry.scale})`;
    for (const row of ranges) {
      row.input.value = String(geometry[row.key]);
      row.output.textContent = row.key === 'scale' ? `${geometry.scale.toFixed(2)}×` : `${geometry[row.key]}°`;
    }
    renderShadow();
  }

  for (const row of ranges) row.input.addEventListener('input', () => {
    const value = Number(row.input.value);
    if (!Number.isFinite(value)) return;
    geometry[row.key] = clamp(value, row.min, row.max);
    localStorage.setItem(geometryKey, JSON.stringify(geometry));
    renderGeometry();
  });
  scaleToggle.addEventListener('click', () => { scalePanel.hidden = !scalePanel.hidden; });
  shadowToggle.addEventListener('click', () => { window.CooksterWoodBasketShadow?.open?.(); });
  scaleReset.addEventListener('click', () => {
    Object.assign(geometry, { scale: 1, tiltX: 0, tiltY: 0 });
    localStorage.setItem(geometryKey, JSON.stringify(geometry));
    renderGeometry();
  });
  scaleExport.addEventListener('click', () => {
    const data = { version: 1, tool: 'cookster-wood-yard-basket-geometry', itemId: 'korpa_drva', geometry: { ...geometry } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cookster-wood-yard-basket-geometry.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  function setMessage(text) {
    message.textContent = text;
  }

  function setProgress(next) {
    progress = clamp(Math.floor(next), 0, 4);
    const stage = progress === 0 ? 'empty'
      : progress === 1 ? 'low'
      : progress < 4 ? 'medium'
      : 'full';
    basketImage.src = stageImages[stage];
    basketImage.alt = progress === 4 ? 'Puna korpa za drva' : `Korpa sa ${progress} od 4 cjepanice`;
    frame.dataset.refillProgress = String(progress);
    frame.dataset.basketStage = stage;
    countOutput.value = `${progress} / 4`;
    countOutput.textContent = `${progress} / 4`;
    pile.disabled = progress >= 4;

    basketImage.classList.remove('wood-supply-basket-pop');
    void basketImage.offsetWidth;
    basketImage.classList.add('wood-supply-basket-pop');
    renderShadow();
  }

  function pointerPercent(clientX, clientY) {
    const rect = frame.getBoundingClientRect();
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100)
    };
  }

  function captureFramePointer(event) {
    try {
      frame.setPointerCapture(event.pointerId);
    } catch (_) {
      // Some older browsers may not support capture after a scene transition.
    }
  }

  function enterScene() {
    const basket = window.CooksterWoodBasket?.get?.();
    const state = window.CooksterWoodBasket?.snapshot?.();
    if (!basket || !state || state.remaining > 0 || isOpen()) return false;

    activeBasket = basket;
    previousVisibility = basket.style.visibility;
    basket.style.visibility = 'hidden';
    basketImage.style.left = '72%';
    basketImage.style.top = '74%';
    shadow = { ...shadow, ...window.CooksterWoodBasketShadow?.get?.() };
    scalePanel.hidden = true;
    setProgress(0);
    setMessage('Prevuci cjepanicu sa gomile u korpu. Korpa ostaje na svom mestu.');
    menu.hidden = true;
    menu.setAttribute('aria-hidden', 'true');
    scene.classList.add('open');
    scene.setAttribute('aria-hidden', 'false');
    document.body.classList.add('wood-supply-open');
    renderGeometry();
    return true;
  }

  function leaveScene() {
    if (!isOpen() || progress !== 4) return false;
    menu.hidden = true;
    menu.setAttribute('aria-hidden', 'true');
    if (activeBasket) activeBasket.style.visibility = previousVisibility;
    window.CooksterWoodBasket?.setRemaining?.(9);
    scene.classList.remove('open');
    scene.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('wood-supply-open');
    logLayer.replaceChildren();
    scalePanel.hidden = true;
    activeBasket = null;
    pointerAction = null;
    return true;
  }

  function startLogDrag(event) {
    if (progress >= 4) return;
    const point = pointerPercent(event.clientX, event.clientY);
    const log = document.createElement('img');
    log.className = 'wood-supply-held-log';
    log.alt = '';
    log.setAttribute('aria-hidden', 'true');
    log.draggable = false;
    log.src = 'assets/wood_basket/individual-log.png';
    log.style.left = `${point.x}%`;
    log.style.top = `${point.y}%`;
    logLayer.appendChild(log);
    pointerAction = { type: 'log', pointerId: event.pointerId, element: log };
    captureFramePointer(event);
    event.preventDefault();
  }

  function isDropOnBasket(clientX, clientY) {
    const rect = basketImage.getBoundingClientRect();
    const padX = rect.width * 0.19;
    const padY = rect.height * 0.2;
    return clientX >= rect.left + padX && clientX <= rect.right - padX
      && clientY >= rect.top + padY && clientY <= rect.bottom - padY;
  }

  function putLogInBasket(action, clientX, clientY) {
    const log = action.element;
    const point = pointerPercent(clientX, clientY);
    const targetX = parseFloat(basketImage.style.left) || 72;
    const targetY = parseFloat(basketImage.style.top) || 74;
    progress += 1;

    log.classList.add('is-flying-into-basket');
    log.style.left = `${targetX}%`;
    log.style.top = `${targetY - 1}%`;
    log.style.transform = 'translate(-50%, -50%) scale(.28) rotate(14deg)';
    log.style.opacity = '.12';
    setProgress(progress);

    if (progress === 4) {
      setMessage('Korpa je puna (4/4). Desni klik na korpu za povratak u kuću.');
    } else {
      setMessage(`Cjepanica je ubačena. Još ${4 - progress} do pune korpe.`);
    }
    setTimeout(() => log.remove(), 260);
    return point;
  }

  function cancelPointerAction() {
    if (!pointerAction) return;
    if (pointerAction.type === 'log') pointerAction.element.remove();
    pointerAction = null;
  }

  function openReturnMenu(event) {
    if (progress !== 4) {
      setMessage(`Ubacite još ${4 - progress} cjepanice pre povratka u kuću.`);
      return;
    }
    menu.hidden = false;
    menu.setAttribute('aria-hidden', 'false');
    const frameRect = frame.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    menu.style.left = `${clamp(event.clientX - frameRect.left, 8, frameRect.width - menuRect.width - 8)}px`;
    menu.style.top = `${clamp(event.clientY - frameRect.top, 8, frameRect.height - menuRect.height - 8)}px`;
    returnButton.focus({ preventScroll: true });
  }

  scene.addEventListener('pointerdown', event => {
    if (!isOpen()) return;
    event.stopPropagation();

    if (!menu.hidden && !menu.contains(event.target)) {
      menu.hidden = true;
      menu.setAttribute('aria-hidden', 'true');
    }
    if (event.button !== 0 || menu.contains(event.target)) return;

    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('#woodSupplyBasket')) return;
    if (target?.closest('#woodSupplyPile')) startLogDrag(event);
  });

  scene.addEventListener('pointermove', event => {
    if (!pointerAction || pointerAction.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const point = pointerPercent(event.clientX, event.clientY);
    pointerAction.element.style.left = `${point.x}%`;
    pointerAction.element.style.top = `${point.y}%`;
    event.preventDefault();
  });

  scene.addEventListener('pointerup', event => {
    if (!pointerAction || pointerAction.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const action = pointerAction;
    pointerAction = null;
    if (isDropOnBasket(event.clientX, event.clientY)) {
      putLogInBasket(action, event.clientX, event.clientY);
    } else {
      action.element.remove();
      setMessage('Pusti cjepanicu u korpu da je ubaciš.');
    }
  });

  scene.addEventListener('pointercancel', event => {
    if (pointerAction?.pointerId === event.pointerId) cancelPointerAction();
  });

  scene.addEventListener('contextmenu', event => {
    if (!isOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('#woodSupplyBasket')) openReturnMenu(event);
  });

  pile.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (progress >= 4) return;
    setProgress(progress + 1);
    setMessage(progress === 4
      ? 'Korpa je puna (4/4). Desni klik na korpu za povratak u kuću.'
      : `Cjepanica je ubačena. Još ${4 - progress} do pune korpe.`);
  });

  returnButton.addEventListener('click', leaveScene);

  window.addEventListener('cookster:wood-basket-fill-request', event => {
    if (event.detail?.remaining === 0) enterScene();
  });

  window.CooksterWoodRefill = Object.freeze({
    setShadow(profile) {
      if (!profile || typeof profile !== 'object') return;
      for (const key of ['shadowX', 'shadowY', 'width', 'height', 'blur', 'opacity', 'angle'])
        if (Number.isFinite(+profile[key])) shadow[key] = +profile[key];
      renderShadow();
    },
    snapshot() {
      return {
        active: isOpen(),
        progress,
        stage: frame.dataset.basketStage || '',
        basketX: parseFloat(basketImage.style.left) || 0,
        geometry: { ...geometry },
        shadow: { ...shadow },
        returnMenuOpen: !menu.hidden
      };
    }
  });
})();