import { ErrorEntry } from "./error-entry.type";

export const SYS_ERRORS = {
  INTERNAL_ERROR: { code: "SYS_001", message: "Internal server error" },
  CONFIG_MISSING: { code: "SYS_002", message: "System configuration is missing" },
  VALIDATION_FAILED: { code: "VAL_001", message: "Validation failed" },
} satisfies Record<string, ErrorEntry>;
