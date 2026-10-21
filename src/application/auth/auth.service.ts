import { PrismaService } from "@app-infra/prisma";
import { StorageService } from "@app-infra/storage";
import { UisService, UisSessionService } from "@app-infra/uis";
import { TokenScope } from "@app-type";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Student } from "@prisma/client";

const STUDENT_ROLE = 6;
const NO_CHIEF_ROLES = [0, 6];

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uis: UisService,
    private readonly storage: StorageService,
    private readonly jwt: JwtService,
    private readonly uisSession: UisSessionService,
  ) {}

  async login(studentCodeRaw: string, password: string) {
    const studentCode = studentCodeRaw.toUpperCase();
    const result = await this.uis.login(studentCode, password);
    if (result.status === "unsupported") {
      throw new BadRequestException("Rất tiếc. Ứng dụng chúng tôi hiện chưa phục vụ ngành khác");
    }
    if (result.status === "invalid") {
      throw new BadRequestException("Sai thông tin đăng nhập.");
    }
    if (result.status === "unreachable") {
      throw new BadRequestException("Không kết nối được máy chủ trường, vui lòng thử lại sau");
    }

    const info = await this.uis.getStudentInfo(result.session);

    const student = await this.prisma.student.upsert({
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
  async loginChief(studentCodeRaw: string, password: string) {
    const studentCode = studentCodeRaw.toUpperCase();
    const result = await this.uis.login(studentCode, password);
    if (result.status === "unsupported") {
      throw new BadRequestException("Rất tiếc. Ứng dụng chúng tôi hiện chưa phục vụ ngành khác");
    }
    if (result.status !== "ok") {
      throw new BadRequestException(
        "Sai thông tin đăng nhập. (Vui lòng sử dụng tài khoản và mật khẩu của UIS)",
      );
    }

    const student = await this.prisma.student.findUnique({ where: { studentCode } });
    if (!student || student.role === STUDENT_ROLE) {
      throw new UnauthorizedException("Rất tiếc! Tài khoản của bạn không có quyền truy cập.");
    }

    const info = await this.uis.getStudentInfo(result.session);
    const updated = await this.prisma.student.update({
      where: { studentCode },
      data: { classCode: info.classCode },
    });
    await this.uisSession.persistTokens(studentCode, result.tokens);

    return {
      accessToken: this.sign(updated.studentCode, "chief", updated.role),
      student: this.toPublicStudent(updated),
    };
  }

  toPublicStudent(student: Student) {
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
