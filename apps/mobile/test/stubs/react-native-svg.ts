/**
 * Test stub for react-native-svg.
 *
 * react-native-svg is a native module: its entry points require untranspiled
 * React Native Flow source, which cannot be parsed in vitest's `node`
 * environment. The component tests only build elements via React.createElement
 * and inspect props — the component bodies never run — so resolving the import
 * is all that is required.
 *
 * Mirrors the react-native -> react-native-web substitution in vitest.config.ts.
 */
import React from 'react';

const stub = (name: string) => {
  const C: React.FC<Record<string, unknown>> = ({ children }) =>
    React.createElement(React.Fragment, null, children as React.ReactNode);
  C.displayName = name;
  return C;
};

export const Circle = stub('Circle');
export const ClipPath = stub('ClipPath');
export const Defs = stub('Defs');
export const Ellipse = stub('Ellipse');
export const G = stub('G');
export const Line = stub('Line');
export const LinearGradient = stub('LinearGradient');
export const Mask = stub('Mask');
export const Path = stub('Path');
export const Polygon = stub('Polygon');
export const Polyline = stub('Polyline');
export const RadialGradient = stub('RadialGradient');
export const Rect = stub('Rect');
export const Stop = stub('Stop');
export const Text = stub('Text');
export const TSpan = stub('TSpan');
export const Use = stub('Use');

const Svg = stub('Svg');
export default Svg;
