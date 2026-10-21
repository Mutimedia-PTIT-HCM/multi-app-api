import { ErrorEntry } from "./error-entry.type";

export const STUDENT_ERRORS = {
  NOT_FOUND: { code: "STU_001", message: "Student not found" },
} satisfies Record<string, ErrorEntry>;
