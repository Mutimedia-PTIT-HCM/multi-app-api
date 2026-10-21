import { ErrorEntry } from "./error-entry.type";

export const TRAINING_POINT_ERRORS = {
  FORM_NOT_FOUND: { code: "TP_001", message: "Criteria not found" },
  POINTS_EXCEED_MAX: { code: "TP_002", message: "Points exceed the allowed maximum" },
  POINT_NOT_FOUND: { code: "TP_003", message: "Training point not found" },
  FORBIDDEN: { code: "TP_004", message: "Permission denied" },
  SUBMISSION_CLOSED: { code: "TP_005", message: "Training point submission is closed" },
  STUDENT_NOT_IN_CLASS: { code: "TP_006", message: "Student does not belong to your class" },
} satisfies Record<string, ErrorEntry>;
