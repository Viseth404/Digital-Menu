export type AnalyticsRange = 7 | 30;

export type StoreAnalytics = {
  store: {
    id: string;
    name: string;
    currency: string;
    isPublished: boolean;
    productCount: number;
    categoryCount: number;
    tableCount: number;
  };
  summary: {
    revenue: number;
    todayRevenue: number;
    completedOrders: number;
    totalOrders: number;
    activeOrders: number;
    averageOrder: number;
  };
  trend: Array<{ date: string; revenue: number; orders: number }>;
  statuses: Array<{ status: string; count: number }>;
  topItems: Array<{ name: string; quantity: number; revenue: number }>;
  recentOrders: Array<{
    id: string;
    tableNumber: number;
    status: string;
    total: number;
    createdAt: string;
  }>;
};
