import type {
  ClassMember,
  PaginatedResult,
  PaginationQuery,
  PublicStudent,
  StudentProfileUpdate,
  StudentSearchItem,
  UploadedFilePayload,
} from "@app-type";

export interface IStudentsService {
  getByCode(studentCode: string): Promise<PublicStudent>;
  search(
    keyword: string,
    excludeCode: string,
    q: PaginationQuery,
  ): Promise<PaginatedResult<StudentSearchItem>>;
  updateProfile(
    studentCode: string,
    fields: StudentProfileUpdate,
    avatarFile?: UploadedFilePayload,
  ): Promise<void>;
  getClassMembers(studentCode: string, q: PaginationQuery): Promise<PaginatedResult<ClassMember>>;
}
