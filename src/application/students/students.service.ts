import { AppException, STUDENT_ERRORS, toPaginated, toPrismaPage } from "@app-common";
import {
  AUTH_PORT,
  IAuthService,
  IStorageService,
  IStudentsService,
  PRISMA_PORT,
  PrismaPort,
  STORAGE_PORT,
} from "@app-contracts";
import {
  ClassCodeRow,
  ClassMember,
  ClassMemberRow,
  PaginatedResult,
  PaginationQuery,
  PublicStudent,
  StudentProfileUpdate,
  StudentSearchItem,
  StudentSearchRow,
  UploadedFilePayload,
} from "@app-type";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { Student } from "@prisma/client";

@Injectable()
export class StudentsService implements IStudentsService {
  constructor(
    @Inject(PRISMA_PORT) private readonly prisma: PrismaPort,
    @Inject(STORAGE_PORT) private readonly storage: IStorageService,
    @Inject(AUTH_PORT) private readonly auth: IAuthService,
  ) {}

  async getByCode(studentCode: string): Promise<PublicStudent> {
    const student: Student | null = await this.prisma.student.findUnique({
      where: { studentCode: studentCode.toUpperCase() },
    });
    if (!student) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    return this.auth.toPublicStudent(student);
  }

  async search(
    keyword: string,
    excludeCode: string,
    q: PaginationQuery,
  ): Promise<PaginatedResult<StudentSearchItem>> {
    const where = {
      OR: [{ fullName: { contains: keyword } }, { studentCode: { contains: keyword.toUpperCase() } }],
      NOT: { studentCode: excludeCode },
    };
    const [total, students]: [number, StudentSearchRow[]] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        select: { studentCode: true, fullName: true, avatarKey: true },
        orderBy: { studentCode: "asc" },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      students.map((s) => ({ ...s, avatarUrl: this.storage.url(s.avatarKey) })),
      total,
      q,
    );
  }

  async updateProfile(
    studentCode: string,
    fields: StudentProfileUpdate,
    avatarFile?: UploadedFilePayload,
  ): Promise<void> {
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
  async getClassMembers(studentCode: string, q: PaginationQuery): Promise<PaginatedResult<ClassMember>> {
    const me: ClassCodeRow | null = await this.prisma.student.findUnique({
      where: { studentCode },
      select: { classCode: true },
    });
    if (!me) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    const where = { classCode: me.classCode };
    const [total, members]: [number, ClassMemberRow[]] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        select: {
          studentCode: true,
          classCode: true,
          fullName: true,
          birthDate: true,
          avatarKey: true,
        },
        orderBy: { studentCode: "asc" },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      members.map((m) => ({ ...m, avatarUrl: this.storage.url(m.avatarKey) })),
      total,
      q,
    );
  }
}
