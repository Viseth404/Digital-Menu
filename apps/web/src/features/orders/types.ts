export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export const ORDER_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type DiningTable = {
  id: string;
  storeId: string;
  number: number;
  name: string | null;
  isActive: boolean;
  orderToken: string;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
};

export type OrderItem = {
  id: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  options: Array<{
    id: string;
    groupName: string;
    optionName: string;
    priceDelta: string;
  }>;
};

export type StoreOrder = {
  id: string;
  status: OrderStatus;
  subtotal: string;
  currency: string;
  note: string | null;
  createdAt: string;
  table: { id: string; number: number; name: string | null };
  items: OrderItem[];
};

export type CreateOrderInput = {
  tableId: string;
  tableToken: string;
  note?: string;
  items: Array<{
    productId: string;
    quantity: number;
    selectedOptionIds?: string[];
  }>;
};
