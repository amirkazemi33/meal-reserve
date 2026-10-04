import {
  CalendarDays,
  ChefHat,
  ClipboardList,
  Clock3,
  History,
  List,
  MapPin,
  MessageSquareText,
  MessagesSquare,
  Salad,
  Settings,
  Shield,
  UserRoundPlus,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "/menu": UtensilsCrossed,
  "/history": History,
  "/feedback": MessageSquareText,
  "/cooking-report": ChefHat,
  "/admin/meal-periods": Clock3,
  "/admin/foods": Salad,
  "/admin/delivery-locations": MapPin,
  "/admin/menu": CalendarDays,
  "/admin/users": Users,
  "/admin/user-lists": List,
  "/admin/roles": Shield,
  "/admin/reports": ClipboardList,
  "/admin/feedback": MessagesSquare,
  "/admin/reserve-for": UserRoundPlus,
  "/admin/settings": Settings,
};

export function NavIcon({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const Icon = ICONS[href] ?? UtensilsCrossed;
  return <Icon className={className} aria-hidden />;
}
