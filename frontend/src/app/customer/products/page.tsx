import { Suspense } from 'react';
import ProductCatalog from '@/components/product/ProductCatalog';
export default function Page() { return <Suspense fallback={<p>Đang tải sản phẩm...</p>}><ProductCatalog /></Suspense>; }
