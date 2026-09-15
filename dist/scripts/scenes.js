/** Add later screens here as they are implemented. Artwork and behavior stay separate. */
export const scenes = Object.freeze({
  home: { elementId: 'home', title: 'The Cultural Atlas' },
  corkboard: { elementId: 'corkboard', title: 'Corkboard — The Cultural Atlas' },
});

export async function prepareScene(element) {
  await Promise.all([...element.querySelectorAll('img')].map(image => image.decode()));
}

export function showScene(element, visible) {
  element.classList.toggle('scene--active', visible);
  element.inert = !visible;
  element.setAttribute('aria-hidden', String(!visible));
}
