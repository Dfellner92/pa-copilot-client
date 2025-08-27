export type RequestStatus =
  | "pending"
  | "submitted"
  | "approved"
  | "denied"
  | "error";

export type PriorAuthRequest = {
  id: string;
  memberName?: string;
  memberId?: string;
  providerName?: string;
  codes?: string[]; // e.g., ["97110","G0283"]
  status: RequestStatus;
  updatedAt: string; // ISO date
};
