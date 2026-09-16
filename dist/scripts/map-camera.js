/** Shared map-space camera. Translation, scale and hit targets use Figma units. */
export function createMapCamera({ surface, svg, world, bounds, onChange, onSelect, onDismiss, getInset }) {
  const state = { zoom: 1, x: 0, y: 0 };
  const limits = { min: .65, max: 4 };
  let motion, gesture;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function layout() {
    const rect = svg.getBoundingClientRect();
    const viewport = surface.getBoundingClientRect();
    return { rect, viewport, scale: rect.width / 1512 };
  }
  function visibleBounds() {
    const { rect, viewport, scale } = layout();
    return {
      x: (viewport.left + getInset(scale) - rect.left) / scale,
      y: (viewport.top - rect.top) / scale,
      width: (viewport.width - getInset(scale)) / scale,
      height: viewport.height / scale,
    };
  }
  function constrain() {
    const view = visibleBounds();
    // Keep a small part of the map reachable, while permitting free exploration.
    const visible = 70;
    state.x = clamp(state.x, view.x + visible - (bounds.x + bounds.width) * state.zoom,
      view.x + view.width - visible - bounds.x * state.zoom);
    state.y = clamp(state.y, view.y + visible - (bounds.y + bounds.height) * state.zoom,
      view.y + view.height - visible - bounds.y * state.zoom);
  }
  function draw() {
    world.setAttribute('transform', `translate(${state.x} ${state.y}) scale(${state.zoom})`);
    surface.dataset.zoom = state.zoom.toFixed(4);
    onChange({ ...state }, visibleBounds(), layout());
  }
  function stopMotion() { if (motion) cancelAnimationFrame(motion); motion = null; delete surface.dataset.animating; }
  function point(clientX, clientY) {
    const { rect, scale } = layout();
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }
  function zoomAt(factor, clientX, clientY) {
    stopMotion();
    const p = point(clientX, clientY);
    const next = clamp(state.zoom * factor, limits.min, limits.max);
    const ratio = next / state.zoom;
    state.x = p.x - (p.x - state.x) * ratio;
    state.y = p.y - (p.y - state.y) * ratio;
    state.zoom = next;
    constrain(); draw();
  }
  function animateTo(target) {
    stopMotion();
    if (reducedMotion.matches) { Object.assign(state, target); constrain(); draw(); return; }
    surface.dataset.animating = 'true';
    const start = { ...state }, time = performance.now();
    function step(now) {
      const t = Math.min(1, (now - time) / 420);
      const ease = 1 - (1 - t) ** 3;
      for (const key of ['x', 'y', 'zoom']) state[key] = start[key] + (target[key] - start[key]) * ease;
      constrain(); draw();
      motion = t < 1 ? requestAnimationFrame(step) : null;
      if (t === 1) delete surface.dataset.animating;
    }
    motion = requestAnimationFrame(step);
  }
  surface.addEventListener('wheel', event => {
    event.preventDefault();
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface.clientHeight : 1);
    zoomAt(Math.exp(-clamp(delta, -300, 300) * (event.ctrlKey ? .008 : .002)), event.clientX, event.clientY);
  }, { passive: false });
  surface.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    stopMotion();
    gesture = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY,
      x: state.x, y: state.y, item: event.target.closest('[data-item]'), dragged: false };
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointermove', event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.clientX, dy = event.clientY - gesture.clientY;
    if (!gesture.dragged && Math.hypot(dx, dy) < 4) return;
    gesture.dragged = true;
    surface.dataset.dragging = 'true';
    const { scale } = layout();
    state.x = gesture.x + dx / scale;
    state.y = gesture.y + dy / scale;
    constrain(); draw();
  });
  function finish(event, cancelled = false) {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const ended = gesture; gesture = null;
    delete surface.dataset.dragging;
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
    if (!cancelled && !ended.dragged) {
      if (ended.item) onSelect(ended.item, false);
      else onDismiss();
    }
  }
  surface.addEventListener('pointerup', event => finish(event));
  surface.addEventListener('pointercancel', event => finish(event, true));
  surface.addEventListener('lostpointercapture', event => finish(event, true));
  surface.addEventListener('keydown', event => {
    const item = event.target.closest('[data-item]');
    if (item && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault(); onSelect(item, true); return;
    }
    if (event.key === 'Escape') { onDismiss(); return; }
    const view = visibleBounds();
    const { viewport } = layout();
    if (['+', '=', '-', '_'].includes(event.key)) {
      event.preventDefault(); zoomAt(['+', '='].includes(event.key) ? 1.2 : 1 / 1.2,
        viewport.left + viewport.width / 2, viewport.top + viewport.height / 2);
    } else if (event.key === '0') {
      event.preventDefault(); animateTo({ zoom: 1, x: 0, y: 0 });
    } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); stopMotion();
      state.x += event.key === 'ArrowLeft' ? view.width * .08 : event.key === 'ArrowRight' ? -view.width * .08 : 0;
      state.y += event.key === 'ArrowUp' ? view.height * .08 : event.key === 'ArrowDown' ? -view.height * .08 : 0;
      constrain(); draw();
    }
  });
  new ResizeObserver(() => { constrain(); draw(); }).observe(surface);
  return {
    refresh: draw,
    focus(itemBounds) {
      const { rect, viewport, scale } = layout();
      const zoom = Math.max(state.zoom, 2.6);
      animateTo({ zoom,
        x: (viewport.width * .565 + viewport.left - rect.left) / scale - (itemBounds.x + itemBounds.width / 2) * zoom,
        y: (viewport.height * .51 + viewport.top - rect.top) / scale - itemBounds.y * zoom,
      });
    },
  };
}
