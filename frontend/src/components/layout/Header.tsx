'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import LoginModal from './LoginModal';
import AccountDropdown from './AccountDropdown';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { getCategoryIcon } from '@/components/category/CategoryIcon';
import { getPublicCategories, type PublicCategory } from '@/services/category.service';
import { getPublicMenus, type PublicMenu } from '@/services/megaMenu.service';
import { MegaMenuPanel, MobileMenuGroups } from '@/components/category/MegaMenuPanel';

export default function Header() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [menus, setMenus] = useState<PublicMenu[]>([]);
  const [menuError, setMenuError] = useState('');
  const [menuLoading, setMenuLoading] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isHydrated && Boolean(state.token) && state.user?.role === 'ADMIN');
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const cartCount = useCartStore(state => state.items.reduce((count, item) => count + item.quantity, 0));
  const hydrateCart = useCartStore(state => state.hydrate);
  useEffect(() => { hydrateCart(); }, [hydrateCart]);

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    const controller = new AbortController();
    getPublicCategories(controller.signal)
      .then(result => setCategories(result.categories))
      .catch(() => { if (!controller.signal.aborted) setCategories([]); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!categoriesOpen && !mobileMenuOpen) return;
    let cancelled = false;
    setMenuLoading(true);
    getPublicMenus().then(data => { if (!cancelled) { setMenus(data); setCategories(data.map(menu => menu.category)); setMenuError(''); } }).catch(() => { if (!cancelled) setMenuError('Không tải được Mega Menu. Vui lòng mở lại menu để thử lại.'); }).finally(() => { if (!cancelled) setMenuLoading(false); });
    return () => { cancelled = true; };
  }, [categoriesOpen, mobileMenuOpen]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => { drawerRef.current?.toggleAttribute('inert', !mobileMenuOpen); }, [mobileMenuOpen]);
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); };
  const scheduleClose = () => { cancelClose(); closeTimer.current = setTimeout(() => { setCategoriesOpen(false); setActiveCategory(null); }, 150); };
  const closeCategories = () => { setCategoriesOpen(false); setActiveCategory(null); };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href],button,summary,[tabindex="0"]') || []).filter(e => e.getClientRects().length);
    focusable()[0]?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
      if (event.key === 'Tab') {
        const items = focusable(); const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/customer/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const toggleCategories = () => {
    setCategoriesOpen(true);
    setActiveCategory(null);
  };

  const categoryHref = (slug: string) => `/customer/products?category=${encodeURIComponent(slug)}`;

  return (
    <>
      <header className="site-header sticky top-0 z-50 border-b backdrop-blur-md">
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
          <div ref={categoriesRef} className="relative hidden lg:block" onMouseEnter={() => { cancelClose(); setCategoriesOpen(true); }} onMouseLeave={scheduleClose} onKeyDown={event => { if (event.key === 'Escape') { closeCategories(); categoriesRef.current?.querySelector('button')?.focus(); } }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) closeCategories(); }}>
            <button
              type="button"
              onClick={toggleCategories}
              className="ui-header-action inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-white transition hover:bg-white/15 hover:text-white"
              aria-expanded={categoriesOpen}
              aria-controls="desktop-category-menu"
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
              id="desktop-category-menu"
              className={`absolute left-0 top-full z-50 flex max-h-[calc(100dvh-100px)] w-[min(1200px,calc(100vw-2rem))] items-stretch overflow-y-auto pt-3 origin-top-left transition-all duration-200 ${
                categoriesOpen
                  ? 'visible translate-y-0 scale-100 opacity-100'
                  : 'invisible -translate-y-2 scale-95 opacity-0 pointer-events-none'
              }`}
              onMouseEnter={cancelClose}
            >
              <div
                className="w-[min(280px,calc(100vw-2rem))] shrink-0 rounded-l-lg rounded-r-none border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-900/10 backdrop-blur-md"
                role="menu"
                aria-label="Danh mục sản phẩm"
              >
                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.icon);
                  const isActive = activeCategory === cat.id;

                  return (
                    <Link
                      key={cat.id}
                      href={categoryHref(cat.slug)}
                      role="menuitem"
                      onMouseEnter={() => setActiveCategory(cat.id)}
                      onFocus={() => setActiveCategory(cat.id)}
                      onClick={() => {
                        setCategoriesOpen(false);
                        setActiveCategory(null);
                      }}
                      className={`ui-menu-item ui-category-item group flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-red-50 text-red-600'
                          : 'text-slate-700 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors group-hover:bg-red-100">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:text-red-600" />
                    </Link>
                  );
                })}
              </div>

              {menuLoading && !menus.length && <p role="status" className="p-5 text-sm text-slate-500">Đang tải Mega Menu...</p>}
              {menuError && <p role="alert" className="p-5 text-sm text-red-600">{menuError}</p>}
              {(() => {
                const selected = menus.find(menu => menu.category.id === (activeCategory ?? categories[0]?.id));
                return selected ? <MegaMenuPanel menu={selected} onNavigate={closeCategories} /> : null;
              })()}
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
            <div className="ui-search relative w-full min-w-0 lg:w-3/4 lg:max-w-[500px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm PC, Laptop, linh kiện..."
                className="w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition focus:bg-white focus:outline-none"
              />
            </div>
          </form>

          {/* Action Icons */}
          <div className="ml-auto flex shrink-0 items-center gap-0 min-[360px]:gap-1 xl:gap-3">
            {/* Build PC */}
            <Link
              href="/customer/build-pc"
              className="header-action"
              aria-label="Build PC"
              title="Build PC"
            >
              <Wrench className="h-5 w-5" />
              <span className="hidden lg:inline">Build PC</span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/customer/wishlist"
              className="header-action"
              aria-label="Yêu thích"
              title="Yêu thích"
            >
              <Heart className="h-5 w-5" />
              <span className="hidden lg:inline">Yêu thích</span>
            </Link>

            {/* Cart with badge */}
            <Link
              href="/customer/cart"
              className="header-action relative"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden lg:inline">Giỏ hàng</span>
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-600 shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="header-action"
                aria-label="Dashboard"
                title="Dashboard"
              >
                <Settings className="h-5 w-5" aria-hidden="true" />
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
      </div>
      </header>

      {/* ===== Mobile Menu ===== */}
        {mobileMenuOpen && (
          <button
            type="button"
            className="fixed left-0 top-0 z-[60] h-[100dvh] w-screen bg-slate-900/35 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu danh mục"
          />
        )}
        <aside
          ref={drawerRef}
          className={`fixed left-0 top-0 z-[70] flex h-[100dvh] w-[min(82vw,340px)] flex-col bg-white text-slate-800 shadow-2xl shadow-slate-900/20 transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Danh mục sản phẩm"
          aria-hidden={!mobileMenuOpen}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex min-w-0 items-center">
              <Image src="/logo.png" alt="DUCMANH PC" width={132} height={57} className="h-10 w-auto max-w-36 object-contain object-left" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="ui-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-orange-50 hover:text-orange-600"
              aria-label="Đóng menu danh mục"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Danh mục</p>
            <nav className="space-y-1" aria-label="Danh sách danh mục">
              {menuLoading && <p role="status" className="px-3 text-sm">Đang tải Mega Menu...</p>}
              {menuError && <p role="alert" className="px-3 text-sm text-red-600">{menuError}</p>}
              {categories.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Chưa có danh mục.</p>}
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.icon);
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-1">
                      <Link href={categoryHref(cat.slug)} onClick={() => setMobileMenuOpen(false)} className="ui-menu-item ui-category-item flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-orange-50 hover:text-orange-600">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                        <span className="min-w-0 truncate">{cat.name}</span>
                      </Link>
                      {(cat.children.length > 0 || menus.some(menu => menu.category.id === cat.id && (menu.groups.length > 0 || menu.brands.length > 0))) && <button type="button" aria-label={`${expandedMobileCategory === cat.id ? 'Thu gọn' : 'Mở'} ${cat.name}`} aria-expanded={expandedMobileCategory === cat.id} onClick={() => setExpandedMobileCategory(current => current === cat.id ? null : cat.id)} className="ui-button flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-orange-50 hover:text-orange-600"><ChevronDown className={`h-4 w-4 transition-transform ${expandedMobileCategory === cat.id ? 'rotate-180' : ''}`} aria-hidden="true" /></button>}
                    </div>
                    {expandedMobileCategory === cat.id && (() => {
                      const selected = menus.find(menu => menu.category.id === cat.id);
                      return selected ? <MobileMenuGroups menu={selected} onNavigate={() => setMobileMenuOpen(false)} /> : <div className="ml-11 border-l py-1 pl-3">{cat.children.map(child => <Link key={child.id} href={categoryHref(child.slug)} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm">{child.name}</Link>)}</div>;
                    })()}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
