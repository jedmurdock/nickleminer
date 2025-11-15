import { IsInt, Min, Max } from 'class-validator';

export class ScrapeYearDto {
  @IsInt()
  @Min(2000)
  @Max(new Date().getFullYear())
  year: number;
}
