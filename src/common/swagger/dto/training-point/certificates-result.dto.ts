import { ApiProperty } from "@nestjs/swagger";
import { EventItemDto } from "../event/event-item.dto";
import { CertificateItemDto } from "./certificate-item.dto";

export class CertificatesResultDto {
  @ApiProperty({ type: [EventItemDto], description: "Sự kiện đã check-in" })
  major: EventItemDto[];
  @ApiProperty({ type: [CertificateItemDto], description: "Minh chứng tự upload" })
  individual: CertificateItemDto[];
}
