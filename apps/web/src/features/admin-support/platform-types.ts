export type PlatformOverview = {
  merchants: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
  };
  stores: { total: number; published: number; inactive: number };
  users: { total: number; active: number; disabled: number };
  orders: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    revenueByCurrency: Array<{ currency: string; value: number }>;
  };
  trend: Array<{ date: string; orders: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetName: string | null;
    adminName: string;
    createdAt: string;
  }>;
};

export type AdminOrder = {
  id: string;
  status: string;
  subtotal: string;
  currency: string;
  note: string | null;
  createdAt: string;
  store: {
    id: string;
    name: string;
    merchant: { id: string; name: string };
  };
  table: { number: number };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    lineTotal: string;
  }>;
};

export type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  targetName: string | null;
  details: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: { name: string; email: string };
};

export type SystemHealth = {
  status: "healthy" | "warning";
  database: { connected: boolean; latencyMs: number; schemaReady: boolean };
  storage: {
    uploadFiles: number;
    uploadBytes: number;
    referencedFiles: number;
    orphanedFiles: string[];
    orphanedBytes: number;
    missingFiles: string[];
  };
  data: {
    merchantsWithoutOwners: number;
    storesWithoutProducts: number;
    storesWithoutTables: number;
    staleActiveOrders: number;
  };
  backup: {
    configured: boolean;
    message: string;
  };
  settings: {
    maintenanceMode: boolean;
    announcement: string | null;
    supportEmail: string;
    defaultCurrency: string;
    uploadLimitMb: number;
    sessionDurationDays: number;
    updatedAt: string;
  };
  version: string;
  checkedAt: string;
};
