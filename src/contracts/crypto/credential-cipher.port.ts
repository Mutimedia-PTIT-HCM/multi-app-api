/** Port mã hoá credential (AES-256-GCM). */
export interface ICredentialCipher {
  encrypt(plain: string): string;
  decrypt(payload: string): string;
}
