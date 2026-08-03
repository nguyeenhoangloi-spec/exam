"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding initial database data...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
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
    const cnttDept = await prisma.department.upsert({
        where: { code: 'CNTT' },
        update: {},
        create: {
            code: 'CNTT',
            name: 'Khoa Công nghệ thông tin',
        },
    });
    const dtvtDept = await prisma.department.upsert({
        where: { code: 'DTVT' },
        update: {},
        create: {
            code: 'DTVT',
            name: 'Khoa Điện tử viễn thông',
        },
    });
    const classCntt = await prisma.class.upsert({
        where: { code: 'CNTT-K65' },
        update: {},
        create: {
            code: 'CNTT-K65',
            name: 'Lớp CNTT K65',
            departmentId: cnttDept.id,
        },
    });
    const classDtvt = await prisma.class.upsert({
        where: { code: 'DTVT-K65' },
        update: {},
        create: {
            code: 'DTVT-K65',
            name: 'Lớp DTVT K65',
            departmentId: dtvtDept.id,
        },
    });
    const teacher1 = await prisma.teacher.upsert({
        where: { teacherCode: 'GV001' },
        update: {},
        create: {
            teacherCode: 'GV001',
            fullName: 'Nguyễn Văn A',
            degree: 'Tiến sĩ',
            email: 'nguyenvana@school.edu.vn',
            phone: '0987654321',
            departmentId: cnttDept.id,
            userId: teacher1User.id,
        },
    });
    const teacher2 = await prisma.teacher.upsert({
        where: { teacherCode: 'GV002' },
        update: {},
        create: {
            teacherCode: 'GV002',
            fullName: 'Trần Thị B',
            degree: 'Thạc sĩ',
            email: 'tranthib@school.edu.vn',
            phone: '0912345678',
            departmentId: cnttDept.id,
            userId: teacher2User.id,
        },
    });
    const student1 = await prisma.student.upsert({
        where: { studentCode: 'SV001' },
        update: {},
        create: {
            studentCode: 'SV001',
            fullName: 'Lê Văn C',
            gender: 'Nam',
            dateOfBirth: new Date('2003-05-15'),
            email: 'levanc@student.edu.vn',
            phone: '0933111222',
            classId: classCntt.id,
            userId: student1User.id,
        },
    });
    const student2 = await prisma.student.upsert({
        where: { studentCode: 'SV002' },
        update: {},
        create: {
            studentCode: 'SV002',
            fullName: 'Phạm Thị D',
            gender: 'Nữ',
            dateOfBirth: new Date('2003-08-20'),
            email: 'phamthid@student.edu.vn',
            phone: '0933222333',
            classId: classCntt.id,
            userId: student2User.id,
        },
    });
    const student3 = await prisma.student.upsert({
        where: { studentCode: 'SV003' },
        update: {},
        create: {
            studentCode: 'SV003',
            fullName: 'Hoàng Văn E',
            gender: 'Nam',
            dateOfBirth: new Date('2003-02-10'),
            email: 'hoangvane@student.edu.vn',
            phone: '0933333444',
            classId: classCntt.id,
            userId: student3User.id,
        },
    });
    const student4 = await prisma.student.upsert({
        where: { studentCode: 'SV004' },
        update: {},
        create: {
            studentCode: 'SV004',
            fullName: 'Vũ Thị F',
            gender: 'Nữ',
            dateOfBirth: new Date('2003-11-25'),
            email: 'vuthif@student.edu.vn',
            phone: '0933444555',
            classId: classDtvt.id,
            userId: student4User.id,
        },
    });
    const subject1 = await prisma.subject.upsert({
        where: { subjectCode: 'INT1001' },
        update: {},
        create: {
            subjectCode: 'INT1001',
            subjectName: 'Lập trình hướng đối tượng',
            credits: 3,
            departmentId: cnttDept.id,
        },
    });
    const subject2 = await prisma.subject.upsert({
        where: { subjectCode: 'INT1002' },
        update: {},
        create: {
            subjectCode: 'INT1002',
            subjectName: 'Cơ sở dữ liệu',
            credits: 3,
            departmentId: cnttDept.id,
        },
    });
    await prisma.studentSubject.deleteMany();
    await prisma.studentSubject.createMany({
        data: [
            { studentId: student1.id, subjectId: subject1.id, semester: 'HK1', schoolYear: '2025-2026', status: 'ELIGIBLE' },
            { studentId: student2.id, subjectId: subject1.id, semester: 'HK1', schoolYear: '2025-2026', status: 'ELIGIBLE' },
            { studentId: student3.id, subjectId: subject1.id, semester: 'HK1', schoolYear: '2025-2026', status: 'ELIGIBLE' },
            { studentId: student4.id, subjectId: subject1.id, semester: 'HK1', schoolYear: '2025-2026', status: 'ELIGIBLE' },
            { studentId: student1.id, subjectId: subject2.id, semester: 'HK1', schoolYear: '2025-2026', status: 'ELIGIBLE' },
            { studentId: student2.id, subjectId: subject2.id, semester: 'HK1', schoolYear: '2025-2026', status: 'ELIGIBLE' },
        ],
    });
    const room1 = await prisma.examRoom.upsert({
        where: { roomCode: 'P101' },
        update: {},
        create: {
            roomCode: 'P101',
            roomName: 'Phòng thi P101',
            building: 'Nhà A2',
            capacity: 40,
            roomType: 'THI_LY_THUYET',
            status: 'AVAILABLE',
        },
    });
    const room2 = await prisma.examRoom.upsert({
        where: { roomCode: 'P102' },
        update: {},
        create: {
            roomCode: 'P102',
            roomName: 'Phòng thi P102',
            building: 'Nhà A2',
            capacity: 30,
            roomType: 'THI_LY_THUYET',
            status: 'AVAILABLE',
        },
    });
    const room3 = await prisma.examRoom.upsert({
        where: { roomCode: 'PM201' },
        update: {},
        create: {
            roomCode: 'PM201',
            roomName: 'Phòng Máy PM201',
            building: 'Nhà B1',
            capacity: 50,
            roomType: 'THI_MAY_TINH',
            status: 'AVAILABLE',
        },
    });
    const period = await prisma.examPeriod.create({
        data: {
            name: 'Kỳ thi Cuối học kỳ 1 (2025-2026)',
            semester: 'HK1',
            schoolYear: '2025-2026',
            startDate: new Date('2026-08-01'),
            endDate: new Date('2026-08-30'),
            status: 'ONGOING',
        },
    });
    const schedule = await prisma.examSchedule.create({
        data: {
            examPeriodId: period.id,
            subjectId: subject1.id,
            examDate: new Date('2026-08-15'),
            startTime: '08:00',
            endTime: '09:30',
            examType: 'TRAC_NGHIEM',
            status: 'SCHEDULED',
            note: 'Thi trắc nghiệm tập trung',
        },
    });
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    const q1 = await prisma.question.create({
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
    const q2 = await prisma.question.create({
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
    const q3 = await prisma.question.create({
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
    const q4 = await prisma.question.create({
        data: {
            subjectId: subject1.id,
            chapter: 2,
            content: 'Ghi đè phương thức (Method Overriding) yêu cầu điều kiện gì?',
            questionType: 'SINGLE_CHOICE',
            difficulty: 'MEDIUM',
            score: 0.25,
            explanation: 'Phương thức ở lớp con phải có cùng tên và cùng tham số với phương thức ở lớp cha.',
            status: 'APPROVED',
            createdById: teacher2User.id,
            options: {
                create: [
                    { optionLabel: 'A', optionContent: 'Cùng chữ ký phương thức giữa lớp con và lớp cha', isCorrect: true },
                    { optionLabel: 'B', optionContent: 'Khác tên phương thức', isCorrect: false },
                    { optionLabel: 'C', optionContent: 'Phải dùng từ khóa private', isCorrect: false },
                    { optionLabel: 'D', optionContent: 'Không được truyền tham số', isCorrect: false },
                ],
            },
        },
    });
    const q5 = await prisma.question.create({
        data: {
            subjectId: subject1.id,
            chapter: 3,
            content: 'Trong thiết kế phần mềm, nguyên lý SOLID thì chữ S đại diện cho nguyên lý nào?',
            questionType: 'SINGLE_CHOICE',
            difficulty: 'HARD',
            score: 0.25,
            explanation: 'Single Responsibility Principle - Nguyên lý đơn trách nhiệm.',
            status: 'APPROVED',
            createdById: teacher2User.id,
            options: {
                create: [
                    { optionLabel: 'A', optionContent: 'Single Responsibility Principle', isCorrect: true },
                    { optionLabel: 'B', optionContent: 'Subclass Substitution Principle', isCorrect: false },
                    { optionLabel: 'C', optionContent: 'Shared State Principle', isCorrect: false },
                    { optionLabel: 'D', optionContent: 'Sequential Execution Principle', isCorrect: false },
                ],
            },
        },
    });
    const q6 = await prisma.question.create({
        data: {
            subjectId: subject1.id,
            chapter: 3,
            content: 'Mô hình thiết kế Singleton đảm bảo điều gì?',
            questionType: 'SINGLE_CHOICE',
            difficulty: 'HARD',
            score: 0.25,
            explanation: 'Singleton chỉ cho phép một thể hiện duy nhất của class tồn tại trong ứng dụng.',
            status: 'PENDING',
            createdById: teacher2User.id,
            options: {
                create: [
                    { optionLabel: 'A', optionContent: 'Có thể tạo vô số thể hiện', isCorrect: false },
                    { optionLabel: 'B', optionContent: 'Một lớp chỉ có duy nhất một instance duy nhất', isCorrect: true },
                    { optionLabel: 'C', optionContent: 'Dữ liệu được lưu trữ ngầm', isCorrect: false },
                    { optionLabel: 'D', optionContent: 'Không thể khởi tạo thuộc tính static', isCorrect: false },
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
//# sourceMappingURL=seed.js.map