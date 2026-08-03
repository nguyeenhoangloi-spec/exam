// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial database data...');

  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. Users
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@school.edu.vn',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const teacher1User = await prisma.user.upsert({
    where: { username: 'teacher1' },
    update: {},
    create: {
      username: 'teacher1',
      password: hashedPassword,
      email: 'nguyenvana@school.edu.vn',
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });

  const teacher2User = await prisma.user.upsert({
    where: { username: 'teacher2' },
    update: {},
    create: {
      username: 'teacher2',
      password: hashedPassword,
      email: 'tranthib@school.edu.vn',
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });

  const student1User = await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      password: hashedPassword,
      email: 'levanc@student.edu.vn',
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  const student2User = await prisma.user.upsert({
    where: { username: 'student2' },
    update: {},
    create: {
      username: 'student2',
      password: hashedPassword,
      email: 'phamthid@student.edu.vn',
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  const student3User = await prisma.user.upsert({
    where: { username: 'student3' },
    update: {},
    create: {
      username: 'student3',
      password: hashedPassword,
      email: 'hoangvane@student.edu.vn',
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  const student4User = await prisma.user.upsert({
    where: { username: 'student4' },
    update: {},
    create: {
      username: 'student4',
      password: hashedPassword,
      email: 'vuthif@student.edu.vn',
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  // 2. Departments
  const cnttDept = await prisma.department.upsert({
    where: { code: 'CNTT' },
    update: {},
    create: { code: 'CNTT', name: 'Khoa Công nghệ Thông tin' },
  });

  const dtvtDept = await prisma.department.upsert({
    where: { code: 'DTVT' },
    update: {},
    create: { code: 'DTVT', name: 'Khoa Điện tử Viễn thông' },
  });

  // 3. Classes
  const class1 = await prisma.class.upsert({
    where: { code: 'CNTT2021A' },
    update: {},
    create: { code: 'CNTT2021A', name: 'Lớp CNTT K2021-A', departmentId: cnttDept.id },
  });

  const class2 = await prisma.class.upsert({
    where: { code: 'CNTT2021B' },
    update: {},
    create: { code: 'CNTT2021B', name: 'Lớp CNTT K2021-B', departmentId: cnttDept.id },
  });

  // 4. Students
  const s1 = await prisma.student.upsert({
    where: { studentCode: 'SV001' },
    update: {},
    create: {
      studentCode: 'SV001',
      fullName: 'Lê Văn C',
      gender: 'Nam',
      dateOfBirth: new Date('2003-05-15'),
      email: 'levanc@student.edu.vn',
      phone: '0912345678',
      classId: class1.id,
      userId: student1User.id,
    },
  });

  const s2 = await prisma.student.upsert({
    where: { studentCode: 'SV002' },
    update: {},
    create: {
      studentCode: 'SV002',
      fullName: 'Phạm Thị D',
      gender: 'Nữ',
      dateOfBirth: new Date('2003-08-20'),
      email: 'phamthid@student.edu.vn',
      phone: '0923456789',
      classId: class1.id,
      userId: student2User.id,
    },
  });

  const s3 = await prisma.student.upsert({
    where: { studentCode: 'SV003' },
    update: {},
    create: {
      studentCode: 'SV003',
      fullName: 'Hoàng Văn E',
      gender: 'Nam',
      dateOfBirth: new Date('2003-11-02'),
      email: 'hoangvane@student.edu.vn',
      phone: '0934567890',
      classId: class2.id,
      userId: student3User.id,
    },
  });

  const s4 = await prisma.student.upsert({
    where: { studentCode: 'SV004' },
    update: {},
    create: {
      studentCode: 'SV004',
      fullName: 'Vũ Thị F',
      gender: 'Nữ',
      dateOfBirth: new Date('2003-02-28'),
      email: 'vuthif@student.edu.vn',
      phone: '0945678901',
      classId: class2.id,
      userId: student4User.id,
    },
  });

  // 5. Teachers
  const t1 = await prisma.teacher.upsert({
    where: { teacherCode: 'GV001' },
    update: {},
    create: {
      teacherCode: 'GV001',
      fullName: 'Nguyễn Văn A',
      degree: 'Thạc sĩ',
      email: 'nguyenvana@school.edu.vn',
      phone: '0901112223',
      departmentId: cnttDept.id,
      userId: teacher1User.id,
    },
  });

  const t2 = await prisma.teacher.upsert({
    where: { teacherCode: 'GV002' },
    update: {},
    create: {
      teacherCode: 'GV002',
      fullName: 'Trần Thị B',
      degree: 'Tiến sĩ',
      email: 'tranthib@school.edu.vn',
      phone: '0902223334',
      departmentId: cnttDept.id,
      userId: teacher2User.id,
    },
  });

  // 6. Subjects
  const subject1 = await prisma.subject.upsert({
    where: { subjectCode: 'LTHDT' },
    update: {},
    create: {
      subjectCode: 'LTHDT',
      subjectName: 'Lập trình hướng đối tượng',
      credits: 3,
      departmentId: cnttDept.id,
    },
  });

  const subject2 = await prisma.subject.upsert({
    where: { subjectCode: 'CSDL' },
    update: {},
    create: {
      subjectCode: 'CSDL',
      subjectName: 'Cơ sở dữ liệu',
      credits: 3,
      departmentId: cnttDept.id,
    },
  });

  // 7. StudentSubjects
  for (const s of [s1, s2, s3, s4]) {
    for (const sub of [subject1, subject2]) {
      await prisma.studentSubject.create({
        data: {
          studentId: s.id,
          subjectId: sub.id,
          semester: '1',
          schoolYear: '2025-2026',
          status: 'ELIGIBLE',
        },
      });
    }
  }

  // 8. ExamPeriod
  const period = await prisma.examPeriod.create({
    data: {
      name: 'Kỳ thi Cuối kỳ 1 (2025-2026)',
      semester: '1',
      schoolYear: '2025-2026',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-15'),
      status: 'SCHEDULED',
    },
  });

  // 9. ExamSchedule
  await prisma.examSchedule.create({
    data: {
      examPeriodId: period.id,
      subjectId: subject1.id,
      examDate: new Date('2026-06-05'),
      startTime: '08:00',
      endTime: '09:30',
      examType: 'TRAC_NGHIEM',
      status: 'SCHEDULED',
    },
  });

  await prisma.examSchedule.create({
    data: {
      examPeriodId: period.id,
      subjectId: subject2.id,
      examDate: new Date('2026-06-07'),
      startTime: '13:30',
      endTime: '15:00',
      examType: 'TRAC_NGHIEM',
      status: 'SCHEDULED',
    },
  });

  // 10. ExamRooms
  await prisma.examRoom.upsert({
    where: { roomCode: 'P101' },
    update: {},
    create: {
      roomCode: 'P101',
      roomName: 'Phòng 101',
      building: 'Nhà A2',
      capacity: 40,
      roomType: 'THI_LY_THUYET',
    },
  });

  await prisma.examRoom.upsert({
    where: { roomCode: 'P102' },
    update: {},
    create: {
      roomCode: 'P102',
      roomName: 'Phòng 102',
      building: 'Nhà A2',
      capacity: 40,
      roomType: 'THI_LY_THUYET',
    },
  });

  // 11. Chapters. Question data is imported from the legacy SQLite database by
  // `npm run migrate:sqlite`; seed remains safe for fresh development databases.
  for (const subject of [subject1, subject2]) {
    for (let order = 1; order <= 3; order++) {
      await prisma.chapter.upsert({
        where: { subjectId_code: { subjectId: subject.id, code: `CH${order}` } },
        update: {},
        create: { subjectId: subject.id, code: `CH${order}`, name: `Chương ${order}`, order },
      });
    }
  }
  console.log('Seed completed successfully!');
  return;

  // Legacy SQLite-only sample questions kept below for historical reference.
  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();

  await prisma.question.create({
    data: {
      subjectId: subject1.id,
      chapter: 1,
      content: 'Trong lập trình hướng đối tượng, tính chất nào cho phép che giấu thông tin chi tiết bên trong đối tượng?',
      questionType: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      score: 0.25,
      explanation: 'Tính đóng gói (Encapsulation) giúp che giấu dữ liệu.',
      status: 'APPROVED',
      createdById: teacher1User.id,
      options: {
        create: [
          { optionLabel: 'A', optionContent: 'Tính kế thừa (Inheritance)', isCorrect: false },
          { optionLabel: 'B', optionContent: 'Tính đóng gói (Encapsulation)', isCorrect: true },
          { optionLabel: 'C', optionContent: 'Tính đa hình (Polymorphism)', isCorrect: false },
          { optionLabel: 'D', optionContent: 'Tính trừu tượng (Abstraction)', isCorrect: false },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      subjectId: subject1.id,
      chapter: 1,
      content: 'Từ khóa nào trong TypeScript/Java dùng để kế thừa một lớp khác?',
      questionType: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      score: 0.25,
      explanation: 'Extends được dùng để mở rộng/kế thừa từ lớp cha.',
      status: 'APPROVED',
      createdById: teacher1User.id,
      options: {
        create: [
          { optionLabel: 'A', optionContent: 'implements', isCorrect: false },
          { optionLabel: 'B', optionContent: 'extends', isCorrect: true },
          { optionLabel: 'C', optionContent: 'inherits', isCorrect: false },
          { optionLabel: 'D', optionContent: 'super', isCorrect: false },
        ],
      },
    },
  });

  await prisma.question.create({
    data: {
      subjectId: subject1.id,
      chapter: 2,
      content: 'Nạp chồng phương thức (Method Overloading) xảy ra khi nào?',
      questionType: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      score: 0.25,
      explanation: 'Các phương thức cùng tên trong một lớp có danh sách tham số khác nhau.',
      status: 'APPROVED',
      createdById: teacher1User.id,
      options: {
        create: [
          { optionLabel: 'A', optionContent: 'Cùng tên và cùng kiểu dữ liệu tham số', isCorrect: false },
          { optionLabel: 'B', optionContent: 'Cùng tên nhưng khác danh sách tham số trong cùng một lớp', isCorrect: true },
          { optionLabel: 'C', optionContent: 'Phương thức lớp con ghi đè phương thức lớp cha', isCorrect: false },
          { optionLabel: 'D', optionContent: 'Phương thức static gọi phương thức instance', isCorrect: false },
        ],
      },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
