import type { Event } from "@prisma/client";
import { EventPoster } from "./event-poster.type";

/** Sự kiện trả ra API — thumbnail + poster đã resolve URL. */
export type EventItem = Event & {
  thumbnailUrl: string | null;
  poster?: EventPoster | null;
};
