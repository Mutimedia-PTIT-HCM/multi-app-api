import type { PresignedUpload, UploadedKey, UploadPurpose } from "@app-type";

export interface IUploadsService {
  requestUpload(purpose: UploadPurpose, fileName: string, contentType: string): Promise<PresignedUpload>;
  receiveLocalUpload(token: string, body: Buffer | undefined): Promise<UploadedKey>;
}
