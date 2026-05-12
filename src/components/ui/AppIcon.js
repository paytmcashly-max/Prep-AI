import {
  AlertCircle,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  FileText,
  Home,
  Info,
  Lock,
  LogOut,
  Mail,
  Mic,
  Pencil,
  Play,
  RefreshCw,
  Settings,
  Share2,
  Sparkles,
  Star,
  Target,
  Timer,
  Unlock,
  Upload,
  User,
  X
} from "lucide-react-native";

import { COLORS, ICON_SIZES } from "../../theme";

const ICONS = {
  back: ChevronLeft,
  calendar: CalendarDays,
  chart: BarChart3,
  check: Check,
  close: X,
  document: FileText,
  down: ChevronDown,
  edit: Pencil,
  error: CircleAlert,
  external: ExternalLink,
  home: Home,
  info: Info,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  next: ChevronRight,
  notification: Bell,
  play: Play,
  practice: Mic,
  premium: Sparkles,
  profile: User,
  progress: BarChart3,
  refresh: RefreshCw,
  resume: FileText,
  settings: Settings,
  share: Share2,
  sparkles: Sparkles,
  star: Star,
  success: CircleCheck,
  target: Target,
  timer: Timer,
  unlock: Unlock,
  up: ChevronUp,
  upload: Upload,
  user: User,
  warning: AlertCircle
};

export default function AppIcon({
  color = COLORS.text,
  name = "info",
  size = ICON_SIZES.row,
  strokeWidth = 2.3,
  style
}) {
  const Icon = ICONS[name] || Info;

  return <Icon color={color} size={size} strokeWidth={strokeWidth} style={style} />;
}
