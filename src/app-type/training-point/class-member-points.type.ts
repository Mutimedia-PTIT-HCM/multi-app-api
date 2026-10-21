import { FormWithPoints } from "./form-with-points.type";

/** 1 SV trong bảng điểm rèn luyện cả lớp (chief) — kèm điểm theo từng tiêu chí. */
export interface ClassMemberPoints {
  studentCode: string;
  classCode: string;
  fullName: string | null;
  birthDate: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
  points: FormWithPoints[];
}
