/** File đã upload (memory storage) — tương đương Express.Multer.File nhưng không phụ thuộc global namespace. */
export interface UploadedFilePayload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
