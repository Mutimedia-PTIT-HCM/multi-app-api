import { ErrorEntry } from "./error-entry.type";

export const UIS_ERRORS = {
  UNREACHABLE: { code: "UIS_001", message: "University server is unreachable" },
  SESSION_EXPIRED: { code: "UIS_002", message: "UIS session expired, please log in again" },
} satisfies Record<string, ErrorEntry>;
