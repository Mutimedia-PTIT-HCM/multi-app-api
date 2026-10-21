import { AppException, PRIVILEGED_ROLES, STUDENT_ERRORS, TRAINING_POINT_ERRORS } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { StorageService } from "@app-infra/storage";
import {
  CertImageKeysRow,
  CertificatesResult,
  CheckInWithEventRow,
  ClassCodeRow,
  ClassFormPointsRow,
  ClassMemberPoints,
  ClassMemberRow,
  FormWithPoints,
  FormWithPointsRow,
  UploadedFilePayload,
} from "@app-type";
import { HttpStatus, Injectable } from "@nestjs/common";
import type { Certificate, TrainingPoint, TrainingPointForm, TrainingPointStatus } from "@prisma/client";

@Injectable()
export class TrainingPointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ===================== STUDENT =====================

  /** Form tiêu chí + điểm của 1 SV. */
  async getFormWithPoints(studentCode: string): Promise<FormWithPoints[]> {
    const forms: FormWithPointsRow[] = await this.prisma.trainingPointForm.findMany({
      orderBy: { id: "asc" },
      include: {
        points: {
          where: { studentCode },
          select: { id: true, selfPoint: true, finalPoint: true },
        },
      },
    });
    return forms;
  }

  async selfAssess(studentCode: string, formId: number, point: number): Promise<void> {
    await this.assertClassOpen(studentCode);
    const form: TrainingPointForm | null = await this.prisma.trainingPointForm.findUnique({
      where: { id: formId },
    });
    if (!form) throw new AppException(HttpStatus.NOT_FOUND, TRAINING_POINT_ERRORS.FORM_NOT_FOUND);
    if (form.maxPoint != null && point > form.maxPoint) {
      throw new AppException(HttpStatus.BAD_REQUEST, TRAINING_POINT_ERRORS.POINTS_EXCEED_MAX);
    }
    await this.prisma.trainingPoint.upsert({
      where: { formId_studentCode: { formId, studentCode } },
      create: { formId, studentCode, selfPoint: point, finalPoint: 0 },
      update: { selfPoint: point },
    });
  }

  async uploadCertificate(studentCode: string, title: string, files: UploadedFilePayload[]): Promise<void> {
    await this.assertClassOpen(studentCode);
    const keys: string[] = [];
    for (const f of files) {
      const key = this.storage.generateKey("cert", f.originalname);
      await this.storage.upload(key, f.buffer, f.mimetype);
      keys.push(key);
    }
    await this.prisma.certificate.create({
      data: { studentCode, title, imageKeys: keys.join(" ") },
    });
  }

  /** Minh chứng: sự kiện đã check-in + cert tự upload. */
  async getCertificates(studentCode: string): Promise<CertificatesResult> {
    const [events, individual]: [CheckInWithEventRow[], Certificate[]] = await Promise.all([
      this.prisma.eventCheckIn.findMany({
        where: { studentCode },
        include: { event: true },
      }),
      this.prisma.certificate.findMany({ where: { studentCode } }),
    ]);
    return {
      major: events.map((c) => c.event),
      individual: individual.map((c) => ({ ...c, imageUrls: this.storage.urls(c.imageKeys) })),
    };
  }

  // ===================== CHIEF =====================

  async getStatus(studentCode: string): Promise<boolean> {
    const classCode = await this.getMyClassCode(studentCode);
    const status: TrainingPointStatus | null = await this.prisma.trainingPointStatus.findUnique({
      where: { classCode },
    });
    if (status) return status.isOpen;
    await this.prisma.trainingPointStatus.create({ data: { classCode, isOpen: false } });
    return false;
  }

  async setStatus(studentCode: string, isOpen: boolean): Promise<void> {
    const classCode = await this.getMyClassCode(studentCode);
    await this.prisma.trainingPointStatus.upsert({
      where: { classCode },
      create: { classCode, isOpen },
      update: { isOpen },
    });
  }

  /** Điểm rèn luyện cả lớp — 1 query, không N+1. */
  async getClassPoints(chiefCode: string): Promise<ClassMemberPoints[]> {
    const classCode = await this.getMyClassCode(chiefCode);
    const members: ClassMemberRow[] = await this.prisma.student.findMany({
      where: { classCode },
      select: { studentCode: true, classCode: true, fullName: true, birthDate: true, avatarKey: true },
      orderBy: { studentCode: "asc" },
    });
    const forms: ClassFormPointsRow[] = await this.prisma.trainingPointForm.findMany({
      orderBy: { id: "asc" },
      include: {
        points: {
          where: { student: { classCode } },
          select: { id: true, studentCode: true, selfPoint: true, finalPoint: true },
        },
      },
    });
    return members.map((m) => ({
      ...m,
      avatarUrl: this.storage.url(m.avatarKey),
      points: forms.map((f) => ({
        ...f,
        points: f.points.filter((p) => p.studentCode === m.studentCode),
      })),
    }));
  }

  /** Chief chấm pointFinal cho SV (phải cùng lớp). */
  async reviewPoint(chiefCode: string, studentCode: string, formId: number, point: number): Promise<void> {
    await this.assertSameClass(chiefCode, studentCode);
    const form: TrainingPointForm | null = await this.prisma.trainingPointForm.findUnique({
      where: { id: formId },
    });
    if (!form) throw new AppException(HttpStatus.NOT_FOUND, TRAINING_POINT_ERRORS.FORM_NOT_FOUND);
    if (form.maxPoint != null && point > form.maxPoint) {
      throw new AppException(HttpStatus.BAD_REQUEST, TRAINING_POINT_ERRORS.POINTS_EXCEED_MAX);
    }
    await this.prisma.trainingPoint.upsert({
      where: { formId_studentCode: { formId, studentCode } },
      create: { formId, studentCode, selfPoint: 0, finalPoint: point },
      update: { finalPoint: point },
    });
  }

  async deletePoint(chiefCode: string, pointId: number): Promise<void> {
    const point: TrainingPoint | null = await this.prisma.trainingPoint.findUnique({
      where: { id: pointId },
    });
    if (!point) throw new AppException(HttpStatus.NOT_FOUND, TRAINING_POINT_ERRORS.POINT_NOT_FOUND);
    await this.assertSameClass(chiefCode, point.studentCode);
    await this.prisma.trainingPoint.delete({ where: { id: pointId } });
  }

  /** Reset điểm + cert cả lớp — chỉ role 3/4 (giữ nguyên legacy). */
  async resetClass(chiefCode: string, chiefRole: number): Promise<void> {
    if (!PRIVILEGED_ROLES.includes(chiefRole)) {
      throw new AppException(HttpStatus.FORBIDDEN, TRAINING_POINT_ERRORS.FORBIDDEN);
    }
    const classCode = await this.getMyClassCode(chiefCode);
    const certs: CertImageKeysRow[] = await this.prisma.certificate.findMany({
      where: { student: { classCode } },
      select: { imageKeys: true },
    });
    const keys = certs.flatMap((c) => c.imageKeys.split(" ").filter(Boolean));
    await this.prisma.$transaction([
      this.prisma.certificate.deleteMany({ where: { student: { classCode } } }),
      this.prisma.trainingPoint.deleteMany({ where: { student: { classCode } } }),
    ]);
    for (const key of keys) {
      await this.storage.delete(key).catch(() => undefined);
    }
  }

  // ===================== HELPERS =====================

  private async getMyClassCode(studentCode: string): Promise<string> {
    const me: ClassCodeRow | null = await this.prisma.student.findUnique({
      where: { studentCode },
      select: { classCode: true },
    });
    if (!me) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    return me.classCode;
  }

  private async assertClassOpen(studentCode: string) {
    const classCode = await this.getMyClassCode(studentCode);
    const status: TrainingPointStatus | null = await this.prisma.trainingPointStatus.findUnique({
      where: { classCode },
    });
    if (!status?.isOpen)
      throw new AppException(HttpStatus.BAD_REQUEST, TRAINING_POINT_ERRORS.SUBMISSION_CLOSED);
  }

  private async assertSameClass(chiefCode: string, studentCode: string) {
    const [chief, student]: [ClassCodeRow | null, ClassCodeRow | null] = await Promise.all([
      this.prisma.student.findUnique({ where: { studentCode: chiefCode }, select: { classCode: true } }),
      this.prisma.student.findUnique({ where: { studentCode }, select: { classCode: true } }),
    ]);
    if (!student) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    if (chief?.classCode !== student.classCode) {
      throw new AppException(HttpStatus.FORBIDDEN, TRAINING_POINT_ERRORS.STUDENT_NOT_IN_CLASS);
    }
  }
}
