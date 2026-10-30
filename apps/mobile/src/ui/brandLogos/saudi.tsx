import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Drawn logos for Saudi restaurant brands, or null for any other brand id.
 * `containerStyle` is the round badge BrandLogo sizes; each logo sets its colour.
 */
export function saudiBrandLogo(
  brandId: string,
  containerStyle: StyleProp<ViewStyle>,
  size: number
): React.ReactElement | null {
  switch (brandId) {
    // 17.5 Saudi Traditional Kitchen (المطبخ الشعبي السعودي - Saudi Royal Green with Golden Palm and Dallah)
    case 'al_matbakh_al_saudi':
    case 'saudi_home_kitchen':
    case 'saudi_traditional_kitchen':
    case 'saudi_traditional':
      return (
        <View style={[containerStyle, { backgroundColor: '#006C35' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Golden Palm Tree Fronds */}
            <Path
              d="M17 24V14M17 14C13 12 10 9 10 7C14 7 16 10 17 14ZM17 14C21 12 24 9 24 7C20 7 18 10 17 14ZM17 14C15 10 15 7 17 5C19 7 19 10 17 14Z"
              stroke="#FEF08A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Golden Dallah Pot Base */}
            <Path
              d="M13 25H21L20 20H14L13 25Z"
              fill="#FEF08A"
            />
            <Path
              d="M14 20L11 17"
              stroke="#FEF08A"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <Path
              d="M20 21C22 21 23 22 23 24"
              stroke="#FEF08A"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      );

    // 18. AlBaik (البيك - Signature Yellow Rooster with Top Hat on Crimson Red)
    case 'albaik':
    case 'al_baik':
      return (
        <View style={[containerStyle, { backgroundColor: '#D62300' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Top Hat */}
            <Path d="M9 13H25V10C25 8.9 24.1 8 23 8H11C9.9 8 9 8.9 9 10V13Z" fill="#111827" />
            <Rect x="7" y="12" width="20" height="2.5" rx="1.2" fill="#FFCC00" />
            {/* Rooster Head */}
            <Circle cx="17" cy="19" r="6.5" fill="#FFFFFF" />
            {/* Comb */}
            <Path d="M12 14C11 12 13 11 14 13" stroke="#D62300" strokeWidth="1.5" strokeLinecap="round" />
            {/* Beak */}
            <Path d="M21 18L26 20L21 22Z" fill="#FFCC00" />
            {/* Eye */}
            <Circle cx="18" cy="18" r="1.2" fill="#111827" />
            {/* Bowtie */}
            <Path d="M14 26L17 27.5L20 26L18.5 29L17 28L15.5 29Z" fill="#FFCC00" />
          </Svg>
        </View>
      );

    // 19. Kudu (كودو - Bold Orange with Stylized KUDU Fork & Knife)
    case 'kudu':
      return (
        <View style={[containerStyle, { backgroundColor: '#F48220' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Plate ring */}
            <Circle cx="17" cy="17" r="12" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 2" />
            {/* Fork */}
            <Path d="M13 10V15C13 16 14 17 15 17V24" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            <Path d="M11 10V13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M15 10V13" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Knife */}
            <Path d="M20 10V18C20 19 21 20 22 20V24" stroke="#FFD54F" strokeWidth="1.8" strokeLinecap="round" />
            {/* Kudu accent spark */}
            <Circle cx="17" cy="10" r="1.5" fill="#FFFFFF" />
          </Svg>
        </View>
      );

    // 20. Al Tazaj (الطازج - Forest Green with Golden Charcoal Grilling Flame)
    case 'al_tazaj':
    case 'altazaj':
    case 'tazaj':
      return (
        <View style={[containerStyle, { backgroundColor: '#00843D' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Golden Charcoal Flame */}
            <Path
              d="M17 6C17 6 12 13 12 19C12 22.5 14.5 25 17 25C19.5 25 22 22.5 22 19C22 13 17 6 17 6Z"
              fill="#FFD100"
            />
            {/* Inner Core Flame */}
            <Path
              d="M17 13C17 13 14.5 17 14.5 20C14.5 21.8 15.8 23 17 23C18.2 23 19.5 21.8 19.5 20C19.5 17 17 13 17 13Z"
              fill="#F58220"
            />
            {/* Charcoal embers */}
            <Path d="M9 26H25" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <Circle cx="13" cy="28" r="1" fill="#FFD100" />
            <Circle cx="17" cy="28.5" r="1.2" fill="#F58220" />
            <Circle cx="21" cy="28" r="1" fill="#FFD100" />
          </Svg>
        </View>
      );

    // 21. Shawarmer (شاورمر - Fiery Red with Wrapped Shawarma & Slices)
    case 'shawarmer':
      return (
        <View style={[containerStyle, { backgroundColor: '#E31B23' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Curved Arabo Shawarma Wrap */}
            <Path
              d="M9 25L23 9C24.5 7.5 27 8.5 26.5 10.5L24 23C23.5 25 21.5 26.5 19.5 26L9 25Z"
              fill="#FFD100"
            />
            <Path d="M12 22L21 13" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            <Path d="M15 25L24 16" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
            {/* Garlic drip dots */}
            <Circle cx="14" cy="11" r="1.5" fill="#FFFFFF" />
            <Circle cx="11" cy="15" r="1.2" fill="#FFFFFF" />
            <Circle cx="17" cy="8" r="1" fill="#FFFFFF" />
          </Svg>
        </View>
      );

    // 22. Herfy (هرفي - Iconic Fast Food Red & Double Arch)
    case 'herfy':
      return (
        <View style={[containerStyle, { backgroundColor: '#E30613' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Stylized Herfy 'H' Burger Arch */}
            <Rect x="8" y="9" width="4.5" height="16" rx="2.2" fill="#FFFFFF" />
            <Rect x="21.5" y="9" width="4.5" height="16" rx="2.2" fill="#FFFFFF" />
            <Rect x="10" y="15" width="14" height="4" rx="2" fill="#FFC107" />
            {/* Crown star */}
            <Path
              d="M17 6L18 8.5L20.5 8.5L18.5 10L19.2 12.5L17 11L14.8 12.5L15.5 10L13.5 8.5L16 8.5Z"
              fill="#FFFFFF"
            />
          </Svg>
        </View>
      );

    // 23. Al Romansiah (الرومانسية - Royal Burgundy with Saudi Palace Dallah)
    case 'al_romansiah':
    case 'romansiah':
      return (
        <View style={[containerStyle, { backgroundColor: '#8A1538' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Traditional Saudi Dallah Silhouette */}
            <Path
              d="M17 7L18.5 10H15.5L17 7ZM15 11H19L20 18C20 21 18.5 23 17 23C15.5 23 14 21 14 18L15 11Z"
              fill="#D4AF37"
            />
            {/* Spout */}
            <Path d="M19 13C22 13 24 10 24 8" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
            {/* Handle */}
            <Path d="M15 13C12 13 11 17 12 21" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
            {/* Base Pedestal */}
            <Path d="M13 24H21V26H13V24Z" fill="#D4AF37" />
          </Svg>
        </View>
      );

    // 24. Mama Noura (ماما نورة - Riyadh Iconic Orange with Shawarma & Fresh Juice)
    case 'mama_noura':
    case 'mamanoura':
      return (
        <View style={[containerStyle, { backgroundColor: '#FF6F00' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Fresh Juice Cup & Straw */}
            <Path d="M12 13L14 26H20L22 13H12Z" fill="#FFE082" />
            <Path d="M10 13H24" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <Path d="M19 8L16 13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            {/* Heart of Hospitality */}
            <Path
              d="M17 16C16 15 14.5 15.5 14.5 17C14.5 18.5 17 20 17 20C17 20 19.5 18.5 19.5 17C19.5 15.5 18 15 17 16Z"
              fill="#E53935"
            />
          </Svg>
        </View>
      );

    // 25. Maestro Pizza (مايسترو بيتزا - Deep Green with Gourmet Slice)
    case 'maestro_pizza':
    case 'maestro':
      return (
        <View style={[containerStyle, { backgroundColor: '#1B5E20' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Pizza Slice */}
            <Path d="M17 7L26 23C24 25 10 25 8 23L17 7Z" fill="#FFD54F" />
            {/* Crust */}
            <Path d="M8 23C10 25 24 25 26 23" stroke="#B87333" strokeWidth="2.5" strokeLinecap="round" />
            {/* Pepperoni dots */}
            <Circle cx="17" cy="13" r="2" fill="#C62828" />
            <Circle cx="14" cy="18" r="1.8" fill="#C62828" />
            <Circle cx="20" cy="18" r="1.8" fill="#C62828" />
            {/* Basil green leaf */}
            <Circle cx="17" cy="21" r="1.2" fill="#2E7D32" />
          </Svg>
        </View>
      );

    // 26. Hamburgini (همبرغيني - Crimson Red with Sleek Angus Burger)
    case 'hamburgini':
      return (
        <View style={[containerStyle, { backgroundColor: '#D32F2F' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Top Bun */}
            <Path d="M9 16C9 11 12.5 9 17 9C21.5 9 25 11 25 16H9Z" fill="#FFCA28" />
            {/* Sesame seeds */}
            <Circle cx="14" cy="12" r="0.8" fill="#FFFFFF" />
            <Circle cx="17" cy="11" r="0.8" fill="#FFFFFF" />
            <Circle cx="20" cy="12.5" r="0.8" fill="#FFFFFF" />
            {/* Angus Beef Patty */}
            <Rect x="8" y="18" width="18" height="3" rx="1.5" fill="#212121" />
            {/* Melted Cheese */}
            <Path d="M8 17L12 19L16 17L20 19L26 17" stroke="#FFCA28" strokeWidth="1.5" strokeLinecap="round" />
            {/* Bottom Bun */}
            <Path d="M9 22H25C25 24.5 22.5 25.5 17 25.5C11.5 25.5 9 24.5 9 22Z" fill="#FFCA28" />
          </Svg>
        </View>
      );

    // 27. Bait Al Shawarma (بيت الشاورما - Deep Terracotta Orange with Shawarma Cone)
    case 'bait_al_shawarma':
    case 'baitalshawarma':
      return (
        <View style={[containerStyle, { backgroundColor: '#D84315' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Skewer Pole */}
            <Path d="M17 6V28" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
            {/* Shawarma Rotating Cone */}
            <Path
              d="M10 11C10 10 24 10 24 11L21 21C20.5 22.5 13.5 22.5 13 21L10 11Z"
              fill="#FFB300"
            />
            {/* Carving lines */}
            <Path d="M12 14C14 15 20 15 22 14" stroke="#BF360C" strokeWidth="1.2" strokeLinecap="round" />
            <Path d="M13 18C15 19 19 19 21 18" stroke="#BF360C" strokeWidth="1.2" strokeLinecap="round" />
            {/* Top tomato/onion garnish */}
            <Circle cx="17" cy="8" r="2.2" fill="#FFFFFF" />
          </Svg>
        </View>
      );

    // 28. Barn's (بارنز كافيه - Espresso Roast Brown with Steaming Gahwa Cup)
    case 'barns':
    case 'barn_cafe':
    case 'barncafe':
      return (
        <View style={[containerStyle, { backgroundColor: '#4E342E' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Coffee Cup */}
            <Path d="M10 15H22V21C22 23.5 19.5 25 16 25C12.5 25 10 23.5 10 21V15Z" fill="#D7CCC8" />
            {/* Cup Handle */}
            <Path d="M22 16C24 16 25 17 25 18.5C25 20 24 21 22 21" stroke="#D7CCC8" strokeWidth="1.8" strokeLinecap="round" />
            {/* Coffee Saucer */}
            <Path d="M8 26H24" stroke="#D7CCC8" strokeWidth="2" strokeLinecap="round" />
            {/* Aromatic Steam spirals */}
            <Path d="M13 12C12.5 10 13.5 9 13 7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M16 12C15.5 10 16.5 9 16 7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M19 12C18.5 10 19.5 9 19 7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </Svg>
        </View>
      );

    // 29. ½ Million (هاف مليون - Minimalist Luxury Obsidian with Typographic Fraction)
    case 'half_million':
    case 'halfmillion':
    case 'half_m':
      return (
        <View style={[containerStyle, { backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151' }]}>
          <Svg width={size * 0.75} height={size * 0.75} viewBox="0 0 34 34" fill="none">
            {/* Outer elegant ring */}
            <Circle cx="17" cy="17" r="14.5" stroke="#374151" strokeWidth="1" />
            {/* 1 */}
            <Path d="M11 11L13 9.5V16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Slash */}
            <Path d="M12 23L22 11" stroke="#A4EB3F" strokeWidth="2.2" strokeLinecap="round" />
            {/* 2 */}
            <Path
              d="M19 18.5C19 17.2 20 16.5 21.5 16.5C23 16.5 24 17.5 23.5 19C23 20.5 19 24 19 24H24.5"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      );
    default:
      return null;
  }
}
