import { ApiProperty } from "@nestjs/swagger";

export class SemesterInfoDto {
  @ApiProperty({ example: "20252" })
  semesterCode: string;
}
