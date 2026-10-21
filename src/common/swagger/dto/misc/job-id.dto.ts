import { ApiProperty } from "@nestjs/swagger";

export class JobIdDto {
  @ApiProperty({ example: "1740000000000" })
  jobId: string;
}
