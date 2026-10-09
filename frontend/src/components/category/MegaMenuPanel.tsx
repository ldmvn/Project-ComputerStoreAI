/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type { PublicMenu } from '@/services/megaMenu.service';
import { mediaUrl } from '@/services/http.client';
import type { CSSProperties } from 'react';
import styles from './MegaMenuPanel.module.css';

export function MegaMenuPanel({ menu, onNavigate }: { menu: PublicMenu; onNavigate: () => void }) {
  return <div className="flex min-h-full min-w-0 flex-1 gap-5 rounded-r-xl border border-slate-200 bg-white p-5 shadow-lg" aria-label={`Mega Menu ${menu.category.name}`}>
    <div className="grid min-w-0 flex-1 content-start grid-cols-2 gap-5 xl:grid-cols-4">
      {menu.groups.map(group => <section key={group.id} className={`min-w-0 ${styles.group}`} style={{ '--span': group.columnSpan, '--compact-span': Math.min(group.columnSpan, 2) } as CSSProperties} data-column-span={group.columnSpan}>
        <h3 className="mb-2 break-words text-sm font-semibold text-primary-700">{group.title}</h3>
        <ul className="space-y-1">{group.items.map(item => <li key={item.id}><Link href={item.href} onClick={onNavigate} className="block break-words rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700">{item.label}</Link></li>)}</ul>
      </section>)}
      {!menu.groups.length && menu.category.children.map(child => <Link key={child.id} href={`/customer/products?category=${encodeURIComponent(child.slug)}`} onClick={onNavigate} className="rounded-md p-2 text-sm hover:bg-primary-50">{child.name}</Link>)}
      {!menu.groups.length && !menu.category.children.length && <Link className="text-sm text-primary-700" href={menu.category.href} onClick={onNavigate}>Xem sản phẩm {menu.category.name}</Link>}
    </div>
    {menu.brands.length > 0 && <aside className="w-28 shrink-0 border-l border-slate-100 pl-4 xl:w-36" aria-label="Thương hiệu nổi bật"><h3 className="mb-3 text-xs font-semibold text-slate-500">Thương hiệu nổi bật</h3><div className="space-y-3">{menu.brands.map(brand => <Link key={brand.id} href={brand.href} onClick={onNavigate} title={brand.name} className="flex min-h-14 items-center justify-center rounded-lg border border-slate-200 p-2 hover:border-primary-400">{brand.logoUrl ? <img src={mediaUrl(brand.logoUrl)} alt={brand.name} className="h-10 w-full object-contain" /> : <span className="text-sm font-semibold text-slate-600">{brand.name}</span>}</Link>)}</div></aside>}
  </div>;
}
export function MobileMenuGroups({ menu, onNavigate }: { menu: PublicMenu; onNavigate: () => void }) {
  return <div className="ml-5 border-l border-slate-200 py-2 pl-3">
    <Link href={menu.category.href} onClick={onNavigate} className="block py-2 text-sm font-medium text-primary-700">Xem tất cả {menu.category.name}</Link>
    {menu.groups.map(group => <details key={group.id} className="mb-1 rounded-lg bg-slate-50"><summary className="cursor-pointer px-3 py-3 text-sm font-semibold text-slate-700">{group.title}</summary><ul className="px-3 pb-2">{group.items.map(item => <li key={item.id}><Link href={item.href} onClick={onNavigate} className="block break-words py-2 text-sm text-slate-600 hover:text-primary-600">{item.label}</Link></li>)}</ul></details>)}
    {!menu.groups.length && menu.category.children.map(child => <Link key={child.id} href={`/customer/products?category=${encodeURIComponent(child.slug)}`} onClick={onNavigate} className="block py-2 text-sm text-slate-600">{child.name}</Link>)}
    {menu.brands.length > 0 && <details><summary className="cursor-pointer py-3 text-sm font-semibold">Thương hiệu nổi bật</summary>{menu.brands.map(brand => <Link key={brand.id} href={brand.href} onClick={onNavigate} className="block py-2 text-sm text-slate-600">{brand.name}</Link>)}</details>}
  </div>;
}
