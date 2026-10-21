/** Poster của sự kiện — avatar đã resolve URL. Field optional vì detail/list select khác nhau. */
export interface EventPoster {
  fullName?: string | null;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}
