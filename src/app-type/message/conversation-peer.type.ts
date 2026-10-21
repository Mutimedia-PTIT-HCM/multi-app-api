import { AvatarUser } from "../student/avatar-user.type";

/** Peer trong danh sách hội thoại — có studentCode + avatar. */
export interface ConversationPeer extends AvatarUser {
  studentCode: string;
}
