/** Các trường profile sinh viên tự cập nhật (privacy flag + contact). */
export interface StudentProfileUpdate {
  facebook?: string;
  personalEmail?: string;
  phone?: string;
  hidePersonalEmail?: boolean;
  hideFacebook?: boolean;
  hidePhone?: boolean;
}
