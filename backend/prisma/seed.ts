// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding COMPREHENSIVE FULL DEMO DATA...');

  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. ADMIN USER
  console.log(' └─ Admin User...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword },
    create: { username: 'admin', password: adminPassword, email: 'admin@school.edu.vn', role: 'ADMIN', status: 'ACTIVE' },
  });

  // 2. DEPARTMENTS
  console.log(' └─ 5 Departments...');
  const departmentsData = [
    { code: 'CNTT', name: 'Khoa Công nghệ thông tin' },
    { code: 'DTVT', name: 'Khoa Điện tử viễn thông' },
    { code: 'AI-DS', name: 'Khoa Trí tuệ nhân tạo & Khoa học dữ liệu' },
    { code: 'ATTT', name: 'Khoa An toàn thông tin' },
    { code: 'KTS', name: 'Khoa Kinh tế số & Thương mại điện tử' },
  ];
  const deptMap: Record<string, number> = {};
  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({ where: { code: d.code }, update: { name: d.name }, create: d });
    deptMap[d.code] = dept.id;
  }

  // 3. CLASSES (4 lớp mỗi khoa = 20 lớp)
  console.log(' └─ 20 Classes...');
  const classesData = [
    // CNTT
    { code: 'CNTT-K64A', name: 'CNTT K64 - Nhóm A', deptCode: 'CNTT' },
    { code: 'CNTT-K64B', name: 'CNTT K64 - Nhóm B', deptCode: 'CNTT' },
    { code: 'CNTT-K65', name: 'CNTT K65', deptCode: 'CNTT' },
    { code: 'CNTT-K66', name: 'CNTT K66', deptCode: 'CNTT' },
    // DTVT
    { code: 'DTVT-K64', name: 'Điện tử Viễn thông K64', deptCode: 'DTVT' },
    { code: 'DTVT-K65', name: 'Điện tử Viễn thông K65', deptCode: 'DTVT' },
    { code: 'DTVT-K66', name: 'Điện tử Viễn thông K66', deptCode: 'DTVT' },
    { code: 'DTVT-K67', name: 'Điện tử Viễn thông K67', deptCode: 'DTVT' },
    // AI-DS
    { code: 'AI-K64', name: 'Trí tuệ nhân tạo K64', deptCode: 'AI-DS' },
    { code: 'AI-K65', name: 'Trí tuệ nhân tạo K65', deptCode: 'AI-DS' },
    { code: 'AI-K66', name: 'Trí tuệ nhân tạo K66', deptCode: 'AI-DS' },
    { code: 'AI-K67', name: 'Trí tuệ nhân tạo K67', deptCode: 'AI-DS' },
    // ATTT
    { code: 'ATTT-K64', name: 'An toàn thông tin K64', deptCode: 'ATTT' },
    { code: 'ATTT-K65', name: 'An toàn thông tin K65', deptCode: 'ATTT' },
    { code: 'ATTT-K66', name: 'An toàn thông tin K66', deptCode: 'ATTT' },
    { code: 'ATTT-K67', name: 'An toàn thông tin K67', deptCode: 'ATTT' },
    // KTS
    { code: 'KTS-K64', name: 'Kinh tế số K64', deptCode: 'KTS' },
    { code: 'KTS-K65', name: 'Kinh tế số K65', deptCode: 'KTS' },
    { code: 'KTS-K66', name: 'Kinh tế số K66', deptCode: 'KTS' },
    { code: 'KTS-K67', name: 'Kinh tế số K67', deptCode: 'KTS' },
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

  // 4. TEACHERS (4 GV mỗi khoa = 20 Giảng viên)
  console.log(' └─ 20 Teachers...');
  const teacherList = [
    // CNTT
    { code: 'GV001', name: 'GS.TS Nguyễn Văn An', email: 'nguyenvanan@school.edu.vn', degree: 'GS.TS', phone: '0912345601', deptCode: 'CNTT' },
    { code: 'GV002', name: 'TS. Trần Thị Bình', email: 'tranthibinh@school.edu.vn', degree: 'TS', phone: '0912345602', deptCode: 'CNTT' },
    { code: 'GV003', name: 'PGS.TS Lê Quang Cường', email: 'lequangcuong@school.edu.vn', degree: 'PGS.TS', phone: '0912345603', deptCode: 'CNTT' },
    { code: 'GV011', name: 'TS. Phạm Minh Hùng', email: 'phamminhhung@school.edu.vn', degree: 'TS', phone: '0912345611', deptCode: 'CNTT' },
    // DTVT
    { code: 'GV004', name: 'TS. Đỗ Minh Đức', email: 'dominhduc@school.edu.vn', degree: 'TS', phone: '0912345604', deptCode: 'DTVT' },
    { code: 'GV005', name: 'ThS. Phạm Thu Hà', email: 'phamthuha@school.edu.vn', degree: 'ThS', phone: '0912345605', deptCode: 'DTVT' },
    { code: 'GV012', name: 'PGS.TS Trịnh Văn Bảo', email: 'trinhvanbao@school.edu.vn', degree: 'PGS.TS', phone: '0912345612', deptCode: 'DTVT' },
    { code: 'GV013', name: 'TS. Đặng Thị Loan', email: 'dangthiloan@school.edu.vn', degree: 'TS', phone: '0912345613', deptCode: 'DTVT' },
    // AI-DS
    { code: 'GV006', name: 'TS. Vũ Hoàng Long', email: 'vuhoanglong@school.edu.vn', degree: 'TS', phone: '0912345606', deptCode: 'AI-DS' },
    { code: 'GV007', name: 'ThS. Bùi Thị Mai', email: 'buithimai@school.edu.vn', degree: 'ThS', phone: '0912345607', deptCode: 'AI-DS' },
    { code: 'GV014', name: 'TS. Hồ Văn Nam', email: 'hovannam@school.edu.vn', degree: 'TS', phone: '0912345614', deptCode: 'AI-DS' },
    { code: 'GV015', name: 'PGS.TS Đỗ Hoàng Anh', email: 'dohoanganh@school.edu.vn', degree: 'PGS.TS', phone: '0912345615', deptCode: 'AI-DS' },
    // ATTT
    { code: 'GV008', name: 'TS. Hoàng Anh Nam', email: 'hoanganhnam@school.edu.vn', degree: 'TS', phone: '0912345608', deptCode: 'ATTT' },
    { code: 'GV009', name: 'ThS. Ngô Thị Oanh', email: 'ngothioanh@school.edu.vn', degree: 'ThS', phone: '0912345609', deptCode: 'ATTT' },
    { code: 'GV016', name: 'TS. Vũ Việt Cường', email: 'vuvietcuong@school.edu.vn', degree: 'TS', phone: '0912345616', deptCode: 'ATTT' },
    { code: 'GV017', name: 'ThS. Nguyễn Đức Thắng', email: 'nguyenducthang@school.edu.vn', degree: 'ThS', phone: '0912345617', deptCode: 'ATTT' },
    // KTS
    { code: 'GV010', name: 'TS. Phan Văn Phúc', email: 'phanvanphuc@school.edu.vn', degree: 'TS', phone: '0912345610', deptCode: 'KTS' },
    { code: 'GV018', name: 'ThS. Lê Thị Phương', email: 'lethiphuong@school.edu.vn', degree: 'ThS', phone: '0912345618', deptCode: 'KTS' },
    { code: 'GV019', name: 'TS. Nguyễn Hoàng Minh', email: 'nguyenhoangminh@school.edu.vn', degree: 'TS', phone: '0912345619', deptCode: 'KTS' },
    { code: 'GV020', name: 'PGS.TS Trần Thanh Hải', email: 'tranthanhhai@school.edu.vn', degree: 'PGS.TS', phone: '0912345620', deptCode: 'KTS' },
  ];

  const teacherIdMap: Record<string, number> = {};
  for (const t of teacherList) {
    const u = await prisma.user.upsert({
      where: { username: t.code },
      update: {},
      create: { username: t.code, password: await bcrypt.hash(t.code, 10), email: t.email, role: 'TEACHER', status: 'ACTIVE' },
    });
    const existing = await prisma.teacher.findFirst({ where: { userId: u.id } });
    if (existing) {
      const updated = await prisma.teacher.update({ where: { id: existing.id }, data: { fullName: t.name, degree: t.degree, departmentId: deptMap[t.deptCode] } });
      teacherIdMap[t.code] = updated.id;
    } else {
      const created = await prisma.teacher.create({
        data: { teacherCode: t.code, fullName: t.name, degree: t.degree, email: t.email, phone: t.phone, departmentId: deptMap[t.deptCode], userId: u.id },
      });
      teacherIdMap[t.code] = created.id;
    }
  }

  // 5. SUBJECTS (4-5 Môn mỗi khoa = 21 Môn học)
  console.log(' └─ 21 Subjects...');
  const subjectsData = [
    // CNTT
    { code: 'INT1001', name: 'Lập trình hướng đối tượng', credits: 3, deptCode: 'CNTT' },
    { code: 'INT1002', name: 'Cơ sở dữ liệu', credits: 3, deptCode: 'CNTT' },
    { code: 'INT1003', name: 'Cấu trúc dữ liệu & Giải thuật', credits: 3, deptCode: 'CNTT' },
    { code: 'INT1004', name: 'Phát triển ứng dụng Web', credits: 4, deptCode: 'CNTT' },
    { code: 'INT1005', name: 'Kiến trúc phần mềm', credits: 3, deptCode: 'CNTT' },
    // DTVT
    { code: 'EEE1001', name: 'Mạng máy tính & Truyền thông', credits: 3, deptCode: 'DTVT' },
    { code: 'EEE1002', name: 'Xử lý tín hiệu số', credits: 3, deptCode: 'DTVT' },
    { code: 'EEE1003', name: 'Hệ thống nhúng & IoT', credits: 3, deptCode: 'DTVT' },
    { code: 'EEE1004', name: 'Kỹ thuật vi điều khiển', credits: 3, deptCode: 'DTVT' },
    // AI-DS
    { code: 'AI1001', name: 'Trí tuệ nhân tạo', credits: 3, deptCode: 'AI-DS' },
    { code: 'AI1002', name: 'Học máy & Học sâu', credits: 4, deptCode: 'AI-DS' },
    { code: 'AI1003', name: 'Khai phá dữ liệu lớn', credits: 3, deptCode: 'AI-DS' },
    { code: 'AI1004', name: 'Xử lý ngôn ngữ tự nhiên (NLP)', credits: 3, deptCode: 'AI-DS' },
    // ATTT
    { code: 'SEC1001', name: 'An toàn thông tin nâng cao', credits: 3, deptCode: 'ATTT' },
    { code: 'SEC1002', name: 'Mật mã học & Ứng dụng', credits: 3, deptCode: 'ATTT' },
    { code: 'SEC1003', name: 'Kiểm thử xâm nhập (Pentest)', credits: 3, deptCode: 'ATTT' },
    { code: 'SEC1004', name: 'Bảo mật hệ thống mạng', credits: 3, deptCode: 'ATTT' },
    // KTS
    { code: 'BUS1001', name: 'Thương mại điện tử', credits: 3, deptCode: 'KTS' },
    { code: 'BUS1002', name: 'Kinh tế số', credits: 3, deptCode: 'KTS' },
    { code: 'BUS1003', name: 'Marketing số & SEO', credits: 3, deptCode: 'KTS' },
    { code: 'BUS1004', name: 'Quản trị chuỗi cung ứng số', credits: 3, deptCode: 'KTS' },
  ];
  const subjectMap: Record<string, number> = {};
  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: { subjectCode: s.code },
      update: { subjectName: s.name, credits: s.credits, departmentId: deptMap[s.deptCode] },
      create: { subjectCode: s.code, subjectName: s.name, credits: s.credits, departmentId: deptMap[s.deptCode] },
    });
    subjectMap[s.code] = sub.id;
  }

  // 6. STUDENTS (5-6 SV mỗi lớp = 105 Sinh viên)
  console.log(' └─ 105 Students...');
  const studentsRaw: any[] = [];
  let svCounter = 1;

  for (const cls of classesData) {
    for (let i = 1; i <= 5; i++) {
      const code = `SV${cls.code.replace(/[^A-Z0-9]/g, '')}${String(i).padStart(2, '0')}`;
      const username = `sv${String(svCounter).padStart(3, '0')}`;
      const nameList = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
      const middleList = ['Văn', 'Thị', 'Quang', 'Minh', 'Đức', 'Thu', 'Ngọc', 'Hoàng', 'Bảo', 'Kim'];
      const lastList = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Giang', 'Hải', 'Khang', 'Linh', 'Minh', 'Nam', 'Oanh', 'Phương', 'Quân', 'Sơn', 'Thành', 'Uyên', 'Vinh'];

      const fn = `${nameList[svCounter % nameList.length]} ${middleList[(svCounter * 2) % middleList.length]} ${lastList[(svCounter * 3) % lastList.length]}`;
      const gender = svCounter % 2 === 0 ? 'Nữ' : 'Nam';

      studentsRaw.push({
        u: username,
        code,
        name: fn,
        gender,
        dob: `200${3 + (svCounter % 2)}-0${1 + (svCounter % 9)}-${10 + (svCounter % 15)}`,
        email: `${username}@sv.edu.vn`,
        cls: cls.code,
      });
      svCounter++;
    }
  }

  const studentIdMap: Record<string, number> = {};
  for (const s of studentsRaw) {
    const u = await prisma.user.upsert({
      where: { username: s.u },
      update: {},
      create: { username: s.u, password: hashedPassword, email: s.email, role: 'STUDENT', status: 'ACTIVE' },
    });
    const existing = await prisma.student.findFirst({ where: { userId: u.id } });
    if (existing) {
      studentIdMap[s.code] = existing.id;
      await prisma.student.update({ where: { id: existing.id }, data: { fullName: s.name, classId: classMap[s.cls] } });
    } else {
      const created = await prisma.student.create({
        data: { studentCode: s.code, fullName: s.name, gender: s.gender, dateOfBirth: new Date(s.dob), email: s.email, phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`, classId: classMap[s.cls], userId: u.id },
      });
      studentIdMap[s.code] = created.id;
    }
  }

  // 7. CURRICULUM (MajorSubject)
  console.log(' └─ Curriculum (MajorSubject)...');
  for (const sub of subjectsData) {
    const existing = await prisma.majorSubject.findFirst({
      where: { departmentId: deptMap[sub.deptCode], subjectId: subjectMap[sub.code] },
    });
    if (!existing) {
      await prisma.majorSubject.create({
        data: { departmentId: deptMap[sub.deptCode], subjectId: subjectMap[sub.code], type: 'MANDATORY', recommendedSemester: 1 },
      });
    }
  }

  // 8. STUDENT-SUBJECT ENROLLMENTS (FULL 100% Ma trận: 100% SV của Khoa đăng ký 100% Môn của Khoa)
  console.log(' └─ StudentSubject (FULL matrix enrollments)...');
  const deptSubjectsMap: Record<string, string[]> = {
    'CNTT': ['INT1001', 'INT1002', 'INT1003', 'INT1004', 'INT1005'],
    'DTVT': ['EEE1001', 'EEE1002', 'EEE1003', 'EEE1004'],
    'AI-DS': ['AI1001', 'AI1002', 'AI1003', 'AI1004'],
    'ATTT': ['SEC1001', 'SEC1002', 'SEC1003', 'SEC1004'],
    'KTS': ['BUS1001', 'BUS1002', 'BUS1003', 'BUS1004'],
  };

  let totalEnrollmentsCreated = 0;
  for (const s of studentsRaw) {
    const studentId = studentIdMap[s.code];
    if (!studentId) continue;
    const clsObj = classesData.find((c) => c.code === s.cls);
    if (!clsObj) continue;

    const subsForDept = deptSubjectsMap[clsObj.deptCode] || [];
    for (const subCode of subsForDept) {
      const subjectId = subjectMap[subCode];
      if (!subjectId) continue;
      const existing = await prisma.studentSubject.findFirst({
        where: { studentId, subjectId, semester: 'HK1', schoolYear: '2025-2026' },
      });
      if (!existing) {
        await prisma.studentSubject.create({
          data: { studentId, subjectId, semester: 'HK1', schoolYear: '2025-2026', status: 'ELIGIBLE' },
        });
      }
      totalEnrollmentsCreated++;
    }
  }

  // 9. EXAM ROOMS
  console.log(' └─ 8 Exam Rooms...');
  const roomsData = [
    { code: 'P101', name: 'Phòng 101 - A2', building: 'Nhà A2', capacity: 15 },
    { code: 'P102', name: 'Phòng 102 - A2', building: 'Nhà A2', capacity: 15 },
    { code: 'P201', name: 'Phòng 201 - A2', building: 'Nhà A2', capacity: 15 },
    { code: 'P202', name: 'Phòng 202 - A2', building: 'Nhà A2', capacity: 15 },
    { code: 'PM201', name: 'Phòng Máy 201 - B1', building: 'Nhà B1', capacity: 15 },
    { code: 'PM202', name: 'Phòng Máy 202 - B1', building: 'Nhà B1', capacity: 15 },
    { code: 'HOD101', name: 'Hội trường 101 - C1', building: 'Nhà C1', capacity: 15 },
    { code: 'HOD102', name: 'Hội trường 102 - C1', building: 'Nhà C1', capacity: 15 },
  ];
  const roomMap: Record<string, number> = {};
  for (const r of roomsData) {
    const rm = await prisma.examRoom.upsert({ where: { roomCode: r.code }, update: { roomName: r.name, capacity: r.capacity }, create: { roomCode: r.code, roomName: r.name, building: r.building, capacity: r.capacity } });
    roomMap[r.code] = rm.id;
  }

  // 10. EXAM PERIOD
  let examPeriod = await prisma.examPeriod.findFirst({ where: { semester: 'HK1', schoolYear: '2025-2026' } });
  if (!examPeriod) {
    examPeriod = await prisma.examPeriod.create({
      data: { name: 'Kỳ thi Học kỳ 1 (2025-2026)', semester: 'HK1', schoolYear: '2025-2026', startDate: new Date('2026-06-01'), endDate: new Date('2026-06-30'), status: 'ACTIVE' },
    });
  }

  // 11. EXAM SCHEDULES & SUPERVISORS FOR ALL SUBJECTS
  console.log(' └─ Exam Schedules + Rooms + Supervisors + Room Students for ALL Subjects...');
  const allSubjects = await prisma.subject.findMany();
  const allTeachers = await prisma.teacher.findMany();
  const rooms = await prisma.examRoom.findMany();

  let schedCount = 0;
  for (let idx = 0; idx < allSubjects.length; idx++) {
    const sub = allSubjects[idx];
    const dayOffset = (idx % 15) + 1;
    const examDate = new Date(`2026-06-${String(dayOffset).padStart(2, '0')}`);
    const start = idx % 2 === 0 ? '08:00' : '13:30';
    const end = idx % 2 === 0 ? '10:00' : '15:30';

    let sched = await prisma.examSchedule.findFirst({
      where: { examPeriodId: examPeriod.id, subjectId: sub.id },
    });
    if (!sched) {
      sched = await prisma.examSchedule.create({
        data: {
          examPeriodId: examPeriod.id,
          subjectId: sub.id,
          examDate,
          startTime: start,
          endTime: end,
          examType: 'OFFLINE_PAPER',
          status: 'PUBLISHED',
        },
      });
    }

    // Pick room
    const rmObj = rooms[idx % rooms.length];
    let schedRoom = await prisma.examScheduleRoom.findFirst({
      where: { examScheduleId: sched.id, roomId: rmObj.id },
    });
    if (!schedRoom) {
      schedRoom = await prisma.examScheduleRoom.create({
        data: { examScheduleId: sched.id, roomId: rmObj.id },
      });
    }

    // Assign 2 supervisors for this room
    const t1 = allTeachers[(idx * 2) % allTeachers.length];
    const t2 = allTeachers[(idx * 2 + 1) % allTeachers.length];

    const exSup1 = await prisma.examSupervisor.findFirst({
      where: { examScheduleRoomId: schedRoom.id, teacherId: t1.id },
    });
    if (!exSup1) {
      await prisma.examSupervisor.create({
        data: { examScheduleRoomId: schedRoom.id, teacherId: t1.id, role: 'CHINH', status: 'CONFIRMED' },
      });
    }

    const exSup2 = await prisma.examSupervisor.findFirst({
      where: { examScheduleRoomId: schedRoom.id, teacherId: t2.id },
    });
    if (!exSup2) {
      await prisma.examSupervisor.create({
        data: { examScheduleRoomId: schedRoom.id, teacherId: t2.id, role: 'PHU', status: 'CONFIRMED' },
      });
    }

    // Assign students to exam room
    const enrs = await prisma.studentSubject.findMany({
      where: { subjectId: sub.id },
      take: 20,
    });

    let seat = 1;
    for (const enr of enrs) {
      const exSt = await prisma.examRoomStudent.findFirst({
        where: { examScheduleRoomId: schedRoom.id, studentId: enr.studentId },
      });
      if (!exSt) {
        await prisma.examRoomStudent.create({
          data: {
            examScheduleRoomId: schedRoom.id,
            studentId: enr.studentId,
            examNumber: `${sub.subjectCode}-${String(seat).padStart(3, '0')}`,
            seatNumber: seat,
            status: 'ASSIGNED',
          },
        });
      }
      seat++;
    }
    schedCount++;
  }

  // 12. GRADE APPEALS (Không seed mẫu đơn phúc khảo, để sinh viên tự tạo)
  console.log(' └─ Grade Appeals (Đơn phúc khảo: Trống, chờ sinh viên gửi)...');

  const finalEnrollments = await prisma.studentSubject.count();
  const finalSupervisors = await prisma.examSupervisor.count();

  console.log('✅ COMPREHENSIVE FULL DATA SEEDED SUCCESSFULLY!');
  console.log(`   📚 ${departmentsData.length} Khoa`);
  console.log(`   🏛️  ${classesData.length} Lớp học`);
  console.log(`   👨‍🏫 ${teacherList.length} Giảng viên`);
  console.log(`   👨‍🎓 ${studentsRaw.length} Sinh viên`);
  console.log(`   📖 ${subjectsData.length} Môn học`);
  console.log(`   📝 ${finalEnrollments} Lượt đăng ký môn`);
  console.log(`   🗓️  ${schedCount} Lịch thi`);
  console.log(`   🏫 ${roomsData.length} Phòng thi`);
  console.log(`   👮 ${finalSupervisors} Phân công coi thi`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
