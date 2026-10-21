/** Thuật toán cipher AEAD — mirror union types của node:crypto (GCM/CCM/OCB). */
export enum CipherAlgorithm {
  AES_128_GCM = "aes-128-gcm",
  AES_192_GCM = "aes-192-gcm",
  AES_256_GCM = "aes-256-gcm",
  AES_128_CCM = "aes-128-ccm",
  AES_192_CCM = "aes-192-ccm",
  AES_256_CCM = "aes-256-ccm",
  AES_128_OCB = "aes-128-ocb",
  AES_192_OCB = "aes-192-ocb",
  AES_256_OCB = "aes-256-ocb",
}

/** Thuật toán đang dùng cho credential encryption. */
export const CIPHER_ALGORITHM = CipherAlgorithm.AES_256_GCM;
