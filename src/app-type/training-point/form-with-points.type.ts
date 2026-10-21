import type { TrainingPointForm } from "@prisma/client";
import { FormPoint } from "./form-point.type";

/** 1 tiêu chí trong form chấm điểm + điểm của SV. */
export type FormWithPoints = TrainingPointForm & { points: FormPoint[] };
