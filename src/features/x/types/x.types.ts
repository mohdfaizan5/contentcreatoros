import { XAccount, XAccountRole } from "@/shared/types/database";

export type XTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export type XApiError = {
  detail?: string;
  errors?: Array<{ detail?: string; message?: string }>;
  message?: string;
  title?: string;
};

export  type PendingXOAuthAttempt = {
  codeVerifier: string;
  createdAt: string;
  role: XAccountRole | null;
};

export type StoredXAccount = XAccount;
