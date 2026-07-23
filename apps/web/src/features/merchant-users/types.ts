export type MerchantUser = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  memberships: Array<{
    role: "OWNER" | "MANAGER" | "STAFF";
    merchant: {
      id: string;
      name: string;
      slug: string;
      contactEmail: string;
      phone: string | null;
      status: "PENDING" | "ACTIVE" | "SUSPENDED";
      _count: { stores: number };
    };
  }>;
};

export type CreateMerchantUserInput = {
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  password: string;
  merchantName: string;
  merchantSlug: string;
};
