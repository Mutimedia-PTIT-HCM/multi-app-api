import { AppException, AUTH_ERRORS, NO_CHIEF_ROLES, STUDENT_ROLE, UIS_ERRORS } from "@app-common";
import {
  IAuthService,
  IStorageService,
  IUisService,
  IUisSessionService,
  PRISMA_PORT,
  PrismaPort,
  STORAGE_PORT,
  UIS_PORT,
  UIS_SESSION_PORT,
} from "@app-contracts";
import { ChiefLoginResult, PublicStudent, StudentLoginResult, TokenScope } from "@app-type";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Student } from "@prisma/client";

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(PRISMA_PORT) private readonly prisma: PrismaPort,
    @Inject(UIS_PORT) private readonly uis: IUisService,
    @Inject(STORAGE_PORT) private readonly storage: IStorageService,
    private readonly jwt: JwtService,
    @Inject(UIS_SESSION_PORT) private readonly uisSession: IUisSessionService,
  ) {}

  async login(studentCodeRaw: string, password: string): Promise<StudentLoginResult> {
    const studentCode = studentCodeRaw.toUpperCase();
    const result = await this.uis.login(studentCode, password);
    if (result.status === "unsupported") {
      throw new AppException(HttpStatus.BAD_REQUEST, AUTH_ERRORS.UNSUPPORTED_FACULTY);
    }
    if (result.status === "invalid") {
      throw new AppException(HttpStatus.BAD_REQUEST, AUTH_ERRORS.INVALID_CREDENTIALS);
    }
    if (result.status === "unreachable") {
      throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, UIS_ERRORS.UNREACHABLE);
    }

    const info = await this.uis.getStudentInfo(result.session);

    const student: Student = await this.prisma.student.upsert({
      where: { studentCode },
      create: {
        studentCode,
        classCode: info.classCode,
        fullName: info.fullName,
        phone: info.phone,
        gender: info.gender === "Nam" ? 0 : 1,
        birthDate: info.birthDate,
        role: STUDENT_ROLE,
      },
      update: {
        classCode: info.classCode,
      },
    });
    await this.uisSession.persistTokens(studentCode, result.tokens);

    return {
      accessToken: this.sign(student.studentCode, "student", student.role),
      accessTokenChief: NO_CHIEF_ROLES.includes(student.role)
        ? null
        : this.sign(student.studentCode, "chief", student.role),
      student: this.toPublicStudent(student),
    };
  }

  /** Login phân hệ ban cán sự — chỉ cấp chief token. */
  async loginChief(studentCodeRaw: string, password: string): Promise<ChiefLoginResult> {
    const studentCode = studentCodeRaw.toUpperCase();
    const result = await this.uis.login(studentCode, password);
    if (result.status === "unsupported") {
      throw new AppException(HttpStatus.BAD_REQUEST, AUTH_ERRORS.UNSUPPORTED_FACULTY);
    }
    if (result.status !== "ok") {
      throw new AppException(HttpStatus.BAD_REQUEST, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const student: Student | null = await this.prisma.student.findUnique({ where: { studentCode } });
    if (!student || student.role === STUDENT_ROLE) {
      throw new AppException(HttpStatus.UNAUTHORIZED, AUTH_ERRORS.ACCESS_DENIED);
    }

    const info = await this.uis.getStudentInfo(result.session);
    const updated: Student = await this.prisma.student.update({
      where: { studentCode },
      data: { classCode: info.classCode },
    });
    await this.uisSession.persistTokens(studentCode, result.tokens);

    return {
      accessToken: this.sign(updated.studentCode, "chief", updated.role),
      student: this.toPublicStudent(updated),
    };
  }

  toPublicStudent(student: Student): PublicStudent {
    const {
      otp: _otp,
      fcmToken: _fcmToken,
      uisAccessToken: _uisAccessToken,
      uisRefreshToken: _uisRefreshToken,
      uisTokenExpiresAt: _uisTokenExpiresAt,
      ...rest
    } = student;
    return { ...rest, avatarUrl: this.storage.url(student.avatarKey) };
  }

  private sign(studentCode: string, scope: TokenScope, role: number): string {
    return this.jwt.sign({ sub: studentCode, scope, role });
  }
}
