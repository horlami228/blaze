import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course-dto';
import { Public } from 'src/auth/decorators/public.decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateCourseDto } from './dto/update-course-dto';
import { CourseResponseDto } from './dto/course-response-dto';
import { CoursesPaginationResponseDto } from './dto/course-list-pagination-dto';

@ApiTags('Course')
@ApiBearerAuth()
@Controller('api/v1/course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a new course (Admin and Teacher only)' })
  @ApiResponse({
    status: 201,
    description: 'The course has been successfully created.',
    type: CourseResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid course data provided.' })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  @ApiForbiddenResponse({ description: 'Forbidden. Must be a TEACHER.' })
  @ApiBody({ type: CreateCourseDto })
  create(@Body() createCourseDto: CreateCourseDto, @Request() req) {
    return this.courseService.create(
      createCourseDto,
      req.user.sub,
      req.user.role,
    );
  }

  // This is in view to be changed to add query
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.ADMINISTRATOR,
    UserRole.PARENT,
  )
  @ApiOperation({ summary: 'Retrieve all courses with pagination' })
  @ApiResponse({
    status: 200,
    description: 'A list of all courses and metadata.',
    type: CoursesPaginationResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  findAll() {
    return this.courseService.findAll();
  }

  // Find all course by teacher ID
  @Get('my-course')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER)
  @ApiOperation({
    summary: 'Get all courses taught by the authenticated teacher',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of courses created by the teacher.',
    type: [CourseResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  @ApiForbiddenResponse({ description: 'Forbidden. Must be a TEACHER.' })
  findByTeacher(@Request() req) {
    return this.courseService.findByTeacher(req.user.sub);
  }

  // find one course by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.TEACHER,

    UserRole.ADMINISTRATOR,
  )
  @ApiOperation({ summary: 'Get a course by its ID' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the course',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'The found course details.',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  @ApiForbiddenResponse({
    description: 'Forbidden. Must be a TEACHER or ADMINISTRATOR.',
  })
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  // update a course
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Update an existing course (Teacher or Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the course to update',
    type: 'string',
  })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({
    status: 200,
    description: 'The updated course details.',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  @ApiForbiddenResponse({
    description:
      'Forbidden. Must be a TEACHER (and the course creator) or ADMINISTRATOR.',
  })
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req,
  ) {
    return this.courseService.update(
      id,
      updateCourseDto,
      req.user.sub,
      req.user.role,
    );
  }

  // Remove Course from the database
  //TODO: remove the teacher role later
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMINISTRATOR)
  @ApiOperation({ summary: 'Delete a course (Teacher or Admin only)' })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the course to delete',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Course successfully deleted.',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  @ApiUnauthorizedResponse({ description: 'Authentication required.' })
  @ApiForbiddenResponse({
    description:
      'Forbidden. Must be a TEACHER (and the course creator) or ADMINISTRATOR.',
  })
  remove(@Param('id') id: string, @Request() req) {
    return this.courseService.remove(id, req.user.sub, req.user.role);
  }
}
