import type {
  ClassMember,
  PaginatedResult,
  PaginationQuery,
  PublicStudent,
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
    fields: {
      facebook?: string;
      personalEmail?: string;
      phone?: string;
      hidePersonalEmail?: boolean;
      hideFacebook?: boolean;
      hidePhone?: boolean;
    },
    avatarFile?: UploadedFilePayload,
  ): Promise<void>;
  getClassMembers(studentCode: string, q: PaginationQuery): Promise<PaginatedResult<ClassMember>>;
}
