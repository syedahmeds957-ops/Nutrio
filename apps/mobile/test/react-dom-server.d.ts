// react-dom ships no types and @types/react-dom isn't installed. Tests only use
// renderToStaticMarkup (server rendering through react-native-web), so that is all
// this declares.
declare module 'react-dom/server' {
  import type { ReactElement } from 'react';
  export function renderToStaticMarkup(element: ReactElement): string;
}
