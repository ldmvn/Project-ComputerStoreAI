export type ProductImage = { id: number; imageUrl: string; altText: string; sortOrder: number; isPrimary: boolean };
export type ProductSpecification = { id?: number; name: string; value: string; sortOrder?: number };
export type ProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type Product = {
  id: number;
  name: string;
  slug: string;
  sku: string;
  category: string | null;
  categoryId: number | null;
  brand: string | null;
  shortDescription: string | null;
  description?: string | null;
  price: number;
  originalPrice: number | null;
  costPrice?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  isDeleted: boolean;
  stockStatus: ProductStockStatus;
  primaryImage: string | null;
  images?: ProductImage[];
  specifications?: ProductSpecification[];
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  products: Product[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  stats: { total: number; active: number; outOfStock: number; inactive: number };
};
