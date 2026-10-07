import type { ProductSpecification } from '@/types/product.type';

export const formatProductPrice = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
export const productDetailHref = (slug: string) => `/products/${encodeURIComponent(slug)}`;

export function specificationPriority(name: string) {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd');
  const priorities = [
    /\b(cpu|processor|bo xu ly|vi xu ly)\b/,
    /\b(mainboard|motherboard|main|bo mach chu)\b/,
    /\b(ram|memory|bo nho)\b/,
    /\b(ssd|storage|hard drive|o cung|luu tru)\b/,
    /\b(gpu|graphics|vga|card do hoa)\b/,
    /\b(psu|power supply|nguon)\b/,
    /\b(display|screen|man hinh)\b/,
  ];
  const priority = priorities.findIndex(pattern => pattern.test(normalized));
  return priority < 0 ? priorities.length : priority;
}

export function highlightedSpecifications(specifications: ProductSpecification[] = [], limit = 6) {
  return specifications.filter(spec => spec.name.trim() && spec.value.trim())
    .sort((a, b) => specificationPriority(a.name) - specificationPriority(b.name))
    .slice(0, limit);
}
