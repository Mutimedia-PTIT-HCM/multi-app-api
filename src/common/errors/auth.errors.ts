import { ErrorEntry } from "./error-entry.type";

export const AUTH_ERRORS = {
  MISSING_CREDENTIALS: { code: "AUTH_001", message: "Missing authentication credentials" },
  INVALID_SESSION: { code: "AUTH_002", message: "Session is invalid or expired" },
  INVALID_CREDENTIALS: { code: "AUTH_003", message: "Invalid credentials" },
  UNSUPPORTED_FACULTY: { code: "AUTH_004", message: "This faculty is not supported" },
  ACCESS_DENIED: { code: "AUTH_005", message: "Access denied" },
} satisfies Record<string, ErrorEntry>;
