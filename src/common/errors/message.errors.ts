import { ErrorEntry } from "./error-entry.type";

export const MESSAGE_ERRORS = {
  NOT_FOUND: { code: "MSG_001", message: "Message not found" },
  DELETE_FORBIDDEN: { code: "MSG_002", message: "You cannot delete this message" },
} satisfies Record<string, ErrorEntry>;
