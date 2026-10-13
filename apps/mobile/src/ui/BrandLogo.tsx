import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { pakistaniBrandLogo } from './brandLogos/pakistan.js';
import { saudiBrandLogo } from './brandLogos/saudi.js';

interface BrandLogoProps {
  brandId: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ brandId, size = 46, style }) => {
  const normalizedId = (brandId || '').toLowerCase().trim();

  // Helper for container styling
  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  const drawn =
    pakistaniBrandLogo(normalizedId, containerStyle, size) ??
    saudiBrandLogo(normalizedId, containerStyle, size);
  if (drawn) return drawn;

  // Any other brand: a monogram circle with its initials.
  const cleanName = (brandId || '').replace(/_/g, ' ').trim();
  const initials = cleanName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SA';

  return (
    <View style={[containerStyle, { backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151' }]}>
      <Text
        style={{
          color: '#A4EB3F',
          fontSize: size * 0.38,
          fontWeight: '800',
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
});
