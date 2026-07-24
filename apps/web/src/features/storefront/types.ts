export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
};

export type StorefrontCategory = {
  id: string;
  name: string;
  order: number;
  products: StorefrontProduct[];
};

export type StorePromotion = {
  title: string;
  message: string;
  imageUrl: string | null;
};

export type StorefrontStore = {
  merchantSlug: string;
  storeSlug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  promotion: StorePromotion | null;
  primaryColor: string;
  accentColor: string;
  currency: string;
  exchangeRate: number;
  merchantName: string;
  socialLinks: [string, string][];
  orderingTable: {
    id: string;
    number: number;
    name: string | null;
    token: string;
  } | null;
};
