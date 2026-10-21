import { PublicStudent } from "../student/public-student.type";

/** Response POST /auth/student/login — JWT của hệ thống (+chief token nếu có quyền). */
export interface StudentLoginResult {
  accessToken: string;
  accessTokenChief: string | null;
  student: PublicStudent;
}
