/** Seller thu gọn trong Product — list chỉ có fullName, detail thêm avatarUrl. */
export interface ProductSeller {
  fullName: string | null;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}
