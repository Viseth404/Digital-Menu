export type UserRole = "ADMIN" | "MERCHANT" | "STAFF";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
