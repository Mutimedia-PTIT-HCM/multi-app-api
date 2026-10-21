import { AuthService } from "@app-application/auth";
import { AppException, STUDENT_ERRORS } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { StorageService } from "@app-infra/storage";
import { UploadedFilePayload } from "@app-type";
import { HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly auth: AuthService,
  ) {}

  async getByCode(studentCode: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentCode: studentCode.toUpperCase() },
    });
    if (!student) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    return this.auth.toPublicStudent(student);
  }

  async search(keyword: string, excludeCode: string) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: [{ fullName: { contains: keyword } }, { studentCode: { contains: keyword.toUpperCase() } }],
        NOT: { studentCode: excludeCode },
      },
      select: { studentCode: true, fullName: true, avatarKey: true },
      take: 50,
    });
    return students.map((s) => ({ ...s, avatarUrl: this.storage.url(s.avatarKey) }));
  }

  async updateProfile(
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
  ) {
    let avatarKey: string | undefined;
    if (avatarFile) {
      avatarKey = this.storage.generateKey("avt", avatarFile.originalname);
      await this.storage.upload(avatarKey, avatarFile.buffer, avatarFile.mimetype);
    }
    await this.prisma.student.update({
      where: { studentCode },
      data: { ...fields, ...(avatarKey ? { avatarKey } : {}) },
    });
  }

  /** Danh sách thành viên cùng lớp (dùng cho chief). */
  async getClassMembers(studentCode: string) {
    const me = await this.prisma.student.findUnique({
      where: { studentCode },
      select: { classCode: true },
    });
    if (!me) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    const members = await this.prisma.student.findMany({
      where: { classCode: me.classCode },
      select: { studentCode: true, classCode: true, fullName: true, birthDate: true, avatarKey: true },
      orderBy: { studentCode: "asc" },
    });
    return members.map((m) => ({ ...m, avatarUrl: this.storage.url(m.avatarKey) }));
  }
}
