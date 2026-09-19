import React from 'react';
import {
  Heart,
  Coins,
  Flame,
  Volume2,
  VolumeX,
  Zap,
  Gauge,
  ArrowLeft,
  ArrowRight,
  Play,
  ChevronsRight,
  Home,
  Map as MapIcon,
  Sparkles,
  Trophy,
  Gift,
  Star,
  RotateCcw,
  Sun,
  Shield,
  ShieldAlert,
  Lock,
  Hourglass,
  Crosshair,
  Store,
  Compass,
  PartyPopper,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TreePine,
  Check,
  Award,
  Crown,
  Share2,
  HelpCircle,
  Gem,
  Swords,
  LockOpen,
  X,
  Bell,
  Lightbulb,
  Coffee,
  Skull,
  ArrowRightLeft,
  Building,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

/**
 * Mapping from legacy Material Symbol strings to reliable, bundled Lucide SVG icons.
 * This guarantees ZERO text leaks (like "favorite", "monetization_on", "cottage")
 * regardless of web font loading, ad blockers, network latency, or sandbox iframes.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  // Navigation & Core
  cottage: Home,
  home: Home,
  map: MapIcon,
  auto_awesome: Sparkles,
  emoji_events: Trophy,
  featured_seasonal_and_gifts: Gift,
  card_giftcard: Gift,
  celebration: PartyPopper,

  // Stats & Currencies
  favorite: Heart,
  monetization_on: Coins,
  local_fire_department: Flame,
  star: Star,
  stars: Sparkles,
  bolt: Zap,
  flash_on: Zap,

  // Controls & Settings
  arrow_back: ArrowLeft,
  arrow_forward: ArrowRight,
  play_arrow: Play,
  play_circle: Play,
  keyboard_double_arrow_right: ChevronsRight,
  volume_up: Volume2,
  volume_off: VolumeX,
  speed: Gauge,
  eco: Gauge,
  replay: RotateCcw,
  refresh: RefreshCw,
  sync: RefreshCw,
  lock: Lock,
  lock_open: LockOpen,
  lock_clock: Lock,
  close: X,
  hourglass_top: Hourglass,
  crisis_alert: ShieldAlert,
  warning: ShieldAlert,
  shield: Shield,
  verified_user: ShieldCheck,
  domain: Building,
  chevron_right: ChevronRight,
  chevron_down: ChevronDown,
  chevron_up: ChevronUp,
  check: Check,
  check_circle: CheckCircle2,
  done: Check,
  info: Info,
  share: Share2,
  help: HelpCircle,

  // Game Specific & Modak
  wb_sunny: Sun,
  brightness_7: Sun,
  wb_twilight: Sun,
  wb_incandescent: Lightbulb,
  notifications: Bell,
  stadium: Crown,
  local_cafe: Coffee,
  filter_vintage: Sparkles,
  skull: Skull,
  swap_calls: ArrowRightLeft,
  stat_3: Zap,
  military_tech: Award,
  leaderboard: Trophy,
  temple_hindu: Crown,
  bakery_dining: Store,
  door_front: Compass,
  forest: TreePine,
  diamond: Gem,
  flare: Sparkles,
  cyclone: Zap,
  spa: Sparkles,
  swords: Swords,
};

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  className?: string;
  size?: number | string;
  fill?: string;
}

export const AppIcon: React.FC<IconProps> = ({
  name,
  className = '',
  size = 18,
  fill,
  ...props
}) => {
  const IconComponent = ICON_MAP[name] || Sparkles;
  return (
    <IconComponent
      size={size}
      className={`shrink-0 inline-block align-middle ${className}`}
      fill={fill || 'none'}
      aria-hidden="true"
      {...props}
    />
  );
};
