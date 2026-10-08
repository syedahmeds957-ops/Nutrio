import React from 'react';
import type { IconProps as PhosphorIconProps } from 'phosphor-react-native';
// Deep imports keep the bundle to the icons actually used; the package root
// pulls in all ~1,500 of them.
import { Flame } from 'phosphor-react-native/src/icons/Flame';
import { Scales } from 'phosphor-react-native/src/icons/Scales';
import { Barbell } from 'phosphor-react-native/src/icons/Barbell';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { Camera } from 'phosphor-react-native/src/icons/Camera';
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
import { Minus } from 'phosphor-react-native/src/icons/Minus';
import { Trash } from 'phosphor-react-native/src/icons/Trash';
import { ArrowsLeftRight } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { ImageSquare } from 'phosphor-react-native/src/icons/ImageSquare';
import { ShieldCheck } from 'phosphor-react-native/src/icons/ShieldCheck';
import { House } from 'phosphor-react-native/src/icons/House';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { Star } from 'phosphor-react-native/src/icons/Star';
import { Envelope } from 'phosphor-react-native/src/icons/Envelope';
import { Lock } from 'phosphor-react-native/src/icons/Lock';
import { Target } from 'phosphor-react-native/src/icons/Target';
import { X } from 'phosphor-react-native/src/icons/X';
import { WarningCircle } from 'phosphor-react-native/src/icons/WarningCircle';
import { Info } from 'phosphor-react-native/src/icons/Info';
import { ArrowsClockwise } from 'phosphor-react-native/src/icons/ArrowsClockwise';

export type IconName =
  | 'flame'
  | 'scale'
  | 'dumbbell'
  | 'calendar'
  | 'search'
  | 'camera'
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
  | 'minus'
  | 'trash'
  | 'swap'
  | 'image'
  | 'shield'
  | 'home'
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
  | 'x';

/** Phosphor (https://phosphoricons.com) glyph behind each app icon name. */
const GLYPHS: Record<IconName, React.ComponentType<PhosphorIconProps>> = {
  flame: Flame,
  scale: Scales,
  dumbbell: Barbell,
  calendar: CalendarBlank,
  search: MagnifyingGlass,
  camera: Camera,
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
  minus: Minus,
  trash: Trash,
  swap: ArrowsLeftRight,
  image: ImageSquare,
  shield: ShieldCheck,
  home: House,
  'chevron-right': CaretRight,
  star: Star,
  mail: Envelope,
  lock: Lock,
  target: Target,
  alert: WarningCircle,
  info: Info,
  sync: ArrowsClockwise,
  x: X,
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Kept for existing callers: heavier values pick a bolder Phosphor weight. */
  strokeWidth?: number;
  weight?: PhosphorIconProps['weight'];
  style?: any;
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
