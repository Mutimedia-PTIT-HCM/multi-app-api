import { AvatarUser } from "../student/avatar-user.type";

/** SV trong danh sách điểm danh sự kiện. */
export interface AttendanceStudent extends AvatarUser {
  studentCode: string;
}
