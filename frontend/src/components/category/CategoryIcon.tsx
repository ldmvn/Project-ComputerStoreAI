import {
  Armchair,
  Box,
  Cpu,
  Database,
  FolderTree,
  Gamepad2,
  HardDrive,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mouse,
  Package,
  RefreshCcw,
  Speaker,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export const categoryIconOptions: Record<string, LucideIcon> = {
  Laptop,
  Gamepad2,
  Monitor,
  Cpu,
  Box,
  HardDrive,
  Speaker,
  Keyboard,
  Mouse,
  Headphones,
  Armchair,
  Wifi,
  RefreshCcw,
  Wrench,
  Database,
  Package,
  FolderTree,
};

export function getCategoryIcon(name?: string | null): LucideIcon {
  return name ? categoryIconOptions[name] || FolderTree : FolderTree;
}

export default function CategoryIcon({ name, className = 'h-4 w-4' }: { name?: string | null; className?: string }) {
  const Icon = getCategoryIcon(name);
  return <Icon className={className} aria-hidden="true" />;
}