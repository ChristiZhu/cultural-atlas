/** Shared Frame 06 hover card, with measured SVG lettering and one-pixel outer stroke. */
export function createNameCard(element, { onHide } = {}) {
  const text = element.querySelector('#item-title');
  const accessible = element.querySelector('#item-name-accessible');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  let hideTimer, leaveTimer;
  const namespace = 'http://www.w3.org/2000/svg';
  const width = 264;
  function measure(value, size, spacing) {
    context.font = `${size}px "Ugly Dave"`;
    return context.measureText(value).width + Math.max(0, [...value].length - 1) * spacing;
  }
  function label(name) {
    accessible.textContent = name;
    let size = 25, spacing = 5, lines = [name];
    while (size > 19 && measure(name, size, spacing) > width) { size--; spacing = size * .2; }
    if (measure(name, size, spacing) > width) {
      const words = name.split(/\s+/);
      let split = 1, best = Infinity;
      for (let i = 1; i < words.length; i++) {
        const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
        const widest = Math.max(measure(a, size, spacing), measure(b, size, spacing));
        if (widest < best) { best = widest; split = i; }
      }
      lines = words.length > 1 ? [words.slice(0, split).join(' '), words.slice(split).join(' ')]
        : [name.slice(0, Math.ceil(name.length / 2)), name.slice(Math.ceil(name.length / 2))];
      while (size > 10 && lines.some(line => measure(line, size, spacing) > width)) { size--; spacing = size * .14; }
    }
    text.setAttribute('font-size', size);
    text.setAttribute('letter-spacing', spacing);
    text.replaceChildren(...lines.map((line, index) => {
      const span = document.createElementNS(namespace, 'tspan');
      span.setAttribute('x', '168');
      span.setAttribute('y', lines.length === 1 ? '45.5' : String(34.5 + index * 22));
      span.textContent = line;
      if (measure(line, size, spacing) > width) { span.setAttribute('textLength', width); span.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
      return span;
    }));
  }
  function keep() { clearTimeout(hideTimer); clearTimeout(leaveTimer); if (!element.hidden) element.classList.add('is-visible'); }
  function hide() {
    keep(); element.classList.remove('is-visible');
    hideTimer = setTimeout(() => { element.hidden = true; onHide?.(); }, 160);
  }
  element.addEventListener('pointerenter', keep);
  element.addEventListener('pointerleave', () => { leaveTimer = setTimeout(hide, 160); });
  return {
    show(name) { keep(); label(name); element.hidden = false; requestAnimationFrame(() => element.classList.add('is-visible')); },
    hide,
    leave() { clearTimeout(leaveTimer); leaveTimer = setTimeout(hide, 180); },
    keep,
  };
}
