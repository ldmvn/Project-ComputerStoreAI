export type AddressType = 'HOME' | 'OFFICE';

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  communeCode: string;
  communeName: string;
  streetAddress: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  fullName: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  communeCode: string;
  communeName: string;
  streetAddress: string;
  addressType: AddressType;
  isDefault: boolean;
}

export interface Province {
  code: string;
  name: string;
}

export interface Commune {
  code: string;
  name: string;
  provinceCode: string;
}
