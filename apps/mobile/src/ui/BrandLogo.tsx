import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';

interface BrandLogoProps {
  brandId: string;
  size?: number;
  style?: any;
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

  switch (normalizedId) {
    // 1. Ghar ka Khana (Calorify Style: Deep emerald green circle with crisp white cottage/house)
    case 'ghar_ka_khana':
      return (
        <View style={[containerStyle, { backgroundColor: '#1B6B44' }]}>
          <Svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
            {/* House roof */}
            <Path
              d="M3 10.5L12 3L21 10.5"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Chimney */}
            <Path d="M18 5.5V9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
            {/* House body */}
            <Path
              d="M5 9.5V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V9.5"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* House door */}
            <Path
              d="M10 21V13H14V21"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      );

    // 2. Broadway Pizza (Calorify Style: Deep green circle with Broadway Pizza black & gold oval crest)
    case 'broadway':
      return (
        <View style={[containerStyle, { backgroundColor: '#075E35' }]}>
          <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 40 40" fill="none">
            {/* Outer golden rim */}
            <Circle cx="20" cy="20" r="18.5" fill="#0A6A3B" stroke="#F59E0B" strokeWidth="1.2" />
            {/* Black oval center */}
            <Ellipse cx="20" cy="20" rx="15" ry="11" fill="#111827" stroke="#FFFFFF" strokeWidth="1.2" />
            {/* Broadway text */}
            <SvgText
              x="20"
              y="19"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="6.5"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif"
              letterSpacing="0.4"
            >
              BROADWAY
            </SvgText>
            {/* Pizza ribbon */}
            <Rect x="11" y="21.5" width="18" height="5" rx="1.5" fill="#F59E0B" />
            <SvgText
              x="20"
              y="25.5"
              textAnchor="middle"
              fill="#111827"
              fontSize="4.2"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif"
              letterSpacing="0.8"
            >
              PIZZA
            </SvgText>
          </Svg>
        </View>
      );

    // 3. Cheezious (Calorify Style: Golden yellow circle with Cheezious smiling burger mascot)
    case 'cheezious':
      return (
        <View style={[containerStyle, { backgroundColor: '#FDB813' }]}>
          <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 36 36" fill="none">
            {/* Burger Top Bun */}
            <Path
              d="M8 17C8 10.5 12.5 7 18 7C23.5 7 28 10.5 28 17H8Z"
              fill="#D97706"
              stroke="#B45309"
              strokeWidth="1.2"
            />
            {/* Sesame seeds */}
            <Circle cx="13" cy="11" r="0.8" fill="#FEF3C7" />
            <Circle cx="18" cy="9.5" r="0.8" fill="#FEF3C7" />
            <Circle cx="23" cy="11" r="0.8" fill="#FEF3C7" />
            {/* Smiling happy eyes */}
            <Path d="M12 14.5C12.8 13.2 14.2 13.2 15 14.5" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
            <Path d="M21 14.5C21.8 13.2 23.2 13.2 24 14.5" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" />
            {/* Blushing cheeks */}
            <Circle cx="11" cy="15.5" r="1.2" fill="#EF4444" opacity="0.6" />
            <Circle cx="25" cy="15.5" r="1.2" fill="#EF4444" opacity="0.6" />
            {/* Melted dripping cheese */}
            <Path
              d="M7 17.5H29C29 17.5 27.5 22 25 22C23 22 22.5 20.5 21 20.5C19.5 20.5 19 23 17 23C15 23 14.5 20.5 13 20.5C11.5 20.5 11 21.8 9 21.8L7 17.5Z"
              fill="#F59E0B"
            />
            {/* Juicy Beef Patty */}
            <Rect x="7" y="21" width="22" height="4" rx="2" fill="#78350F" />
            {/* Bottom Bun */}
            <Path
              d="M9 25H27C27 27.5 23.5 29 18 29C12.5 29 9 27.5 9 25Z"
              fill="#D97706"
              stroke="#B45309"
              strokeWidth="1.2"
            />
          </Svg>
        </View>
      );

    // 4. Hardee's (Calorify Style: Crisp white circle with Hardee's famous smiling Happy Star)
    case 'hardees':
      return (
        <View style={[containerStyle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 36 36" fill="none">
            {/* 5-Point Happy Star */}
            <Path
              d="M18 3L22.2 12.8L32.8 13.8L24.8 20.8L27.2 31.2L18 25.8L8.8 31.2L11.2 20.8L3.2 13.8L13.8 12.8L18 3Z"
              fill="#FFC72C"
              stroke="#ED1C24"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            {/* Smiling Star Eyes */}
            <Circle cx="15" cy="16" r="1.4" fill="#0A0B0D" />
            <Circle cx="21" cy="16" r="1.4" fill="#0A0B0D" />
            {/* Cheerful Grin */}
            <Path
              d="M14.5 20C15.5 22 20.5 22 21.5 20"
              stroke="#0A0B0D"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </Svg>
        </View>
      );

    // 5. Kababjees (Calorify Style: White circle with Kababjees red signature script wordmark)
    case 'kababjees':
    case 'kababjees_fried_chicken':
      return (
        <View style={[containerStyle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
          <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 40 40" fill="none">
            {/* Flame crown */}
            <Path
              d="M19.5 7C20.5 9 22 10 20.5 12C22.5 10.5 24 12.5 22.5 14C24.5 13.5 25 15.5 23.5 17C26 15 26.5 18 24 19.5C21 21 18 19 18 16C18 13 21 11 19.5 7Z"
              fill="#DC2626"
            />
            <Circle cx="20" cy="15" r="1.8" fill="#F59E0B" />
            <SvgText
              x="20"
              y="26"
              textAnchor="middle"
              fill="#B91C1C"
              fontSize="7.2"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Brush Script MT', 'Segoe UI', cursive, sans-serif"
              fontStyle="italic"
              letterSpacing="0.2"
            >
              kababjees
            </SvgText>
            <Rect x="8" y="28.5" width="24" height="1.2" rx="0.6" fill="#DC2626" />
          </Svg>
        </View>
      );

    // 6. KFC Pakistan (Calorify Style: White circle with classic red-white striped bucket and KFC emblem)
    case 'kfc':
      return (
        <View style={[containerStyle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
          <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 36 36" fill="none">
            {/* Bucket Shape */}
            <Path
              d="M7 11L10 29C10.2 30.2 11.2 31 12.5 31H23.5C24.8 31 25.8 30.2 26 29L29 11H7Z"
              fill="#FFFFFF"
              stroke="#E4002B"
              strokeWidth="1.5"
            />
            {/* Red and White vertical bucket stripes */}
            <Path d="M10 12L12 30" stroke="#E4002B" strokeWidth="2.5" />
            <Path d="M16 12L16.5 30" stroke="#E4002B" strokeWidth="2.5" />
            <Path d="M20 12L19.5 30" stroke="#E4002B" strokeWidth="2.5" />
            <Path d="M26 12L24 30" stroke="#E4002B" strokeWidth="2.5" />
            {/* Bucket Top Lid Rim */}
            <Ellipse cx="18" cy="11" rx="11" ry="3" fill="#E4002B" />
            <Ellipse cx="18" cy="11" rx="9" ry="2" fill="#FFFFFF" />
            {/* KFC Center Logo Badge */}
            <Rect x="10" y="16" width="16" height="8" rx="2" fill="#E4002B" />
            <SvgText
              x="18"
              y="22"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="5.8"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif"
              letterSpacing="0.6"
            >
              KFC
            </SvgText>
          </Svg>
        </View>
      );

    // 7. McDonald's Pakistan (Iconic Red background with Golden Arches 'M')
    case 'mcdonalds':
      return (
        <View style={[containerStyle, { backgroundColor: '#DA291C' }]}>
          <Svg width={size * 0.68} height={size * 0.68} viewBox="0 0 32 32" fill="none">
            {/* Golden Arches */}
            <Path
              d="M4 27V15.5C4 10.2 7.6 6 12 6C15.8 6 16 9.8 16 12.5C16 9.8 16.2 6 20 6C24.4 6 28 10.2 28 15.5V27"
              stroke="#FFC72C"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      );

    // 8. OPTP (Calorify Style: White circle with bold red OPTP and golden Belgian fries)
    case 'optp':
      return (
        <View style={[containerStyle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
          <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 36 36" fill="none">
            {/* Golden fries poking out */}
            <Rect x="13" y="5" width="2.5" height="12" rx="1" fill="#F59E0B" transform="rotate(-10 13 5)" />
            <Rect x="17" y="4" width="2.5" height="13" rx="1" fill="#FBBF24" />
            <Rect x="21" y="6" width="2.5" height="11" rx="1" fill="#F59E0B" transform="rotate(12 21 6)" />
            {/* Red OPTP badge */}
            <Rect x="4" y="14" width="28" height="15" rx="3" fill="#DC2626" />
            <SvgText
              x="18"
              y="23.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="8"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif"
              letterSpacing="0.8"
            >
              OPTP
            </SvgText>
            <SvgText
              x="18"
              y="27"
              textAnchor="middle"
              fill="#FEF08A"
              fontSize="2.8"
              fontWeight="800"
              letterSpacing="0.2"
            >
              ONE POTATO
            </SvgText>
          </Svg>
        </View>
      );

    // 9. Savour Foods (Royal green circle with golden pulao crest)
    case 'savour':
      return (
        <View style={[containerStyle, { backgroundColor: '#075E35' }]}>
          <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 38 38" fill="none">
            {/* Golden rim */}
            <Circle cx="19" cy="19" r="17.5" fill="#0A6836" stroke="#F59E0B" strokeWidth="1.2" />
            {/* Crown / Crest */}
            <Path
              d="M13 13L16 11L19 13L22 11L25 13V15H13V13Z"
              fill="#F59E0B"
            />
            {/* Steaming platter */}
            <Ellipse cx="19" cy="22" rx="11" ry="4.5" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
            {/* Shami kabab on pulao */}
            <Ellipse cx="19" cy="21" rx="5" ry="2" fill="#78350F" />
            {/* Savour text */}
            <SvgText
              x="19"
              y="30"
              textAnchor="middle"
              fill="#FEF08A"
              fontSize="5.2"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif"
              letterSpacing="0.6"
            >
              SAVOUR
            </SvgText>
          </Svg>
        </View>
      );

    // 10. Subway Pakistan (Iconic green & yellow split arrows wordmark)
    case 'subway':
      return (
        <View style={[containerStyle, { backgroundColor: '#008938' }]}>
          <Svg width={size * 0.82} height={size * 0.82} viewBox="0 0 38 38" fill="none">
            <Rect x="4" y="11" width="30" height="16" rx="3" fill="#005A28" />
            <SvgText
              x="12"
              y="22.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="7.8"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif"
              fontStyle="italic"
            >
              SUB
            </SvgText>
            <SvgText
              x="26"
              y="22.5"
              textAnchor="middle"
              fill="#FFC220"
              fontSize="7.8"
              fontWeight="900"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Arial Black', sans-serif"
              fontStyle="italic"
            >
              WAY
            </SvgText>
            {/* Arrows */}
            <Path d="M6 16.5L3.5 19L6 21.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M32 16.5L34.5 19L32 21.5" stroke="#FFC220" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      );

    // 11. Domino's Pakistan
    case 'dominos':
      return (
        <View style={[containerStyle, { backgroundColor: '#006491' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32" fill="none">
            {/* Domino tile red part */}
            <Rect x="6" y="6" width="20" height="9.5" rx="2" fill="#E31837" stroke="#FFFFFF" strokeWidth="1" />
            <Circle cx="16" cy="11" r="1.8" fill="#FFFFFF" />
            {/* Domino tile blue part */}
            <Rect x="6" y="16.5" width="20" height="9.5" rx="2" fill="#006491" stroke="#FFFFFF" strokeWidth="1" />
            <Circle cx="11.5" cy="21.5" r="1.8" fill="#FFFFFF" />
            <Circle cx="20.5" cy="21.5" r="1.8" fill="#FFFFFF" />
          </Svg>
        </View>
      );

    // 12. Pizza Hut Pakistan
    case 'pizza_hut':
      return (
        <View style={[containerStyle, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
          <Svg width={size * 0.78} height={size * 0.78} viewBox="0 0 36 36" fill="none">
            {/* Iconic Red Roof */}
            <Path
              d="M5 18C5 18 10 11 18 11C26 11 31 18 31 18C31 18 28 16.5 18 16.5C8 16.5 5 18 5 18Z"
              fill="#EE3124"
            />
            <Path
              d="M4 18L18 9L32 18H4Z"
              fill="#EE3124"
            />
            {/* Yellow ribbon banner */}
            <Rect x="7" y="19" width="22" height="4.5" rx="1.5" fill="#F59E0B" />
            <SvgText
              x="18"
              y="22.8"
              textAnchor="middle"
              fill="#111827"
              fontSize="3.8"
              fontWeight="900"
              letterSpacing="0.4"
            >
              PIZZA HUT
            </SvgText>
          </Svg>
        </View>
      );

    // 13. Johnny & Jugnu
    case 'johnny_jugnu':
      return (
        <View style={[containerStyle, { backgroundColor: '#18141F' }]}>
          <Svg width={size * 0.76} height={size * 0.76} viewBox="0 0 36 36" fill="none">
            {/* Flame wrap icon */}
            <Circle cx="18" cy="18" r="15.5" fill="#241B2E" stroke="#F97316" strokeWidth="1.2" />
            <Path
              d="M18 7C19.5 11 23 13 21 17C24 14 26 17 24 21C27 19 28 23 25 26C22 29 14 29 11 25C8 21 11 16 15 16C12 12 15 9 18 7Z"
              fill="#EA580C"
            />
            <Circle cx="18" cy="22" r="3.5" fill="#FBBF24" />
            <SvgText
              x="18"
              y="23.5"
              textAnchor="middle"
              fill="#18141F"
              fontSize="5.2"
              fontWeight="900"
            >
              J&J
            </SvgText>
          </Svg>
        </View>
      );

    // 14. Ranchers Cafe
    case 'ranchers':
      return (
        <View style={[containerStyle, { backgroundColor: '#3B2314' }]}>
          <Svg width={size * 0.74} height={size * 0.74} viewBox="0 0 34 34" fill="none">
            {/* Western Hat */}
            <Ellipse cx="17" cy="23" rx="13" ry="3.5" fill="#92400E" stroke="#F59E0B" strokeWidth="1.2" />
            <Path
              d="M11 23C11 16 13 11 17 11C21 11 23 16 23 23H11Z"
              fill="#D97706"
              stroke="#F59E0B"
              strokeWidth="1.2"
            />
            {/* Sheriff Star */}
            <Circle cx="17" cy="18" r="3" fill="#FBBF24" />
          </Svg>
        </View>
      );

    // 15. Student Biryani
    case 'student_biryani':
      return (
        <View style={[containerStyle, { backgroundColor: '#B45309' }]}>
          <Svg width={size * 0.76} height={size * 0.76} viewBox="0 0 36 36" fill="none">
            {/* Degh / Handi Shape */}
            <Path
              d="M9 16C9 24 13 28 18 28C23 28 27 24 27 16H9Z"
              fill="#F59E0B"
              stroke="#FEF3C7"
              strokeWidth="1.2"
            />
            {/* Lid */}
            <Path d="M7 16H29L26 12H10L7 16Z" fill="#D97706" />
            <Circle cx="18" cy="10.5" r="2" fill="#FEF3C7" />
            <SvgText
              x="18"
              y="22.5"
              textAnchor="middle"
              fill="#78350F"
              fontSize="4.8"
              fontWeight="900"
            >
              STUDENT
            </SvgText>
          </Svg>
        </View>
      );

    // 16. Chaaye Khana / Quetta Tea
    case 'chaaye_khana':
    case 'quetta_tea':
      return (
        <View style={[containerStyle, { backgroundColor: '#78350F' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Teapot */}
            <Path
              d="M11 15C11 22 13 25 18 25C23 25 25 22 25 15H11Z"
              fill="#FDE68A"
              stroke="#FEF3C7"
              strokeWidth="1.2"
            />
            {/* Handle */}
            <Path d="M25 17C28 17 29 21 26 23" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" />
            {/* Spout */}
            <Path d="M11 19L7 15" stroke="#FEF3C7" strokeWidth="2.4" strokeLinecap="round" />
            {/* Steam lines */}
            <Path d="M15 11C15 8 17 8 17 6" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" />
            <Path d="M19 11C19 8 21 8 21 6" stroke="#FEF3C7" strokeWidth="1.5" strokeLinecap="round" />
          </Svg>
        </View>
      );

    // 17. Bundu Khan / BBQ Tonight
    case 'bundu_khan':
    case 'bbq_tonight':
      return (
        <View style={[containerStyle, { backgroundColor: '#991B1B' }]}>
          <Svg width={size * 0.72} height={size * 0.72} viewBox="0 0 34 34" fill="none">
            {/* Skewers & Flame */}
            <Path d="M7 27L27 7" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
            <Path d="M12 25L15 22" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            <Path d="M16 21L19 18" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <Path d="M20 17L23 14" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
            {/* Grill Flame */}
            <Path
              d="M17 19C15 16 16 13 18 12C19 14 21 14 20 17C21 17 22 18 21 20C19 22 17 21 17 19Z"
              fill="#F59E0B"
            />
          </Svg>
        </View>
      );

    // Default Brand Logo: Elegant monogram circle with brand initials
    default: {
      const cleanName = (brandId || '').replace(/_/g, ' ').trim();
      const initials = cleanName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'PK';

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
    }
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
