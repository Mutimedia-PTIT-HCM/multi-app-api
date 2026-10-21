/** Token trả về từ OAuth grant (login hoặc refresh). */
export interface UisTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date; // access token hết hạn (~8h từ lúc cấp)
}
