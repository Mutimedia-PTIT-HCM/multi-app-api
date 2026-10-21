/** 1 thành viên trong danh sách lớp (chief). */
export interface ClassMember {
  studentCode: string;
  classCode: string;
  fullName: string | null;
  birthDate: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
}
