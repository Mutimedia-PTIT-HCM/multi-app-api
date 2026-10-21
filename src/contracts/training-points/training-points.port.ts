import type { CertificatesResult, ClassMemberPoints, FormWithPoints, UploadedFilePayload } from "@app-type";

export interface ITrainingPointsService {
  getFormWithPoints(studentCode: string): Promise<FormWithPoints[]>;
  selfAssess(studentCode: string, formId: number, point: number): Promise<void>;
  uploadCertificate(studentCode: string, title: string, files: UploadedFilePayload[]): Promise<void>;
  getCertificates(studentCode: string): Promise<CertificatesResult>;
  getStatus(studentCode: string): Promise<boolean>;
  setStatus(studentCode: string, isOpen: boolean): Promise<void>;
  getClassPoints(chiefCode: string): Promise<ClassMemberPoints[]>;
  reviewPoint(chiefCode: string, studentCode: string, formId: number, point: number): Promise<void>;
  deletePoint(chiefCode: string, pointId: number): Promise<void>;
  resetClass(chiefCode: string, chiefRole: number): Promise<void>;
}
