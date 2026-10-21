import { ErrorEntry } from "./error-entry.type";

export const UPLOAD_ERRORS = {
  INVALID_TOKEN: { code: "UPL_001", message: "Upload token is invalid or expired" },
  STORAGE_NOT_CONFIGURED: {
    code: "UPL_002",
    message: "Local upload endpoint is only available in local storage mode",
  },
  EMPTY_BODY: { code: "UPL_003", message: "Upload body is empty" },
} satisfies Record<string, ErrorEntry>;
