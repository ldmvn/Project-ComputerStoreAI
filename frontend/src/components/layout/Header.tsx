'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import LoginModal from './LoginModal';
import AccountDropdown from './AccountDropdown';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  LayoutDashboard,
  Sun,
  Moon,
  Menu,
  X,
  Cpu,
  ChevronDown,
  ChevronRight,
  Laptop,
  Gamepad2,
  Monitor,
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
} from 'lucide-react';

const categories = [
  { name: 'Laptop', href: '/products?category=laptop', icon: Laptop },
  { name: 'Laptop Gaming', href: '/products?category=laptop-gaming', icon: Gamepad2 },
  { name: 'PC GVN', href: '/products?category=pc-gvn', icon: Monitor },
  { name: 'Main, CPU, VGA', href: '/products?category=main-cpu-vga', icon: Cpu },
  { name: 'Case, Nguồn, Tản', href: '/products?category=case-nguon-tan', icon: Box },
  { name: 'Ổ cứng, RAM, Thẻ nhớ', href: '/products?category=o-cung-ram-the-nho', icon: HardDrive },
  { name: 'Loa, Micro, Webcam', href: '/products?category=loa-micro-webcam', icon: Speaker },
  { name: 'Màn hình', href: '/products?category=man-hinh', icon: Monitor },
  { name: 'Bàn phím', href: '/products?category=ban-phim', icon: Keyboard },
  { name: 'Chuột + Lót chuột', href: '/products?category=chuot-lot-chuot', icon: Mouse },
  { name: 'Tai Nghe', href: '/products?category=tai-nghe', icon: Headphones },
  { name: 'Ghế - Bàn', href: '/products?category=ghe-ban', icon: Armchair },
  { name: 'Phần mềm, mạng', href: '/products?category=phan-mem-mang', icon: Wifi },
  { name: 'Phụ kiện - Console', href: '/products?category=phu-kien-console', icon: Gamepad2 },
  { name: 'Thu cũ đổi mới', href: '/products?category=thu-cu-doi-moi', icon: RefreshCcw },
  { name: 'Dịch vụ và thông tin khác', href: '/products?category=dich-vu-thong-tin', icon: Wrench },
];

