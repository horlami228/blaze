import { ApiProperty } from '@nestjs/swagger';
import { CourseResponseDto } from './course-response-dto';
import { MetaDto } from './pagination-meta-dto';

export class CoursesPaginationResponseDto {
  @ApiProperty({
    type: () => CourseResponseDto,
    isArray: true,
  })
  data: CourseResponseDto[];

  @ApiProperty({ type: () => MetaDto })
  meta: MetaDto;
}
