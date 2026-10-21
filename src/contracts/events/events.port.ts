import type {
  AttendanceItem,
  EventItem,
  PaginatedResult,
  PaginationQuery,
  UploadedFilePayload,
} from "@app-type";

export interface IEventsService {
  list(q: PaginationQuery): Promise<PaginatedResult<EventItem>>;
  create(posterCode: string, title: string, content: string, thumb?: UploadedFilePayload): Promise<EventItem>;
  remove(eventCode: string, actorCode: string, actorRole: number): Promise<void>;
  qrPng(eventCode: string): Promise<Buffer>;
  attendance(eventCode: string): Promise<AttendanceItem[]>;
  checkIn(studentCode: string, eventCode: string, location?: string): Promise<void>;
}
