import { PublicStudent } from "../student/public-student.type";

/** Response POST /auth/chief/login — chỉ chief token. */
export interface ChiefLoginResult {
  accessToken: string;
  student: PublicStudent;
}
