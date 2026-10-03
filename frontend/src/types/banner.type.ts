export type BannerGroup = 'MAIN' | 'SIDE';
export type BannerPosition = 'MAIN_HERO' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT' | 'SIDE_LEFT' | 'SIDE_RIGHT_TOP' | 'SIDE_RIGHT_MIDDLE' | 'SIDE_RIGHT_BOTTOM';
export type BannerPositionSelection = BannerPosition | 'AUTO';
export type MediaType = 'IMAGE' | 'VIDEO';

export type Banner = {
  id: number;
  name: string;
  group: BannerGroup;
  position: BannerPosition;
  mediaType: MediaType;
  mediaUrl: string;
  targetUrl: string | null;
  altText: string;
  sortOrder: number;
  autoplayInterval: number;
  isActive: boolean;
  isAutoPlaced?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HomeBanners = {
  sideSlides?: Partial<Record<BannerPosition, Banner[]>>;
  mainHero: Banner[];
  bottomLeft: Banner | null;
  bottomRight: Banner | null;
  sideLeft: Banner | null;
  sideRightTop: Banner | null;
  sideRightMiddle: Banner | null;
  sideRightBottom: Banner | null;
};
