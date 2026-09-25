/**
 * Test stub for react-native-safe-area-context.
 *
 * Like react-native-svg, react-native-safe-area-context is a native module whose
 * entry point includes untranspiled syntax that cannot be parsed in vitest's `node` environment.
 */
import React from 'react';

export const SafeAreaProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);

export const SafeAreaConsumer: React.FC<{ children?: (insets: any) => React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children ? children({ top: 0, bottom: 0, left: 0, right: 0 }) : null);

export const SafeAreaView: React.FC<{ children?: React.ReactNode; style?: any }> = ({ children, style }) =>
  React.createElement('div', { style }, children);

export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: 390, height: 844 });
export const initialWindowMetrics = {
  insets: { top: 0, bottom: 0, left: 0, right: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};
