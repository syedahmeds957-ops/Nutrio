import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
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

    // Default Brand Logo: Elegant monogram circle with brand initials
    default: {
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
    }
  }
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
