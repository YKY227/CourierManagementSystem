import { IsString, Length, Matches } from "class-validator";

export class DriverLoginDto {
  @IsString()
  code: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pin: string;
}
