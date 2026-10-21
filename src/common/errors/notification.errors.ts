import { ErrorEntry } from "./error-entry.type";

export const NOTIFICATION_ERRORS = {
  NOT_FOUND: { code: "NTF_001", message: "Notification not found" },
} satisfies Record<string, ErrorEntry>;
