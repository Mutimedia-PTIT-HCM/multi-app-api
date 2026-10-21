import type { Event } from "@prisma/client";
import { CertificateItem } from "./certificate-item.type";

/** GET /training-points/certificates — major: sự kiện đã check-in, individual: cert tự upload. */
export interface CertificatesResult {
  major: Event[];
  individual: CertificateItem[];
}
