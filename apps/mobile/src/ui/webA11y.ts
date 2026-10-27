/**
 * Browser-only keyboard accessibility: a visible focus ring on every control
 * and a "skip to content" link. react-native-web strips both, and individual
 * inputs also set outline: none inline, hence the !important.
 *
 * The ring is two-tone (dark outline inside a lime halo) so it reads on both
 * the light and the dark surfaces; lime alone is 1.4:1 on white.
 */
const STYLE_ID = 'nutrio-a11y-style';
const LINK_ID = 'nutrio-skip-link';
const MAIN_ID = 'nutrio-main';

const CSS = `
html :focus-visible {
  outline: 2px solid #0A0B0D !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 4px #A4EB3F !important;
}
html input:focus-visible, html textarea:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
html :has(> input:focus-visible), html :has(> textarea:focus-visible) {
  outline: 2px solid #0A0B0D !important;
  outline-offset: 1px !important;
  box-shadow: 0 0 0 4px #A4EB3F !important;
}
#${LINK_ID} {
  position: fixed; top: 8px; inset-inline-start: 8px; z-index: 100000;
  padding: 10px 16px; border-radius: 12px; background: #0A0B0D; color: #A4EB3F;
  font: 700 14px sans-serif; text-decoration: none;
  transform: translateY(-200%);
}
#${LINK_ID}:focus { transform: none; }
`;

export function installWebA11y(skipLabel: string): void {
  const doc = (globalThis as { document?: Document }).document;
  if (!doc?.head || !doc.body) return;

  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }

  let link = doc.getElementById(LINK_ID) as HTMLAnchorElement | null;
  if (!link) {
    link = doc.createElement('a');
    link.id = LINK_ID;
    link.href = `#${MAIN_ID}`;
    link.addEventListener('click', (event) => {
      const main = doc.getElementById(MAIN_ID);
      if (!main) return;
      event.preventDefault();
      main.setAttribute('tabindex', '-1');
      main.focus();
    });
    doc.body.insertBefore(link, doc.body.firstChild);
  }
  link.textContent = skipLabel;
}
