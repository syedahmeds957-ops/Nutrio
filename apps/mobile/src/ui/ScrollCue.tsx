import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme.js';
import { useTextDirection } from '../i18n/index.js';
import { Icon } from './Icon.js';

interface ScrollCueProps {
  children: React.ReactNode;
  /** The colour behind the row, so the edge fades into it. */
  fadeColor: string;
  /** Outer box, for margins that bleed the row to the screen edges. */
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

const FADE_WIDTH = 44;
let nextId = 0;

/**
 * A horizontal row that says it scrolls: while more of it lies past the right
 * edge, that edge fades out with a small chevron, so a chip cut in half reads
 * as "there is more" and not as a layout bug. Hidden in right-to-left
 * layouts, where the end of the row is the left edge and its scroll offsets
 * differ by platform.
 */
export const ScrollCue: React.FC<ScrollCueProps> = ({ children, fadeColor, style, contentContainerStyle }) => {
  const { theme } = useTheme();
  const dir = useTextDirection();
  const [id] = useState(() => `scrollcue-fade-${nextId++}`);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [offset, setOffset] = useState(0);

  const hasMore = !dir.isRTL && contentWidth - offset - layoutWidth > 4;

  return (
    <View
      style={style}
      onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={32}
        onContentSizeChange={(w) => setContentWidth(w)}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => setOffset(e.nativeEvent.contentOffset.x)}
      >
        {children}
      </ScrollView>
      {hasMore && (
        <View pointerEvents="none" style={styles.fade} accessibilityElementsHidden importantForAccessibility="no">
          <Svg width={FADE_WIDTH} height="100%">
            <Defs>
              <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={fadeColor} stopOpacity={0} />
                <Stop offset="0.7" stopColor={fadeColor} stopOpacity={0.95} />
                <Stop offset="1" stopColor={fadeColor} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
          </Svg>
          <View style={styles.chevron}>
            <Icon name="chevron-right" size={16} color={theme.colors.textMuted} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: FADE_WIDTH,
  },
  chevron: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 6,
    justifyContent: 'center',
  },
});
