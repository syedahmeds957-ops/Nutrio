import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconProps as PhosphorIconProps } from 'phosphor-react-native';
// Deep imports keep the bundle to the icons actually used; the package root
// pulls in all ~1,500 of them.
import { Flame } from 'phosphor-react-native/src/icons/Flame';
import { Scales } from 'phosphor-react-native/src/icons/Scales';
import { Barbell } from 'phosphor-react-native/src/icons/Barbell';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { Lightning } from 'phosphor-react-native/src/icons/Lightning';
import { Sparkle } from 'phosphor-react-native/src/icons/Sparkle';
import { ForkKnife } from 'phosphor-react-native/src/icons/ForkKnife';
import { User } from 'phosphor-react-native/src/icons/User';
import { ChatCircleDots } from 'phosphor-react-native/src/icons/ChatCircleDots';
import { ClipboardText } from 'phosphor-react-native/src/icons/ClipboardText';
import { ListChecks } from 'phosphor-react-native/src/icons/ListChecks';
import { Coffee } from 'phosphor-react-native/src/icons/Coffee';
import { Sun } from 'phosphor-react-native/src/icons/Sun';
import { Drop } from 'phosphor-react-native/src/icons/Drop';
import { GearSix } from 'phosphor-react-native/src/icons/GearSix';
import { Check } from 'phosphor-react-native/src/icons/Check';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { ArrowRight } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArrowUp } from 'phosphor-react-native/src/icons/ArrowUp';
import { ArrowUpRight } from 'phosphor-react-native/src/icons/ArrowUpRight';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { PersonSimpleWalk } from 'phosphor-react-native/src/icons/PersonSimpleWalk';
import { Minus } from 'phosphor-react-native/src/icons/Minus';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { ArrowsLeftRight } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { ImageSquare } from 'phosphor-react-native/src/icons/ImageSquare';
import { ShieldCheck } from 'phosphor-react-native/src/icons/ShieldCheck';
import { House } from 'phosphor-react-native/src/icons/House';
import { CaretDown } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretLeft } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { Star } from 'phosphor-react-native/src/icons/Star';
import { Envelope } from 'phosphor-react-native/src/icons/Envelope';
import { Lock } from 'phosphor-react-native/src/icons/Lock';
import { Target } from 'phosphor-react-native/src/icons/Target';
import { X } from 'phosphor-react-native/src/icons/X';
import { WarningCircle } from 'phosphor-react-native/src/icons/WarningCircle';
import { Info } from 'phosphor-react-native/src/icons/Info';
import { ArrowsClockwise } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { Buildings } from 'phosphor-react-native/src/icons/Buildings';
import { DotsThree } from 'phosphor-react-native/src/icons/DotsThree';
import { Moon } from 'phosphor-react-native/src/icons/Moon';
import { Eye } from 'phosphor-react-native/src/icons/Eye';

import { BowlFood } from 'phosphor-react-native/src/icons/BowlFood';
import { Fish } from 'phosphor-react-native/src/icons/Fish';
import { Cheese } from 'phosphor-react-native/src/icons/Cheese';
import { Bread } from 'phosphor-react-native/src/icons/Bread';
import { Orange } from 'phosphor-react-native/src/icons/Orange';
import { Carrot } from 'phosphor-react-native/src/icons/Carrot';
import { CookingPot } from 'phosphor-react-native/src/icons/CookingPot';
import { Leaf } from 'phosphor-react-native/src/icons/Leaf';
import { Cookie } from 'phosphor-react-native/src/icons/Cookie';
import { Jar } from 'phosphor-react-native/src/icons/Jar';
import { Grains } from 'phosphor-react-native/src/icons/Grains';
import { Plant } from 'phosphor-react-native/src/icons/Plant';
import { BookmarkSimple } from 'phosphor-react-native/src/icons/BookmarkSimple';

export type IconName =
  | 'flame'
  | 'scale'
  | 'dumbbell'
  | 'calendar'
  | 'search'
  | 'zap'
  | 'sparkles'
  | 'utensils'
  | 'user'
  | 'coach'
  | 'clipboard'
  | 'survey'
  | 'coffee'
  | 'sun'
  | 'droplet'
  | 'settings'
  | 'check'
  | 'arrow-left'
  | 'arrow-right'
  | 'plus'
  | 'walk'
  | 'minus'
  | 'trash'
  | 'swap'
  | 'image'
  | 'shield'
  | 'home'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'star'
  | 'mail'
  | 'lock'
  | 'target'
  | 'arrow-up'
  | 'arrow-up-right'
  | 'alert'
  | 'info'
  | 'sync'
  | 'x'
  | 'building'
  | 'more'
  | 'moon'
  | 'eye'
  | 'bowl'
  | 'fish'
  | 'cheese'
  | 'bread'
  | 'orange'
  | 'carrot'
  | 'cooking-pot'
  | 'leaf'
  | 'cookie'
  | 'jar'
  | 'grains'
  | 'plant'
  | 'bookmark';

/** Phosphor (https://phosphoricons.com) glyph behind each app icon name. */
const GLYPHS: Record<IconName, React.ComponentType<PhosphorIconProps>> = {
  flame: Flame,
  scale: Scales,
  dumbbell: Barbell,
  calendar: CalendarBlank,
  search: MagnifyingGlass,
  zap: Lightning,
  sparkles: Sparkle,
  utensils: ForkKnife,
  user: User,
  coach: ChatCircleDots,
  clipboard: ClipboardText,
  survey: ListChecks,
  coffee: Coffee,
  sun: Sun,
  droplet: Drop,
  settings: GearSix,
  check: Check,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-up-right': ArrowUpRight,
  plus: Plus,
  walk: PersonSimpleWalk,
  minus: Minus,
  trash: Trash,
  swap: ArrowsLeftRight,
  image: ImageSquare,
  shield: ShieldCheck,
  home: House,
  'chevron-down': CaretDown,
  'chevron-left': CaretLeft,
  'chevron-right': CaretRight,
  star: Star,
  mail: Envelope,
  lock: Lock,
  target: Target,
  alert: WarningCircle,
  info: Info,
  sync: ArrowsClockwise,
  x: X,
  building: Buildings,
  more: DotsThree,
  moon: Moon,
  eye: Eye,
  bowl: BowlFood,
  fish: Fish,
  cheese: Cheese,
  bread: Bread,
  orange: Orange,
  carrot: Carrot,
  'cooking-pot': CookingPot,
  leaf: Leaf,
  cookie: Cookie,
  jar: Jar,
  grains: Grains,
  plant: Plant,
  bookmark: BookmarkSimple,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Kept for existing callers: heavier values pick a bolder Phosphor weight. */
  strokeWidth?: number;
  weight?: PhosphorIconProps['weight'];
  style?: StyleProp<ViewStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = '#1E293B',
  strokeWidth = 2,
  weight,
  style,
}) => {
  const Glyph = GLYPHS[name];
  if (!Glyph) return null;
  const resolved = weight ?? (strokeWidth >= 2.5 ? 'bold' : strokeWidth <= 1.5 ? 'light' : 'regular');
  return <Glyph size={size} color={color} weight={resolved} style={style} />;
};
