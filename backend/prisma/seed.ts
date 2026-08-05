// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rich demonstration data into PostgreSQL...');

  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. Users & Roles
  console.log(' └─ Creating Users...');
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword },
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@school.edu.vn',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const teacherUsers = [];
  const teacherList = [
    { code: 'GV001', name: 'Nguyễn Văn A', email: 'nguyenvana@school.edu.vn', degree: 'GS.TS', deptCode: 'CNTT' },
    { code: 'GV002', name: 'Trần Thị B', email: 'tranthib@school.edu.vn', degree: 'TS', deptCode: 'CNTT' },
    { code: 'GV003', name: 'Đỗ Minh C', email: 'dominhc@school.edu.vn', degree: 'PGS.TS', deptCode: 'DTVT' },
    { code: 'GV004', name: 'Lê Hoàng D', email: 'lehoangd@school.edu.vn', degree: 'TS', deptCode: 'AI-DS' },
    { code: 'GV005', name: 'Phạm Thu E', email: 'phamthue@school.edu.vn', degree: 'ThS', deptCode: 'ATTT' },
    { code: 'GV006', name: 'Bùi Anh F', email: 'buianhf@school.edu.vn', degree: 'TS', deptCode: 'KTS' },
  ];

  for (const t of teacherList) {
    const teacherPass = await bcrypt.hash(t.code, 10);
    const u = await prisma.user.upsert({
      where: { username: t.code },
      update: { password: teacherPass },
      create: {
        username: t.code,
        password: teacherPass,
        email: t.email,
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });
    teacherUsers.push({ ...t, userId: u.id });
  }

  // 2. Departments
  console.log(' └─ Creating Departments...');
  const departmentsData = [
    { code: 'CNTT', name: 'Khoa Công nghệ thông tin' },
    { code: 'DTVT', name: 'Khoa Điện tử viễn thông' },
    { code: 'AI-DS', name: 'Khoa Trí tuệ nhân tạo & Khảo thí dữ liệu' },
    { code: 'ATTT', name: 'Khoa An toàn thông tin' },
    { code: 'KTS', name: 'Khoa Kinh tế số & Thương mại điện tử' },
  ];

  const deptMap: Record<string, number> = {};
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
    deptMap[d.code] = dept.id;
  }

  // 3. Classes
  console.log(' └─ Creating Classes...');
  const classesData = [
    { code: 'CNTT-K65', name: 'Lớp Công nghệ thông tin K65', deptCode: 'CNTT' },
    { code: 'CNTT-K66', name: 'Lớp Công nghệ thông tin K66', deptCode: 'CNTT' },
    { code: 'DTVT-K65', name: 'Lớp Điện tử viễn thông K65', deptCode: 'DTVT' },
    { code: 'AI-K66', name: 'Lớp Trí tuệ nhân tạo K66', deptCode: 'AI-DS' },
    { code: 'ATTT-K65', name: 'Lớp An toàn thông tin K65', deptCode: 'ATTT' },
    { code: 'KTS-K66', name: 'Lớp Kinh tế số K66', deptCode: 'KTS' },
  ];

  const classMap: Record<string, number> = {};
  for (const c of classesData) {
    const cls = await prisma.class.upsert({
      where: { code: c.code },
      update: { name: c.name, departmentId: deptMap[c.deptCode] },
      create: { code: c.code, name: c.name, departmentId: deptMap[c.deptCode] },
    });
    classMap[c.code] = cls.id;
  }

  // 4. Teachers Profile
  console.log(' └─ Creating Teacher Profiles...');
  for (let idx = 0; idx < teacherUsers.length; idx++) {
    const t = teacherUsers[idx];
    const teacherCode = t.code;
    const existing = await prisma.teacher.findFirst({ where: { userId: t.userId } });
    if (existing) {
      await prisma.teacher.update({
        where: { id: existing.id },
        data: { fullName: t.name, degree: t.degree, departmentId: deptMap[t.deptCode] },
      });
    } else {
      await prisma.teacher.create({
        data: {
          teacherCode,
          fullName: t.name,
          degree: t.degree,
          email: t.email,
          phone: `091234560${idx + 1}`,
          departmentId: deptMap[t.deptCode],
          userId: t.userId,
        },
      });
    }
  }

  // 5. Students & Users
  console.log(' └─ Creating Students...');
  const studentsList = [
    { username: 'student1', code: 'SV2026001', name: 'Lê Văn C', gender: 'Nam', dob: '2004-03-15', email: 'levanc@student.edu.vn', classCode: 'CNTT-K65' },
    { username: 'student2', code: 'SV2026002', name: 'Phạm Thị D', gender: 'Nữ', dob: '2004-07-22', email: 'phamthid@student.edu.vn', classCode: 'CNTT-K65' },
    { username: 'student3', code: 'SV2026003', name: 'Hoàng Văn E', gender: 'Nam', dob: '2004-11-05', email: 'hoangvane@student.edu.vn', classCode: 'DTVT-K65' },
    { username: 'student4', code: 'SV2026004', name: 'Vũ Thị F', gender: 'Nữ', dob: '2004-01-30', email: 'vuthif@student.edu.vn', classCode: 'DTVT-K65' },
    { username: 'student5', code: 'SV2026005', name: 'Đặng Tuấn G', gender: 'Nam', dob: '2005-05-12', email: 'dangtuang@student.edu.vn', classCode: 'CNTT-K66' },
    { username: 'student6', code: 'SV2026006', name: 'Nguyễn Thị H', gender: 'Nữ', dob: '2005-09-18', email: 'nguyenthih@student.edu.vn', classCode: 'CNTT-K66' },
    { username: 'student7', code: 'SV2026007', name: 'Bùi Bảo I', gender: 'Nam', dob: '2005-02-14', email: 'buibaoi@student.edu.vn', classCode: 'AI-K66' },
    { username: 'student8', code: 'SV2026008', name: 'Trịnh Khánh K', gender: 'Nữ', dob: '2004-12-01', email: 'trinhkhanhk@student.edu.vn', classCode: 'ATTT-K65' },
  ];

  for (const s of studentsList) {
    const su = await prisma.user.upsert({
      where: { username: s.username },
      update: {},
      create: {
        username: s.username,
        password: hashedPassword,
        email: s.email,
        role: 'STUDENT',
        status: 'ACTIVE',
      },
    });

    const existingStudent = await prisma.student.findFirst({ where: { userId: su.id } });
    if (existingStudent) {
      await prisma.student.update({
        where: { id: existingStudent.id },
        data: { fullName: s.name, classId: classMap[s.classCode] },
      });
    } else {
      await prisma.student.create({
        data: {
          studentCode: s.code,
          fullName: s.name,
          gender: s.gender,
          dateOfBirth: new Date(s.dob),
          email: s.email,
          phone: `098765430${s.code.slice(-1)}`,
          classId: classMap[s.classCode],
          userId: su.id,
        },
      });
    }
  }

  // 6. Subjects & Chapters
  console.log(' └─ Creating Subjects & Chapters...');
  const subjectsData = [
    {
      code: 'INT1001',
      name: 'Lập trình hướng đối tượng',
      credits: 3,
      deptCode: 'CNTT',
      chapters: [
        { code: 'CH01', name: 'Chương 1: Tổng quan OOP & Lớp đối tượng', order: 1 },
        { code: 'CH02', name: 'Chương 2: Tính Đóng gói & Kế thừa', order: 2 },
        { code: 'CH03', name: 'Chương 3: Tính Đa hình & Phân lớp Trừu tượng', order: 3 },
        { code: 'CH04', name: 'Chương 4: Design Patterns & SOLID', order: 4 },
      ],
    },
    {
      code: 'INT1002',
      name: 'Cơ sở dữ liệu',
      credits: 3,
      deptCode: 'CNTT',
      chapters: [
        { code: 'CH01', name: 'Chương 1: Tổng quan Hệ CSDL & Mô hình ER', order: 1 },
        { code: 'CH02', name: 'Chương 2: Mô hình quan hệ & Đại số quan hệ', order: 2 },
        { code: 'CH03', name: 'Chương 3: Ngôn ngữ SQL & Truy vấn dữ liệu', order: 3 },
        { code: 'CH04', name: 'Chương 4: Chuẩn hóa dữ liệu 1NF - 3NF - BCNF', order: 4 },
      ],
    },
    {
      code: 'INT1003',
      name: 'Mạng máy tính',
      credits: 3,
      deptCode: 'DTVT',
      chapters: [
        { code: 'CH01', name: 'Chương 1: Tổng quan Mô hình OSI & TCP/IP', order: 1 },
        { code: 'CH02', name: 'Chương 2: Tầng Ứng dụng & Giao thức HTTP/DNS', order: 2 },
        { code: 'CH03', name: 'Chương 3: Tầng Mạng & Địa chỉ IPv4/IPv6', order: 3 },
      ],
    },
    {
      code: 'INT1004',
      name: 'An toàn thông tin',
      credits: 3,
      deptCode: 'ATTT',
      chapters: [
        { code: 'CH01', name: 'Chương 1: Tổng quan Mật mã học & Mã hóa đối xứng', order: 1 },
        { code: 'CH02', name: 'Chương 2: Mã hóa bất đối xứng RSA & Chữ ký số', order: 2 },
        { code: 'CH03', name: 'Chương 3: An toàn ứng dụng Web & SQL Injection', order: 3 },
      ],
    },
    {
      code: 'INT1005',
      name: 'Trí tuệ nhân tạo',
      credits: 3,
      deptCode: 'AI-DS',
      chapters: [
        { code: 'CH01', name: 'Chương 1: Khái niệm AI & Giải thuật Tìm kiếm', order: 1 },
        { code: 'CH02', name: 'Chương 2: Học máy có giám sát (Supervised Learning)', order: 2 },
        { code: 'CH03', name: 'Chương 3: Mạng Nơ-ron Nhân tạo (Neural Networks)', order: 3 },
      ],
    },
  ];

  const subjectMap: Record<string, number> = {};
  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: { subjectCode: s.code },
      update: { subjectName: s.name, credits: s.credits, departmentId: deptMap[s.deptCode] },
      create: {
        subjectCode: s.code,
        subjectName: s.name,
        credits: s.credits,
        departmentId: deptMap[s.deptCode],
      },
    });
    subjectMap[s.code] = sub.id;

    for (const ch of s.chapters) {
      const existingCh = await prisma.chapter.findFirst({
        where: { subjectId: sub.id, code: ch.code },
      });
      if (!existingCh) {
        await prisma.chapter.create({
          data: {
            subjectId: sub.id,
            code: ch.code,
            name: ch.name,
            order: ch.order,
          },
        });
      }
    }
  }

  // 7. Exam Rooms
  console.log(' └─ Creating Exam Rooms...');
  const roomsData = [
    { roomCode: 'P101', roomName: 'Phòng thi P101', building: 'Nhà A2', capacity: 40, roomType: 'THI_LY_THUYET', status: 'AVAILABLE' },
    { roomCode: 'P102', roomName: 'Phòng thi P102', building: 'Nhà A2', capacity: 40, roomType: 'THI_LY_THUYET', status: 'AVAILABLE' },
    { roomCode: 'P201', roomName: 'Phòng thi P201', building: 'Nhà A2', capacity: 50, roomType: 'THI_LY_THUYET', status: 'AVAILABLE' },
    { roomCode: 'PM201', roomName: 'Phòng Máy PM201', building: 'Nhà B1', capacity: 40, roomType: 'THI_MAY_TINH', status: 'AVAILABLE' },
    { roomCode: 'PM202', roomName: 'Phòng Máy PM202', building: 'Nhà B1', capacity: 40, roomType: 'THI_MAY_TINH', status: 'AVAILABLE' },
    { roomCode: 'HT-A2', roomName: 'Hội trường A2', building: 'Nhà A2', capacity: 100, roomType: 'THI_TAP_TRUNG', status: 'AVAILABLE' },
  ];

  const roomMap: Record<string, number> = {};
  for (const r of roomsData) {
    const room = await prisma.examRoom.upsert({
      where: { roomCode: r.roomCode },
      update: { roomName: r.roomName, capacity: r.capacity },
      create: r,
    });
    roomMap[r.roomCode] = room.id;
  }

  // 8. Exam Period & Schedules
  console.log(' └─ Creating Exam Periods & Schedules...');
  const examPeriod = await prisma.examPeriod.upsert({
    where: { id: 1 },
    update: { name: 'Kỳ thi Cuối học kỳ 1 (2025-2026)', status: 'ONGOING' },
    create: {
      name: 'Kỳ thi Cuối học kỳ 1 (2025-2026)',
      semester: 'HK1',
      schoolYear: '2025-2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-30'),
      status: 'ONGOING',
    },
  });

  const oopSchedule = await prisma.examSchedule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      examPeriodId: examPeriod.id,
      subjectId: subjectMap['INT1001'],
      examDate: new Date('2026-08-15'),
      startTime: '08:00',
      endTime: '09:30',
      examType: 'TRAC_NGHIEM',
      status: 'SCHEDULED',
      note: 'Thi trắc nghiệm tập trung trên máy tính',
    },
  });

  const dbSchedule = await prisma.examSchedule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      examPeriodId: examPeriod.id,
      subjectId: subjectMap['INT1002'],
      examDate: new Date('2026-08-18'),
      startTime: '10:00',
      endTime: '11:30',
      examType: 'TRAC_NGHIEM',
      status: 'SCHEDULED',
      note: 'Thi trắc nghiệm tập trung',
    },
  });

  console.log('✅ Rich demonstration database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
