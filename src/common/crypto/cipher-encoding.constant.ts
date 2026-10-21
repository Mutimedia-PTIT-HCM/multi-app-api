/** Encoding serialize payload. */
export enum CipherEncoding {
  BASE64 = "base64",
  HEX = "hex",
  UTF8 = "utf8",
}

export const CIPHER_BINARY_ENCODING = CipherEncoding.BASE64;
export const CIPHER_TEXT_ENCODING = CipherEncoding.UTF8;
