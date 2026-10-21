/** Kết quả xin quyền upload: client PUT file lên uploadUrl rồi dùng key/publicUrl trong các API khác. */
export interface PresignedUpload {
  /** Object key lưu trong storage — truyền key này vào API nghiệp vụ. */
  key: string;
  /** URL để PUT binary file (R2 presigned URL, hoặc endpoint local khi dev). */
  uploadUrl: string;
  /** Method HTTP khi upload — luôn là PUT. */
  method: "PUT";
  /** Content-Type client phải gửi khi PUT. */
  contentType: string;
  /** URL public sau khi upload xong. */
  publicUrl: string;
}
