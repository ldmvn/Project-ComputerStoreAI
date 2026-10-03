import CustomerShell from '@/components/layout/CustomerShell';
import HomeBannerSection from '@/components/home/banner/HomeBannerSection';
import HomeProductSections from '@/components/home/product-section/HomeProductSections';

export default function HomePage() {
  return <CustomerShell contentClassName="shrink-0" fillViewport={false}><HomeBannerSection /><HomeProductSections /></CustomerShell>;
}
