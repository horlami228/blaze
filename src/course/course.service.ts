import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course-dto';
import { UserRole } from '@prisma/client';
import { UpdateCourseDto } from './dto/update-course-dto';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCourseDto: CreateCourseDto,
    userId: string,
    userRole: UserRole,
  ) {
    // Only teachers can create courses
    if (userRole !== UserRole.TEACHER) {
      throw new ForbiddenException('Only teachers can create courses');
    }

    console.log('The user id is', userId);

    return this.prisma.course.create({
      data: {
        ...createCourseDto,
        teacherId: userId, // Assign the creating teacher
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Find all course with the teachers and number of enrollments
  // paginated with page and limit
  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        skip,
        take: limit,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        orderBy: {
          title: 'asc',
        },
      }),
      this.prisma.course.count(),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Find one course by Id

  async findOne(id: string) {
    console.log('i am here');
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    return course;
  }

  // Update a course information
  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userId: string,
    userRole: UserRole,
  ) {
    const course = await this.findOne(id);

    console.log('userId: ', userId);
    console.log('courseTeacherID: ', course.teacherId);

    // Only the teacher who created it or an admin can update
    if (userRole !== UserRole.ADMINISTRATOR && course.teacherId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // remove a course from the database
  async remove(id: string, userId: string, userRole: UserRole) {
    const course = await this.findOne(id);

    // Only the teacher who created it or an admin can delete
    if (userRole !== UserRole.ADMINISTRATOR && course.teacherId !== userId) {
      throw new ForbiddenException('You can only delete your own courses');
    }

    return this.prisma.course.delete({
      where: { id },
    });
  }

  // find course by teacher ID
  async findByTeacher(teacherId: string) {
    console.log('teacherId: ', teacherId);
    return this.prisma.course.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  }
}
