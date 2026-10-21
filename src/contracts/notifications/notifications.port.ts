import type {
  NotificationItem,
  PaginatedResult,
  PaginationQuery,
  SchedulePayload,
  UploadedFilePayload,
} from "@app-type";

export interface INotificationsService {
  listMine(studentCode: string, q: PaginationQuery): Promise<PaginatedResult<NotificationItem>>;
  markRead(studentCode: string, recipientId: number): Promise<void>;
  send(
    posterCode: string,
    input: { title: string; content: string; type: string } & SchedulePayload,
    files: UploadedFilePayload[],
  ): Promise<void>;
}
