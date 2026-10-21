import type { ChiefLoginResult, PublicStudent, StudentLoginResult } from "@app-type";
import type { Student } from "@prisma/client";

export interface IAuthService {
  login(studentCode: string, password: string): Promise<StudentLoginResult>;
  loginChief(studentCode: string, password: string): Promise<ChiefLoginResult>;
  toPublicStudent(student: Student): PublicStudent;
}
