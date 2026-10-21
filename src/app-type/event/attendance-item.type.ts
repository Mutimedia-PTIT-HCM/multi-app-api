import type { EventCheckIn } from "@prisma/client";
import { AttendanceStudent } from "./attendance-student.type";

/** 1 lượt check-in sự kiện + thông tin SV. */
export type AttendanceItem = EventCheckIn & { student: AttendanceStudent };
