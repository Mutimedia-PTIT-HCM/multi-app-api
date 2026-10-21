import { Transform } from "class-transformer";
import { IsBoolean } from "class-validator";
import { toBool } from "./to-bool";

export class ToggleStatusDto {
  @Transform(toBool)
  @IsBoolean()
  isOpen!: boolean;
}
