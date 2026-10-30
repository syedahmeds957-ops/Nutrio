import React from 'react';
import { Image, StyleProp, ImageStyle } from 'react-native';
import { dishImageSource } from '../dishImage.js';

interface DishThumbProps {
  category: string | undefined;
  size: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * The category photo for a dish. The photo stands for the kind of dish, not
 * this exact one, so it is decorative for screen readers; the name beside it
 * says what the food is. Renders nothing when the category has no photo, so
 * rows keep their old layout.
 */
export const DishThumb: React.FC<DishThumbProps> = ({ category, size, style }) => {
  const source = dishImageSource(category);
  if (!source) return null;
  return (
    <Image
      source={source}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ width: size, height: size, borderRadius: size / 4 }, style]}
    />
  );
};
