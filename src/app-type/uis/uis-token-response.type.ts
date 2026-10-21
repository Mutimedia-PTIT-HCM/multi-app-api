/** Response OAuth token của UIS (`/auth/login`, `/auth/refresh`). */
export interface UisTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number | string;
}
