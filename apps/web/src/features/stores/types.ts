export type Store = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  description: string | null;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = Pick<
  Product,
  | "name"
  | "description"
  | "imageUrl"
  | "isAvailable"
  | "sortOrder"
  | "categoryId"
> & { price: number };

export type Category = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  _count: { products: number };
};

export type CategoryInput = Pick<
  Category,
  "name" | "description" | "isActive" | "sortOrder"
>;
