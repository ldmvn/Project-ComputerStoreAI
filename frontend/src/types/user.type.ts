export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isActive?: boolean;
};
