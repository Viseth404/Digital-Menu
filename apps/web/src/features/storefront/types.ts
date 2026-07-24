export type StorefrontProduct = {
  id: string;
  name: string;
  nameKh: string | null;
  description: string | null;
  descriptionKh: string | null;
  price: string;
  imageUrl: string | null;
  optionGroups: StorefrontOptionGroup[];
};

export type StorefrontCategory = {
  id: string;
  name: string;
  nameKh: string | null;
  order: number;
  products: StorefrontProduct[];
};

export type StorefrontOptionGroup = {
  id: string;
  name: string;
  nameKh: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: Array<{
    id: string;
    name: string;
    nameKh: string | null;
    priceDelta: string;
  }>;
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
  nameKh: string | null;
  description: string | null;
  descriptionKh: string | null;
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
