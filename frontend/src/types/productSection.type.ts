import type { ProductHighlightSpec, ProductSpecification } from './product.type';

export type SectionProduct = {
  slug?: string;
  sku?: string;
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  isActive?: boolean;
  stockQuantity?: number;
  specifications?: ProductSpecification[];
  highlightSpecs?: ProductHighlightSpec[];
  primaryImage?: string | null;
  sortOrder?: number;
};

export type ProductSection = {
  id: number;
  name: string;
  slug: string;
  subtitle: string | null;
  viewAllUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  showHighlightSpecs: boolean;
  createdAt: string;
  updatedAt: string;
  products: SectionProduct[];
};

export type ProductSectionInput = {
  name: string;
  slug: string;
  subtitle: string;
  viewAllUrl: string;
  sortOrder: number;
  isActive: boolean;
  showHighlightSpecs: boolean;
};
