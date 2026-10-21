import type { Student } from "@prisma/client";

/** Student trả ra API — đã loại field nhạy cảm (otp, fcmToken, UIS tokens) + thêm avatarUrl. */
export type PublicStudent = Omit<
  Student,
  "otp" | "fcmToken" | "uisAccessToken" | "uisRefreshToken" | "uisTokenExpiresAt"
> & { avatarUrl: string | null };
