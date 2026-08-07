// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FULL demonstration data...');

  const hashedPassword = await bcrypt.hash('123456', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // ─────────────────────────────────────────
  // 1. ADMIN USER
  // ─────────────────────────────────────────
  console.log(' └─ Users: Admin...');
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminPassword },
    create: { username: 'admin', password: adminPassword, email: 'admin@school.edu.vn', role: 'ADMIN', status: 'ACTIVE' },
  });

  // ─────────────────────────────────────────
  // 2. DEPARTMENTS
  // ─────────────────────────────────────────
  console.log(' └─ Departments...');
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

  // ─────────────────────────────────────────
  // 3. CLASSES (4-5 lớp mỗi khoa)
  // ─────────────────────────────────────────
  console.log(' └─ Classes...');
  const classesData = [
    { code: 'CNTT-K64A', name: 'CNTT K64 - Nhóm A', deptCode: 'CNTT' },
    { code: 'CNTT-K64B', name: 'CNTT K64 - Nhóm B', deptCode: 'CNTT' },
    { code: 'CNTT-K65', name: 'CNTT K65', deptCode: 'CNTT' },
    { code: 'CNTT-K66', name: 'CNTT K66', deptCode: 'CNTT' },
    { code: 'DTVT-K64', name: 'Điện tử Viễn thông K64', deptCode: 'DTVT' },
    { code: 'DTVT-K65', name: 'Điện tử Viễn thông K65', deptCode: 'DTVT' },
    { code: 'AI-K65', name: 'Trí tuệ nhân tạo K65', deptCode: 'AI-DS' },
    { code: 'AI-K66', name: 'Trí tuệ nhân tạo K66', deptCode: 'AI-DS' },
    { code: 'ATTT-K65', name: 'An toàn thông tin K65', deptCode: 'ATTT' },
    { code: 'ATTT-K66', name: 'An toàn thông tin K66', deptCode: 'ATTT' },
    { code: 'KTS-K65', name: 'Kinh tế số K65', deptCode: 'KTS' },
    { code: 'KTS-K66', name: 'Kinh tế số K66', deptCode: 'KTS' },
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

  // ─────────────────────────────────────────
  // 4. TEACHERS (2-3 GV mỗi khoa)
  // ─────────────────────────────────────────
  console.log(' └─ Teachers...');
  const teacherList = [
    { code: 'GV001', name: 'Nguyễn Văn An', email: 'nguyenvanan@school.edu.vn', degree: 'GS.TS', phone: '0912345601', deptCode: 'CNTT' },
    { code: 'GV002', name: 'Trần Thị Bình', email: 'tranthitinh@school.edu.vn', degree: 'TS', phone: '0912345602', deptCode: 'CNTT' },
    { code: 'GV003', name: 'Lê Quang Cường', email: 'lequangcuong@school.edu.vn', degree: 'PGS.TS', phone: '0912345603', deptCode: 'CNTT' },
    { code: 'GV004', name: 'Đỗ Minh Đức', email: 'dominhducuong@school.edu.vn', degree: 'TS', phone: '0912345604', deptCode: 'DTVT' },
    { code: 'GV005', name: 'Phạm Thu Hà', email: 'phamthuha@school.edu.vn', degree: 'ThS', phone: '0912345605', deptCode: 'DTVT' },
    { code: 'GV006', name: 'Vũ Hoàng Long', email: 'vuhoanglong@school.edu.vn', degree: 'TS', phone: '0912345606', deptCode: 'AI-DS' },
    { code: 'GV007', name: 'Bùi Thị Mai', email: 'buithimai@school.edu.vn', degree: 'ThS', phone: '0912345607', deptCode: 'AI-DS' },
    { code: 'GV008', name: 'Hoàng Anh Nam', email: 'hoanganhnam@school.edu.vn', degree: 'TS', phone: '0912345608', deptCode: 'ATTT' },
    { code: 'GV009', name: 'Ngô Thị Oanh', email: 'ngothioanh@school.edu.vn', degree: 'ThS', phone: '0912345609', deptCode: 'ATTT' },
    { code: 'GV010', name: 'Phan Văn Phúc', email: 'phanvanphuc@school.edu.vn', degree: 'TS', phone: '0912345610', deptCode: 'KTS' },
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

  // ─────────────────────────────────────────
  // 5. STUDENTS (5-7 SV mỗi lớp)
  // ─────────────────────────────────────────
  console.log(' └─ Students...');
  const studentsRaw = [
    // CNTT-K64A (6 SV)
    { u: 'sv001', code: 'SV2024001', name: 'Lê Văn Công', gender: 'Nam', dob: '2002-03-15', email: 'levancong@sv.edu.vn', cls: 'CNTT-K64A' },
    { u: 'sv002', code: 'SV2024002', name: 'Phạm Thị Dung', gender: 'Nữ', dob: '2002-07-22', email: 'phamthidung@sv.edu.vn', cls: 'CNTT-K64A' },
    { u: 'sv003', code: 'SV2024003', name: 'Hoàng Văn Em', gender: 'Nam', dob: '2002-11-05', email: 'hoangvanem@sv.edu.vn', cls: 'CNTT-K64A' },
    { u: 'sv004', code: 'SV2024004', name: 'Vũ Thị Phúc', gender: 'Nữ', dob: '2002-01-30', email: 'vuthiphuc@sv.edu.vn', cls: 'CNTT-K64A' },
    { u: 'sv005', code: 'SV2024005', name: 'Trần Quang Giao', gender: 'Nam', dob: '2002-05-12', email: 'tranquanggiao@sv.edu.vn', cls: 'CNTT-K64A' },
    { u: 'sv006', code: 'SV2024006', name: 'Nguyễn Thị Hoa', gender: 'Nữ', dob: '2002-09-18', email: 'nguyenthihoa@sv.edu.vn', cls: 'CNTT-K64A' },
    // CNTT-K64B (5 SV)
    { u: 'sv007', code: 'SV2024007', name: 'Đinh Bảo Khang', gender: 'Nam', dob: '2002-02-14', email: 'dinhhaokhang@sv.edu.vn', cls: 'CNTT-K64B' },
    { u: 'sv008', code: 'SV2024008', name: 'Lương Thị Liên', gender: 'Nữ', dob: '2002-12-01', email: 'luongthilien@sv.edu.vn', cls: 'CNTT-K64B' },
    { u: 'sv009', code: 'SV2024009', name: 'Đặng Văn Minh', gender: 'Nam', dob: '2002-04-20', email: 'dangvanminh@sv.edu.vn', cls: 'CNTT-K64B' },
    { u: 'sv010', code: 'SV2024010', name: 'Cao Thị Ngân', gender: 'Nữ', dob: '2002-08-10', email: 'caohthingan@sv.edu.vn', cls: 'CNTT-K64B' },
    { u: 'sv011', code: 'SV2024011', name: 'Bùi Hoàng Oanh', gender: 'Nam', dob: '2002-06-25', email: 'buihoangoanh@sv.edu.vn', cls: 'CNTT-K64B' },
    // CNTT-K65 (5 SV)
    { u: 'sv012', code: 'SV2025001', name: 'Phan Văn Phú', gender: 'Nam', dob: '2003-03-11', email: 'phanvanphu@sv.edu.vn', cls: 'CNTT-K65' },
    { u: 'sv013', code: 'SV2025002', name: 'Võ Thị Quyên', gender: 'Nữ', dob: '2003-07-08', email: 'vothiquyen@sv.edu.vn', cls: 'CNTT-K65' },
    { u: 'sv014', code: 'SV2025003', name: 'Hà Đức Sơn', gender: 'Nam', dob: '2003-11-15', email: 'haducson@sv.edu.vn', cls: 'CNTT-K65' },
    { u: 'sv015', code: 'SV2025004', name: 'Lý Thị Thảo', gender: 'Nữ', dob: '2003-01-22', email: 'lythithao@sv.edu.vn', cls: 'CNTT-K65' },
    { u: 'sv016', code: 'SV2025005', name: 'Trương Minh Tuấn', gender: 'Nam', dob: '2003-05-30', email: 'truongminhtuab@sv.edu.vn', cls: 'CNTT-K65' },
    // DTVT-K64 (4 SV)
    { u: 'sv017', code: 'SV2024101', name: 'Ngô Quốc Uy', gender: 'Nam', dob: '2002-04-05', email: 'ngoquocuy@sv.edu.vn', cls: 'DTVT-K64' },
    { u: 'sv018', code: 'SV2024102', name: 'Bùi Thị Vân', gender: 'Nữ', dob: '2002-10-12', email: 'buithivan@sv.edu.vn', cls: 'DTVT-K64' },
    { u: 'sv019', code: 'SV2024103', name: 'Đoàn Văn Xuân', gender: 'Nam', dob: '2002-06-28', email: 'doanvanxuan@sv.edu.vn', cls: 'DTVT-K64' },
    { u: 'sv020', code: 'SV2024104', name: 'Trịnh Thị Yến', gender: 'Nữ', dob: '2002-02-14', email: 'trinhthiyen@sv.edu.vn', cls: 'DTVT-K64' },
    // DTVT-K65 (4 SV)
    { u: 'sv021', code: 'SV2025101', name: 'Lê Thành Anh', gender: 'Nam', dob: '2003-07-19', email: 'lethanhanh@sv.edu.vn', cls: 'DTVT-K65' },
    { u: 'sv022', code: 'SV2025102', name: 'Nguyễn Thị Bắc', gender: 'Nữ', dob: '2003-11-03', email: 'nguyenthibac@sv.edu.vn', cls: 'DTVT-K65' },
    { u: 'sv023', code: 'SV2025103', name: 'Phạm Văn Cát', gender: 'Nam', dob: '2003-03-27', email: 'phamvancat@sv.edu.vn', cls: 'DTVT-K65' },
    // AI-K65 (4 SV)
    { u: 'sv024', code: 'SV2025201', name: 'Trần Thị Diễm', gender: 'Nữ', dob: '2003-09-14', email: 'tranthidiem@sv.edu.vn', cls: 'AI-K65' },
    { u: 'sv025', code: 'SV2025202', name: 'Vũ Hoàng Đạt', gender: 'Nam', dob: '2003-01-08', email: 'vuhoangdat@sv.edu.vn', cls: 'AI-K65' },
    { u: 'sv026', code: 'SV2025203', name: 'Lê Ngọc Ân', gender: 'Nữ', dob: '2003-05-20', email: 'lengocen@sv.edu.vn', cls: 'AI-K65' },
    // ATTT-K65 (4 SV)
    { u: 'sv027', code: 'SV2025301', name: 'Nguyễn Văn Gia', gender: 'Nam', dob: '2003-12-05', email: 'nguyenvangia@sv.edu.vn', cls: 'ATTT-K65' },
    { u: 'sv028', code: 'SV2025302', name: 'Trần Thị Hân', gender: 'Nữ', dob: '2003-04-17', email: 'tranthihan@sv.edu.vn', cls: 'ATTT-K65' },
    { u: 'sv029', code: 'SV2025303', name: 'Đỗ Quang Hùng', gender: 'Nam', dob: '2003-08-09', email: 'doquanghung@sv.edu.vn', cls: 'ATTT-K65' },
    // KTS-K65 (3 SV)
    { u: 'sv030', code: 'SV2025401', name: 'Phan Thị Iris', gender: 'Nữ', dob: '2003-02-28', email: 'phanthiiris@sv.edu.vn', cls: 'KTS-K65' },
    { u: 'sv031', code: 'SV2025402', name: 'Lương Văn Khoa', gender: 'Nam', dob: '2003-06-13', email: 'luongvankhoa@sv.edu.vn', cls: 'KTS-K65' },
    { u: 'sv032', code: 'SV2025403', name: 'Hồ Thị Lan', gender: 'Nữ', dob: '2003-10-01', email: 'hothilan@sv.edu.vn', cls: 'KTS-K65' },
  ];

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
        data: { studentCode: s.code, fullName: s.name, gender: s.gender, dateOfBirth: new Date(s.dob), email: s.email, phone: `09${s.code.slice(-8)}`, classId: classMap[s.cls], userId: u.id },
      });
      studentIdMap[s.code] = created.id;
    }
  }

  // ─────────────────────────────────────────
  // 6. SUBJECTS
  // ─────────────────────────────────────────
  console.log(' └─ Subjects...');
  const subjectsData = [
    { code: 'INT1001', name: 'Lập trình hướng đối tượng', credits: 3, deptCode: 'CNTT' },
    { code: 'INT1002', name: 'Cơ sở dữ liệu', credits: 3, deptCode: 'CNTT' },
    { code: 'INT1003', name: 'Cấu trúc dữ liệu & Giải thuật', credits: 3, deptCode: 'CNTT' },
    { code: 'INT1004', name: 'Phát triển ứng dụng Web', credits: 4, deptCode: 'CNTT' },
    { code: 'INT1005', name: 'Kiến trúc phần mềm', credits: 3, deptCode: 'CNTT' },
    { code: 'EEE1001', name: 'Mạng máy tính', credits: 3, deptCode: 'DTVT' },
    { code: 'EEE1002', name: 'Xử lý tín hiệu số', credits: 3, deptCode: 'DTVT' },
    { code: 'EEE1003', name: 'Hệ thống nhúng', credits: 3, deptCode: 'DTVT' },
    { code: 'AI1001', name: 'Trí tuệ nhân tạo', credits: 3, deptCode: 'AI-DS' },
    { code: 'AI1002', name: 'Học máy', credits: 3, deptCode: 'AI-DS' },
    { code: 'AI1003', name: 'Khai phá dữ liệu', credits: 3, deptCode: 'AI-DS' },
    { code: 'SEC1001', name: 'An toàn thông tin', credits: 3, deptCode: 'ATTT' },
    { code: 'SEC1002', name: 'Mật mã học', credits: 3, deptCode: 'ATTT' },
    { code: 'BUS1001', name: 'Thương mại điện tử', credits: 3, deptCode: 'KTS' },
    { code: 'BUS1002', name: 'Kinh tế số', credits: 3, deptCode: 'KTS' },
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

  // ─────────────────────────────────────────
  // 7. CURRICULUM (MajorSubject)
  // ─────────────────────────────────────────
  console.log(' └─ Curriculum (MajorSubject)...');
  const curriculumData = [
    // CNTT
    { deptCode: 'CNTT', subCode: 'INT1001', type: 'MANDATORY', sem: 1 },
    { deptCode: 'CNTT', subCode: 'INT1002', type: 'MANDATORY', sem: 2 },
    { deptCode: 'CNTT', subCode: 'INT1003', type: 'MANDATORY', sem: 2 },
    { deptCode: 'CNTT', subCode: 'INT1004', type: 'MANDATORY', sem: 3 },
    { deptCode: 'CNTT', subCode: 'INT1005', type: 'ELECTIVE', sem: 4 },
    // DTVT
    { deptCode: 'DTVT', subCode: 'EEE1001', type: 'MANDATORY', sem: 1 },
    { deptCode: 'DTVT', subCode: 'EEE1002', type: 'MANDATORY', sem: 2 },
    { deptCode: 'DTVT', subCode: 'EEE1003', type: 'ELECTIVE', sem: 3 },
    // AI-DS
    { deptCode: 'AI-DS', subCode: 'AI1001', type: 'MANDATORY', sem: 1 },
    { deptCode: 'AI-DS', subCode: 'AI1002', type: 'MANDATORY', sem: 2 },
    { deptCode: 'AI-DS', subCode: 'AI1003', type: 'ELECTIVE', sem: 3 },
    // ATTT
    { deptCode: 'ATTT', subCode: 'SEC1001', type: 'MANDATORY', sem: 1 },
    { deptCode: 'ATTT', subCode: 'SEC1002', type: 'MANDATORY', sem: 2 },
    // KTS
    { deptCode: 'KTS', subCode: 'BUS1001', type: 'MANDATORY', sem: 1 },
    { deptCode: 'KTS', subCode: 'BUS1002', type: 'MANDATORY', sem: 2 },
  ];
  for (const c of curriculumData) {
    const existing = await prisma.majorSubject.findFirst({ where: { departmentId: deptMap[c.deptCode], subjectId: subjectMap[c.subCode] } });
    if (!existing) {
      await prisma.majorSubject.create({ data: { departmentId: deptMap[c.deptCode], subjectId: subjectMap[c.subCode], type: c.type, recommendedSemester: c.sem } });
    }
  }

  // ─────────────────────────────────────────
  // 8. STUDENT-SUBJECT (Đăng ký môn)
  // ─────────────────────────────────────────
  console.log(' └─ StudentSubject (enrollments)...');
  const enrollments = [
    // CNTT-K64A students → môn CNTT HK1/2025-2026
    ...['SV2024001','SV2024002','SV2024003','SV2024004','SV2024005','SV2024006'].flatMap(code => [
      { studentCode: code, subCode: 'INT1001', sem: 'HK1', yr: '2025-2026' },
      { studentCode: code, subCode: 'INT1002', sem: 'HK1', yr: '2025-2026' },
      { studentCode: code, subCode: 'INT1003', sem: 'HK1', yr: '2025-2026' },
    ]),
    // CNTT-K64B students
    ...['SV2024007','SV2024008','SV2024009','SV2024010','SV2024011'].flatMap(code => [
      { studentCode: code, subCode: 'INT1001', sem: 'HK1', yr: '2025-2026' },
      { studentCode: code, subCode: 'INT1002', sem: 'HK1', yr: '2025-2026' },
    ]),
    // CNTT-K65 → INT1004 (học kỳ này)
    ...['SV2025001','SV2025002','SV2025003','SV2025004','SV2025005'].map(code => ({
      studentCode: code, subCode: 'INT1004', sem: 'HK1', yr: '2025-2026',
    })),
    // DTVT
    ...['SV2024101','SV2024102','SV2024103','SV2024104'].flatMap(code => [
      { studentCode: code, subCode: 'EEE1001', sem: 'HK1', yr: '2025-2026' },
      { studentCode: code, subCode: 'EEE1002', sem: 'HK1', yr: '2025-2026' },
    ]),
    ...['SV2025101','SV2025102','SV2025103'].map(code => ({
      studentCode: code, subCode: 'EEE1001', sem: 'HK1', yr: '2025-2026',
    })),
    // AI-DS
    ...['SV2025201','SV2025202','SV2025203'].flatMap(code => [
      { studentCode: code, subCode: 'AI1001', sem: 'HK1', yr: '2025-2026' },
      { studentCode: code, subCode: 'AI1002', sem: 'HK1', yr: '2025-2026' },
    ]),
    // ATTT
    ...['SV2025301','SV2025302','SV2025303'].map(code => ({
      studentCode: code, subCode: 'SEC1001', sem: 'HK1', yr: '2025-2026',
    })),
    // KTS
    ...['SV2025401','SV2025402','SV2025403'].map(code => ({
      studentCode: code, subCode: 'BUS1001', sem: 'HK1', yr: '2025-2026',
    })),
  ];
  for (const e of enrollments) {
    if (!studentIdMap[e.studentCode] || !subjectMap[e.subCode]) continue;
    const existing = await prisma.studentSubject.findFirst({ where: { studentId: studentIdMap[e.studentCode], subjectId: subjectMap[e.subCode], semester: e.sem, schoolYear: e.yr } });
    if (!existing) {
      await prisma.studentSubject.create({ data: { studentId: studentIdMap[e.studentCode], subjectId: subjectMap[e.subCode], semester: e.sem, schoolYear: e.yr } });
    }
  }

  // ─────────────────────────────────────────
  // 9. EXAM ROOMS
  // ─────────────────────────────────────────
  console.log(' └─ Exam Rooms...');
  const roomsData = [
    { roomCode: 'P101', roomName: 'Phòng thi 101', building: 'Nhà A2', capacity: 40, roomType: 'THI_LY_THUYET', status: 'AVAILABLE' },
    { roomCode: 'P102', roomName: 'Phòng thi 102', building: 'Nhà A2', capacity: 40, roomType: 'THI_LY_THUYET', status: 'AVAILABLE' },
    { roomCode: 'P201', roomName: 'Phòng thi 201', building: 'Nhà A2', capacity: 50, roomType: 'THI_LY_THUYET', status: 'AVAILABLE' },
    { roomCode: 'P202', roomName: 'Phòng thi 202', building: 'Nhà A2', capacity: 50, roomType: 'THI_LY_THUYET', status: 'AVAILABLE' },
    { roomCode: 'PM201', roomName: 'Phòng Máy 201', building: 'Nhà B1', capacity: 40, roomType: 'THI_MAY_TINH', status: 'AVAILABLE' },
    { roomCode: 'PM202', roomName: 'Phòng Máy 202', building: 'Nhà B1', capacity: 40, roomType: 'THI_MAY_TINH', status: 'AVAILABLE' },
    { roomCode: 'HT-A', roomName: 'Hội trường A', building: 'Nhà A2', capacity: 120, roomType: 'THI_TAP_TRUNG', status: 'AVAILABLE' },
  ];
  const roomMap: Record<string, number> = {};
  for (const r of roomsData) {
    const room = await prisma.examRoom.upsert({ where: { roomCode: r.roomCode }, update: {}, create: r });
    roomMap[r.roomCode] = room.id;
  }

  // ─────────────────────────────────────────
  // 10. EXAM PERIOD
  // ─────────────────────────────────────────
  console.log(' └─ Exam Period...');
  const examPeriod = await prisma.examPeriod.upsert({
    where: { id: 1 },
    update: { name: 'Kỳ thi Cuối HK1 (2025-2026)', status: 'ONGOING' },
    create: { name: 'Kỳ thi Cuối HK1 (2025-2026)', semester: 'HK1', schoolYear: '2025-2026', startDate: new Date('2026-08-01'), endDate: new Date('2026-08-30'), status: 'ONGOING' },
  });

  // ─────────────────────────────────────────
  // 11. EXAM SCHEDULES
  // ─────────────────────────────────────────
  console.log(' └─ Exam Schedules...');
  const schedulesData = [
    { id: 1, subCode: 'INT1001', date: '2026-08-15', start: '07:30', end: '09:00', type: 'TRAC_NGHIEM', status: 'SCHEDULED' },
    { id: 2, subCode: 'INT1002', date: '2026-08-18', start: '09:30', end: '11:00', type: 'TRAC_NGHIEM', status: 'SCHEDULED' },
    { id: 3, subCode: 'INT1003', date: '2026-08-20', start: '07:30', end: '09:00', type: 'TRAC_NGHIEM', status: 'SCHEDULED' },
    { id: 4, subCode: 'EEE1001', date: '2026-08-16', start: '13:30', end: '15:00', type: 'TRAC_NGHIEM', status: 'SCHEDULED' },
    { id: 5, subCode: 'AI1001', date: '2026-08-19', start: '07:30', end: '09:00', type: 'TRAC_NGHIEM', status: 'SCHEDULED' },
    { id: 6, subCode: 'SEC1001', date: '2026-08-21', start: '09:30', end: '11:00', type: 'TU_LUAN', status: 'SCHEDULED' },
  ];
  const scheduleIdMap: Record<number, number> = {};
  for (const sc of schedulesData) {
    const s = await prisma.examSchedule.upsert({
      where: { id: sc.id },
      update: {},
      create: { examPeriodId: examPeriod.id, subjectId: subjectMap[sc.subCode], examDate: new Date(sc.date), startTime: sc.start, endTime: sc.end, examType: sc.type, status: sc.status },
    });
    scheduleIdMap[sc.id] = s.id;
  }

  // ─────────────────────────────────────────
  // 12. EXAM SCHEDULE ROOMS + STUDENTS + SUPERVISORS
  // ─────────────────────────────────────────
  console.log(' └─ ExamScheduleRooms + Students + Supervisors...');

  // INT1001 — P101 & P102
  let room1 = await prisma.examScheduleRoom.findFirst({ where: { examScheduleId: scheduleIdMap[1], roomId: roomMap['P101'] } });
  if (!room1) room1 = await prisma.examScheduleRoom.create({ data: { examScheduleId: scheduleIdMap[1], roomId: roomMap['P101'] } });
  let room2 = await prisma.examScheduleRoom.findFirst({ where: { examScheduleId: scheduleIdMap[1], roomId: roomMap['P102'] } });
  if (!room2) room2 = await prisma.examScheduleRoom.create({ data: { examScheduleId: scheduleIdMap[1], roomId: roomMap['P102'] } });

  // Assign students INT1001 → room1 (CNTT-K64A) & room2 (CNTT-K64B)
  const int1001StudentsRoom1 = ['SV2024001','SV2024002','SV2024003','SV2024004','SV2024005','SV2024006'];
  const int1001StudentsRoom2 = ['SV2024007','SV2024008','SV2024009','SV2024010','SV2024011'];
  let seat = 1;
  for (const code of int1001StudentsRoom1) {
    if (!studentIdMap[code]) continue;
    const ex = await prisma.examRoomStudent.findFirst({ where: { examScheduleRoomId: room1.id, studentId: studentIdMap[code] } });
    if (!ex) await prisma.examRoomStudent.create({ data: { examScheduleRoomId: room1.id, studentId: studentIdMap[code], examNumber: `INT1001-${String(seat).padStart(3,'0')}`, seatNumber: seat, status: 'ASSIGNED' } });
    seat++;
  }
  seat = 1;
  for (const code of int1001StudentsRoom2) {
    if (!studentIdMap[code]) continue;
    const ex = await prisma.examRoomStudent.findFirst({ where: { examScheduleRoomId: room2.id, studentId: studentIdMap[code] } });
    if (!ex) await prisma.examRoomStudent.create({ data: { examScheduleRoomId: room2.id, studentId: studentIdMap[code], examNumber: `INT1001-${String(seat+10).padStart(3,'0')}`, seatNumber: seat, status: 'ASSIGNED' } });
    seat++;
  }

  // INT1002 — P201
  let room3 = await prisma.examScheduleRoom.findFirst({ where: { examScheduleId: scheduleIdMap[2], roomId: roomMap['P201'] } });
  if (!room3) room3 = await prisma.examScheduleRoom.create({ data: { examScheduleId: scheduleIdMap[2], roomId: roomMap['P201'] } });
  const int1002Students = ['SV2024001','SV2024002','SV2024003','SV2024007','SV2024008','SV2024009'];
  seat = 1;
  for (const code of int1002Students) {
    if (!studentIdMap[code]) continue;
    const ex = await prisma.examRoomStudent.findFirst({ where: { examScheduleRoomId: room3.id, studentId: studentIdMap[code] } });
    if (!ex) await prisma.examRoomStudent.create({ data: { examScheduleRoomId: room3.id, studentId: studentIdMap[code], examNumber: `INT1002-${String(seat).padStart(3,'0')}`, seatNumber: seat, status: 'ASSIGNED' } });
    seat++;
  }

  // EEE1001 — PM201
  let room4 = await prisma.examScheduleRoom.findFirst({ where: { examScheduleId: scheduleIdMap[4], roomId: roomMap['PM201'] } });
  if (!room4) room4 = await prisma.examScheduleRoom.create({ data: { examScheduleId: scheduleIdMap[4], roomId: roomMap['PM201'] } });
  const eeeStudents = ['SV2024101','SV2024102','SV2024103','SV2024104','SV2025101','SV2025102'];
  seat = 1;
  for (const code of eeeStudents) {
    if (!studentIdMap[code]) continue;
    const ex = await prisma.examRoomStudent.findFirst({ where: { examScheduleRoomId: room4.id, studentId: studentIdMap[code] } });
    if (!ex) await prisma.examRoomStudent.create({ data: { examScheduleRoomId: room4.id, studentId: studentIdMap[code], examNumber: `EEE1001-${String(seat).padStart(3,'0')}`, seatNumber: seat, status: 'ASSIGNED' } });
    seat++;
  }

  // AI1001 — PM202
  let room5 = await prisma.examScheduleRoom.findFirst({ where: { examScheduleId: scheduleIdMap[5], roomId: roomMap['PM202'] } });
  if (!room5) room5 = await prisma.examScheduleRoom.create({ data: { examScheduleId: scheduleIdMap[5], roomId: roomMap['PM202'] } });
  const aiStudents = ['SV2025201','SV2025202','SV2025203'];
  seat = 1;
  for (const code of aiStudents) {
    if (!studentIdMap[code]) continue;
    const ex = await prisma.examRoomStudent.findFirst({ where: { examScheduleRoomId: room5.id, studentId: studentIdMap[code] } });
    if (!ex) await prisma.examRoomStudent.create({ data: { examScheduleRoomId: room5.id, studentId: studentIdMap[code], examNumber: `AI1001-${String(seat).padStart(3,'0')}`, seatNumber: seat, status: 'ASSIGNED' } });
    seat++;
  }

  // SUPERVISORS — phân công GV coi thi
  // INT1001-P101: GV001 (CHINH) + GV002 (PHU)
  const supAssignments = [
    { roomObj: room1, teacherCode: 'GV001', role: 'CHINH' },
    { roomObj: room1, teacherCode: 'GV002', role: 'PHU' },
    { roomObj: room2, teacherCode: 'GV003', role: 'CHINH' },
    { roomObj: room3, teacherCode: 'GV001', role: 'CHINH' },
    { roomObj: room3, teacherCode: 'GV003', role: 'PHU' },
    { roomObj: room4, teacherCode: 'GV004', role: 'CHINH' },
    { roomObj: room4, teacherCode: 'GV005', role: 'PHU' },
    { roomObj: room5, teacherCode: 'GV006', role: 'CHINH' },
    { roomObj: room5, teacherCode: 'GV007', role: 'PHU' },
  ];
  for (const sa of supAssignments) {
    if (!teacherIdMap[sa.teacherCode] || !sa.roomObj) continue;
    const ex = await prisma.examSupervisor.findFirst({ where: { examScheduleRoomId: sa.roomObj.id, teacherId: teacherIdMap[sa.teacherCode] } });
    if (!ex) await prisma.examSupervisor.create({ data: { examScheduleRoomId: sa.roomObj.id, teacherId: teacherIdMap[sa.teacherCode], role: sa.role } });
  }

  console.log('✅ Full data seeded! Summary:');
  console.log(`   📚 ${departmentsData.length} khoa`);
  console.log(`   🏛️  ${classesData.length} lớp`);
  console.log(`   👨‍🏫 ${teacherList.length} giảng viên`);
  console.log(`   👨‍🎓 ${studentsRaw.length} sinh viên`);
  console.log(`   📖 ${subjectsData.length} môn học`);
  console.log(`   📝 ${enrollments.length} đăng ký môn`);
  console.log(`   🗓️  ${schedulesData.length} lịch thi`);
  console.log(`   🏫 7 phòng thi`);
  console.log(`   👮 ${supAssignments.length} phân công coi thi`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
