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
  source: "SHARED_QR" | "TABLE_QR" | "MANUAL";
  status: OrderStatus;
  subtotal: string;
  currency: string;
  note: string | null;
  paymentMethod: "ABA" | "WING" | "BANK_TRANSFER" | "CASH" | "OTHER" | null;
  createdAt: string;
  table: { id: string; number: number; name: string | null } | null;
  items: OrderItem[];
};

export type CreateOrderInput = {
  source: "SHARED_QR" | "TABLE_QR";
  tableId?: string;
  orderToken: string;
  note?: string;
  items: Array<{
    productId: string;
    quantity: number;
    selectedOptionIds?: string[];
  }>;
};

export type CreateManualSaleInput = {
  paymentMethod: "ABA" | "WING" | "BANK_TRANSFER" | "CASH" | "OTHER";
  note?: string;
  items: Array<{ productId: string; quantity: number }>;
};
