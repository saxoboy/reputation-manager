import { IsNotEmpty, IsString } from 'class-validator';

export class ParseExcelDto {
  @IsString()
  @IsNotEmpty()
  fileContent: string; // base64-encoded xlsx file
}
