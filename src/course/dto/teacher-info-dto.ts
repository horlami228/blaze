import { ApiProperty } from '@nestjs/swagger';

export class TeacherInfoDto {
  @ApiProperty({ description: 'The UUID of the teacher', format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', required: false })
  email?: string;
}
