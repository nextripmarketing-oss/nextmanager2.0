export type UserRole = "Admin" | "Marketing Manager" | "Accountant" | "Staff" | "Agent";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  allowedTabs?: string[];
  mappedAgentName?: string;
  branch?: "nextrip" | "diabari" | "all";
}
