'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Send,
  Shield,
  Truck,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { useState } from 'react';

const aboutLinks = [
  { label: 'Giới thiệu DUCMANH PC', href: '/about' },
  { label: 'Hệ thống cửa hàng', href: '/stores' },
  { label: 'Tin tức công nghệ', href: '/blog' },
  { label: 'Tuyển dụng', href: '/careers' },
  { label: 'Liên hệ hợp tác', href: '/partner' },
];

const supportLinks = [
  { label: 'Hỏi đáp (FAQs)', href: '/faq' },
  { label: 'Hướng dẫn mua hàng', href: '/guide' },
  { label: 'Vận chuyển & Giao nhận', href: '/shipping' },
  { label: 'Đổi trả & Hoàn tiền', href: '/returns' },
  { label: 'Hỗ trợ kỹ thuật', href: '/support' },
];

const policyLinks = [
  { label: 'Chính sách bảo hành', href: '/policy/warranty' },
  { label: 'Chính sách đổi trả', href: '/policy/return' },
  { label: 'Chính sách bảo mật', href: '/policy/privacy' },
  { label: 'Điều khoản sử dụng', href: '/policy/terms' },
  { label: 'Chính sách thanh toán', href: '/policy/payment' },
];

const trustBadges = [
  { icon: Shield, label: 'Bảo hành chính hãng' },
  { icon: Truck, label: 'Giao hàng toàn quốc' },
  { icon: RotateCcw, label: 'Đổi trả 30 ngày' },
  { icon: CreditCard, label: 'Thanh toán an toàn' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // TODO: Gọi API subscribe khi backend ready
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      {/* ===== Trust Badges ===== */}
      <div className="border-b border-slate-200">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Main Footer Content ===== */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* === Cột 1: Liên hệ === */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="DUCMANH PC"
                width={220}
                height={95}
                quality={100}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="mb-4 text-sm text-slate-600">
              Cửa hàng PC & Laptop chính hãng, uy tín hàng đầu Việt Nam. Hơn 10 năm kinh nghiệm trong lĩnh vực công nghệ.
            </p>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <span> 5 Lê Duẩn, Phường Xuân Hòa, Tình Phú Thọ</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary-600" />
                <a href="tel:19006868" className="ui-link hover:text-primary-600">
                  0386220065
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary-600" />
                <a href="luuducmanh.main@gmail.com" className="ui-link hover:text-primary-600">
                  luuducmanh.main@gmail.com
                </a>
              </li>
            </ul>

            {/* Social */}
            <div className="mt-5 flex items-center gap-2">
              <a
                href="#"
                className="ui-icon-link flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-primary-600 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="ui-icon-link flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-primary-600 hover:text-white"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="ui-icon-link flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-primary-600 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="ui-icon-link flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-600 transition hover:bg-primary-600 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* === Cột 2: Giới thiệu === */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Giới thiệu
            </h3>
            <ul className="space-y-3">
              {aboutLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="ui-link text-sm text-slate-600 transition hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* === Cột 3: Hỗ trợ khách hàng === */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="ui-link text-sm text-slate-600 transition hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* === Cột 4: Chính sách === */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Chính sách chung
            </h3>
            <ul className="space-y-3">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="ui-link text-sm text-slate-600 transition hover:text-primary-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* === Cột 5: Newsletter === */}
          <div className="lg:col-span-1">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Khuyến mãi & Tin tức
            </h3>
            <p className="mb-4 text-sm text-slate-600">
              Đăng ký để nhận ngay <strong className="text-primary-600">voucher giảm 10%</strong> cho đơn hàng đầu tiên và cập nhật các chương trình khuyến mãi hấp dẫn.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <button
                type="submit"
                className="ui-button ui-button--primary flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <Send className="h-4 w-4" />
                Đăng ký ngay
              </button>
              {subscribed && (
                <p className="text-xs text-green-600">
                  ✓ Đăng ký thành công! Kiểm tra email của bạn.
                </p>
              )}
            </form>

            {/* Payment methods */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Chấp nhận thanh toán
              </p>
              <div className="flex flex-wrap gap-2">
                {['VISA', 'Master', 'Momo', 'VNPay', 'COD'].map((method) => (
                  <span
                    key={method}
                    className="inline-flex h-7 items-center rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Copyright ===== */}
      <div className="border-t border-slate-200 bg-white py-5">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 text-center text-xs text-slate-500 md:flex-row md:text-left">
          <p>
            © 2026 <strong className="text-slate-700">DUCMANH PC</strong>.
            ldm. All rights reserved.
          </p>
          <p>
            Được xây dựng bởi <span className="text-red-500">♥</span> Lưu Đức Mạnh
          </p>
        </div>
      </div>
    </footer>
  );
}