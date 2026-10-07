import type { LucideIcon } from 'lucide-react';
import {
  Badge,
  Check,
  ClipboardList,
  CreditCard,
  History,
  Image,
  KeyRound,
  Layers,
  LayoutDashboard,
  Package,
  PanelTop,
  Settings,
  Settings2,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Store,
  Tag,
  TicketPercent,
  Truck,
  Undo2,
  Users,
  Warehouse,
  Wrench,
} from 'lucide-react';

export type DashboardMenuItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export type DashboardMenuGroup = {
  label: string;
  icon: LucideIcon;
  children: DashboardMenuItem[];
};

export const dashboardOverview = {
  label: 'Tổng quan',
  path: '/admin/dashboard',
  icon: LayoutDashboard,
};

export const dashboardMenu: DashboardMenuGroup[] = [
  {
    label: 'Cửa hàng',
    icon: Store,
    children: [
      { label: 'Sản phẩm', path: '/admin/products', icon: Package },
      { label: 'Danh mục', path: '/admin/categories', icon: Layers },
      { label: 'Thương hiệu', path: '/admin/brands', icon: Badge },
      { label: 'Thuộc tính', path: '/admin/attributes', icon: SlidersHorizontal },
      { label: 'Mega Menu', path: '/admin/mega-menu', icon: PanelTop },
      { label: 'Kho', path: '/admin/inventory', icon: Warehouse },
      { label: 'Quản lý Banner', path: '/admin/banners', icon: Image },
      { label: 'Khối sản phẩm', path: '/admin/product-sections', icon: PanelTop },
      { label: 'Khuyến mãi', path: '/admin/promotions', icon: TicketPercent },
    ],
  },
  {
    label: 'Bán hàng',
    icon: ShoppingCart,
    children: [
      { label: 'Đơn hàng', path: '/admin/orders', icon: ClipboardList },
      { label: 'Khách hàng', path: '/admin/customers', icon: Users },
      { label: 'Thanh toán', path: '/admin/payments', icon: CreditCard },
      { label: 'Vận chuyển', path: '/admin/shipping', icon: Truck },
      { label: 'Đổi trả', path: '/admin/returns', icon: Undo2 },
      { label: 'Đánh giá', path: '/admin/reviews', icon: Star },
    ],
  },
  {
    label: 'Hệ thống',
    icon: Settings2,
    children: [
      { label: 'Build PC', path: '/admin/build-pc', icon: Wrench },
      { label: 'Quản trị viên', path: '/admin/admin-users', icon: ShieldCheck },
      { label: 'Phân quyền', path: '/admin/roles', icon: KeyRound },
      { label: 'Nhật ký hoạt động', path: '/admin/activity-logs', icon: History },
    ],
  },
  {
    label: 'Cài đặt',
    icon: Settings,
    children: [
      { label: 'Thông tin cửa hàng', path: '/admin/settings/store', icon: Store },
      { label: 'Logo / Favicon', path: '/admin/settings/branding', icon: Image },
      { label: 'Email / Hotline', path: '/admin/settings/contact', icon: CreditCard },
      { label: 'Cấu hình chung', path: '/admin/settings/general', icon: Check },
    ],
  },
];

export const dashboardMenuItems = [
  dashboardOverview,
  ...dashboardMenu.flatMap((group) => group.children),
];
