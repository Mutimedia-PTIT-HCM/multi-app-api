/** User thu gọn kèm avatarUrl — dùng cho sender/poster trong message/event/notification. */
export interface AvatarUser {
  fullName: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
}
