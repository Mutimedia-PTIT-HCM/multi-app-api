import { ErrorEntry } from "./error-entry.type";

export const SCHEDULE_ERRORS = {
  INVALID_WEEK: { code: "SCH_001", message: "Invalid week" },
} satisfies Record<string, ErrorEntry>;
