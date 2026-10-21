import { NotificationAttachment } from "./notification-attachment.type";
import { NotificationPoster } from "./notification-poster.type";

/** 1 thông báo trong danh sách của sinh viên. */
export interface NotificationItem {
  recipientId: number;
  notificationCode: string;
  seen: boolean;
  title: string;
  content: string;
  sentAt: Date;
  type: string;
  poster: NotificationPoster;
  attachments: NotificationAttachment[];
}
