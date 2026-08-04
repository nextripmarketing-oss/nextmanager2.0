export interface Agency {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  remarks?: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PassportDirection = "ReceivedFromAgency" | "DeliveredToAgency";

export interface PassportLog {
  id?: string;
  agencyId: string;
  agencyName: string;
  direction: PassportDirection;
  passportCount: number;
  description: string; // lists passport numbers / passenger names
  date: string; // YYYY-MM-DD
  remarks?: string;
  createdByUid: string;
  createdByEmail: string;
  createdAt?: string;
}
