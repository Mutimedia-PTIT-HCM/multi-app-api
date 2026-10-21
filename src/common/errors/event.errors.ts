import { ErrorEntry } from "./error-entry.type";

export const EVENT_ERRORS = {
  MISSING_POSTER: { code: "EVT_001", message: "Event poster is required" },
  NOT_FOUND: { code: "EVT_002", message: "Event not found" },
  DELETE_FORBIDDEN: { code: "EVT_003", message: "You cannot delete this event" },
  ALREADY_CHECKED_IN: { code: "EVT_004", message: "Already checked in to this event" },
} satisfies Record<string, ErrorEntry>;
