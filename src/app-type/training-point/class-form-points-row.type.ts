import type { Prisma } from "@prisma/client";

/** Row trainingPointForm + điểm kèm studentCode — bảng điểm cả lớp. */
export type ClassFormPointsRow = Prisma.TrainingPointFormGetPayload<{
  include: { points: { select: { id: true; studentCode: true; selfPoint: true; finalPoint: true } } };
}>;