export default function Header() {
  const theme = useUIStore((state) => state.theme);
  const themeReady = useUIStore((state) => state.themeReady);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isHydrated && Boolean(state.token) && state.user?.role === 'ADMIN');
  const hydrateAuth = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const toggleCategories = () => {
    setCategoriesOpen((open) => !open);
    setActiveCategory(null);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      {/* ===== Top Bar ===== */}
      <div className="hidden border-b border-slate-100 bg-slate-50 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 lg:block">
        <div className="container mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <span>📞 Hotline: 0386220065</span>
            <span>✉️ luuducmanh.main@gmail.com</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/track-order" className="hover:text-primary-600">
              Theo dõi đơn hàng
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link href="/stores" className="hover:text-primary-600">
              Hệ thống cửa hàng
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Main Header ===== */}
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex min-h-16 flex-wrap items-center gap-x-1 gap-y-2 py-2 sm:gap-x-2 lg:h-20 lg:flex-nowrap lg:py-0 xl:gap-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="header-action lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Categories Dropdown - icon + label giống các action khác */}
          <div ref={categoriesRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={toggleCategories}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-red-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-red-400"
              aria-expanded={categoriesOpen}
              aria-haspopup="menu"
              aria-label="Danh mục"
            >
              {/* Icon 3 gạch, gạch giữa ngắn hơn */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="12" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span className="hidden lg:inline">Danh mục</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  categoriesOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <div
              className={`absolute left-0 top-full z-50 mt-3 flex items-stretch origin-top-left transition-all duration-200 ${
                categoriesOpen
                  ? 'visible translate-y-0 scale-100 opacity-100'
                  : 'invisible -translate-y-2 scale-95 opacity-0 pointer-events-none'
              }`}
              onMouseLeave={() => {
                setCategoriesOpen(false);
                setActiveCategory(null);
              }}
            >
              <div
                className="w-[min(280px,calc(100vw-2rem))] rounded-l-lg rounded-r-none border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950"
                role="menu"
                aria-label="Danh mục sản phẩm"
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.name;

                  return (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      role="menuitem"
                      onMouseEnter={() => setActiveCategory(cat.name)}
                      onClick={() => {
                        setCategoriesOpen(false);
                        setActiveCategory(null);
                      }}
                      className={`group flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                          : 'text-slate-700 hover:bg-red-50 hover:text-red-600 dark:text-slate-200 dark:hover:bg-red-950/30 dark:hover:text-red-400'
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors group-hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:group-hover:bg-red-950/70">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-red-600 dark:text-slate-500 dark:group-hover:text-red-400" />
                    </Link>
                  );
                })}
              </div>

              {activeCategory && (
                <div
                  className="min-h-full w-[min(760px,calc(100vw-19.5rem))] rounded-r-lg border-y border-r border-slate-200 bg-white shadow-lg shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-950"
                  aria-label={`Mega Menu ${activeCategory}`}
                />
              )}
            </div>
          </div>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo.png"
              alt="TechStore"
              width={220}
              height={95}
              quality={100}
              className="h-auto w-20 object-contain min-[360px]:w-24 lg:h-12 lg:w-auto"
              priority
            />
          </Link>

          {/* Search Wrapper - preserves the original layout space */}
          <form
            onSubmit={handleSearch}
            className="order-last flex min-w-0 basis-full items-center justify-center lg:order-none lg:flex-1 lg:basis-auto"
            role="search"
          >
            <div className="relative w-full min-w-0 lg:w-3/4 lg:max-w-[500px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm PC, Laptop, linh kiện..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-400 dark:focus:bg-slate-950"
              />
            </div>
          </form>

          {/* Action Icons */}
          <div className="ml-auto flex shrink-0 items-center gap-0 min-[360px]:gap-1 xl:gap-3">
            {/* Theme toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              disabled={!themeReady}
              onClick={toggleTheme}
              className="header-action"
              aria-label="Chuyển chế độ sáng/tối"
            >
                <span className="hidden items-center gap-1.5 dark:inline-flex">
                  <Moon className="h-5 w-5" />
                  <span className="hidden lg:inline">Dark</span>
                </span>
                <span className="inline-flex items-center gap-1.5 dark:hidden">
                  <Sun className="h-5 w-5" />
                  <span className="hidden lg:inline">Light</span>
                </span>
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="header-action"
              aria-label="Yêu thích"
              title="Yêu thích"
            >
              <Heart className="h-5 w-5" />
              <span className="hidden lg:inline">Yêu thích</span>
            </Link>

            {/* Cart with badge */}
            <Link
              href="/cart"
              className="header-action relative"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden lg:inline">Giỏ hàng</span>
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                0
              </span>
            </Link>

            {isAdmin && (
              <Link
                href="/dashboard"
                className="header-action"
                aria-label="Dashboard"
                title="Dashboard"
              >
                <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
            )}

            {/* User */}
            {user ? <AccountDropdown key={user.id} user={user} /> : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="header-action"
              aria-label="Đăng nhập"
            >
              <User className="h-5 w-5" />
              <span className="hidden max-w-32 truncate lg:inline">Đăng nhập</span>
            </button>
            )}
          </div>
        </div>

        {/* ===== Mobile Menu ===== */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 py-4 lg:hidden dark:border-slate-800">
            <div className="flex flex-col gap-1">
              <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Danh mục
              </p>
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Icon className="h-4 w-4 text-primary-600" />
                    {cat.name}
                  </Link>
                );
              })}
              <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
              {isAdmin && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                </Link>
              )}
              <Link
                href="/wishlist"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Heart className="h-4 w-4" /> Yêu thích
              </Link>
              <Link
                href="/track-order"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Theo dõi đơn hàng
              </Link>
            </div>
          </div>
        )}
      </div>
      </header>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
