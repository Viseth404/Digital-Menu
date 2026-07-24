export type Store = {
  id: string;
  name: string;
  nameKh: string | null;
  slug: string;
  description: string | null;
  descriptionKh: string | null;
  status: "ACTIVE" | "INACTIVE";
  isPublished: boolean;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  promotionEnabled: boolean;
  promotionTitle: string | null;
  promotionMessage: string | null;
  promotionImageUrl: string | null;
  primaryColor: string;
  accentColor: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
  telegramUrl: string | null;
  tiktokUrl: string | null;
  timezone: string;
  currency: string;
  exchangeRate: string;
  createdAt: string;
  updatedAt: string;
  merchant: {
    id: string;
    name: string;
    slug: string;
  };
  _count: { products: number };
};

export type UpdateStoreInput = Partial<
  Pick<
    Store,
    | "description"
    | "nameKh"
    | "descriptionKh"
    | "address"
    | "logoUrl"
    | "coverImageUrl"
    | "promotionEnabled"
    | "promotionTitle"
    | "promotionMessage"
    | "promotionImageUrl"
    | "primaryColor"
    | "accentColor"
    | "facebookUrl"
    | "instagramUrl"
    | "telegramUrl"
    | "tiktokUrl"
    | "currency"
    | "isPublished"
  >
> & { exchangeRate?: number };

export type Product = {
  id: string;
  storeId: string;
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  name: string;
  nameKh: string | null;
  description: string | null;
  descriptionKh: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  optionGroups: ProductOptionGroup[];
};

export type ProductOption = {
  id?: string;
  name: string;
  nameKh: string | null;
  priceDelta: number;
  isAvailable: boolean;
  sortOrder: number;
};

export type ProductOptionGroup = {
  id?: string;
  name: string;
  nameKh: string | null;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: ProductOption[];
};

export type ProductInput = Pick<
  Product,
  | "name"
  | "nameKh"
  | "description"
  | "descriptionKh"
  | "imageUrl"
  | "isAvailable"
  | "sortOrder"
  | "categoryId"
> & { price: number; optionGroups: ProductOptionGroup[] };

export type Category = {
  id: string;
  storeId: string;
  name: string;
  nameKh: string | null;
  description: string | null;
  descriptionKh: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
};

export type CategoryInput = Pick<
  Category,
  "name" | "nameKh" | "description" | "descriptionKh" | "isActive" | "sortOrder"
>;
