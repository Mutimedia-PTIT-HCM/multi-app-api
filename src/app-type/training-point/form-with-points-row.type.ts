import type { Prisma } from "@prisma/client";

/** Row trainingPointForm + điểm của 1 SV (không studentCode). */
export type FormWithPointsRow = Prisma.TrainingPointFormGetPayload<{
  include: { points: { select: { id: true; selfPoint: true; finalPoint: true } } };
}>;
