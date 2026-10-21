import { ErrorEntry } from "./error-entry.type";

export const CLASS_ERRORS = {
  CANNOT_EDIT_ROLE: { code: "CLS_001", message: "You cannot edit this role" },
  COMMITTEE_ONLY: { code: "CLS_002", message: "Only class committee members can perform this action" },
} satisfies Record<string, ErrorEntry>;
