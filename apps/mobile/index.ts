import { registerRootComponent } from 'expo';

import App from './App';

// Browser-only resets. The typefaces are declared in public/index.html.
if (typeof document !== 'undefined') {
  if (!document.getElementById('nutrio-web-resets')) {
    const style = document.createElement('style');
    style.id = 'nutrio-web-resets';
    style.textContent = `
      input, textarea, select, [contenteditable="true"] {
        -webkit-tap-highlight-color: transparent;
      }
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] {
        -moz-appearance: textfield;
      }
    `;
    document.head.appendChild(style);
  }
}

// Focus outlines are deliberately not removed here: src/ui/webA11y.ts draws the
// visible keyboard-focus ring around each field.

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

