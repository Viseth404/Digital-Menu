export type MerchantStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type StoreStatus = "ACTIVE" | "INACTIVE";
export type MembershipRole = "OWNER" | "MANAGER" | "STAFF";

export type SupportUser = {
  membershipId: string;
  id: string;
  name: string;
  email: string;
  role: MembershipRole;
  isActive: boolean;
};

export type SupportStore = {
  id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  isPublished: boolean;
  currency: string;
  updatedAt: string;
  counts: {
    products: number;
    categories: number;
    tables: number;
    orders: number;
    activeOrders: number;
  };
  diagnostics: string[];
};

export type SupportMerchant = {
  id: string;
  name: string;
  slug: string;
  status: MerchantStatus;
  contactEmail: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  users: SupportUser[];
  stores: SupportStore[];
  diagnostics: string[];
};
