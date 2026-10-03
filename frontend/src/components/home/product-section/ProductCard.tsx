/* eslint-disable @next/next/no-img-element */

import { Cpu, Gift, PackageOpen } from 'lucide-react';
import type { SectionProduct } from '@/types/productSection.type';
import type { Product } from '@/types/product.type';
import { mediaUrl } from '@/services/http.client';
import styles from './HomeProductSections.module.css';

type CardProduct = SectionProduct & Partial<Pick<Product, 'images'>> & {
  promotion?: string | null;
};

const formatPrice = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

function specificationPriority(name: string) {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd');
  const priorities = [
    /\b(cpu|processor|bo xu ly|vi xu ly)\b/,
    /\b(mainboard|motherboard|main|bo mach chu)\b/,
    /\b(ram|memory|bo nho)\b/,
    /\b(ssd|storage|hard drive|o cung|luu tru)\b/,
    /\b(gpu|graphics|vga|card do hoa)\b/,
  ];
  const priority = priorities.findIndex(pattern => pattern.test(normalized));
  return priority < 0 ? priorities.length : priority;
}

export default function ProductCard({ product }: { product: CardProduct }) {
  const specifications = product.specifications
    ?.filter(spec => spec.value.trim())
    .sort((first, second) => specificationPriority(first.name) - specificationPriority(second.name))
    .slice(0, 5) ?? [];
  const originalPrice = product.originalPrice;
  const discounted = typeof originalPrice === 'number' && originalPrice > product.price && product.price >= 0;
  const discount = discounted ? Math.round((originalPrice - product.price) / originalPrice * 100) : 0;
  const image = product.primaryImage || product.images?.find(item => item.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl;

  return (
    <article className={`${styles.card} ${styles.productCard} ${specifications.length ? styles.withSpecifications : ''}`}>
      <div className={styles.productImage}>
        {discounted && <span className={styles.discountBadge}>Giảm {discount}%</span>}
        {image ? (
          <img src={mediaUrl(image)} alt={product.name} loading="lazy" decoding="async" />
        ) : <PackageOpen size={40} aria-hidden="true" />}
      </div>
      <div className={styles.productContent}>
        <h3 className={styles.productName} title={product.name}>{product.name}</h3>
        {specifications.length > 0 && (
          <ul className={styles.specifications} aria-label="Thông số nổi bật">
            {specifications.map((spec, index) => (
              <li key={spec.id ?? `${spec.name}-${index}`} title={`${spec.name}: ${spec.value}`}>
                <Cpu size={14} aria-hidden="true" />
                <span><span className="sr-only">{spec.name}: </span>{spec.value}</span>
              </li>
            ))}
          </ul>
        )}
        <div className={styles.pricing}>
          {discounted && (
            <div className={styles.originalPrice}>
              <span className="sr-only">Giá gốc </span><del>{formatPrice(originalPrice)}</del>
              <span className={styles.discountPercent}>-{discount}%</span>
            </div>
          )}
          <p className={styles.price}><span className="sr-only">Giá bán </span>{formatPrice(product.price)}</p>
        </div>
        {product.promotion?.trim() && (
          <div className={styles.promotion}>
            <Gift size={15} aria-hidden="true" /><p title={product.promotion}>{product.promotion}</p>
          </div>
        )}
      </div>
    </article>
  );
}
