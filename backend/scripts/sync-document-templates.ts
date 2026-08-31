import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaults: Array<{ code: string; name: string; description: string }> = [
  {
    code: 'EXAM_PAPER_OFFICIAL',
    name: 'Đề thi chính thức',
    description: 'Mẫu in đề thi chính thức kèm khung điểm, lời dặn quy chế và chữ ký duyệt đề.',
  },
  {
    code: 'EXAM_SCHEDULE_LIST',
    name: 'Lịch thi theo ca',
    description: 'Bảng tổng hợp lịch thi chi tiết theo ngày, ca thi, môn học và phòng thi.',
  },
  {
    code: 'ROOM_DOOR_LIST',
    name: 'Danh sách dán cửa phòng',
    description: 'Bảng niêm phong dán tại cửa phòng để thí sinh tra cứu số báo danh, số ghế và phòng thi.',
  },
  {
    code: 'ROOM_ATTENDANCE_SHEET',
    name: 'Danh sách ký nộp bài thi',
    description: 'Biểu mẫu phát cho giám thị để thí sinh ký tên nộp bài thi và điểm danh.',
  },
  {
    code: 'SUPERVISOR_ASSIGNMENT',
    name: 'Lịch phân công coi thi',
    description: 'Lịch phân công cán bộ coi thi 1, cán bộ coi thi 2 và giám sát theo từng ca thi.',
  },
  {
    code: 'EXAM_ROOM_MINUTES',
    name: 'Biên bản phòng thi',
    description: 'Biên bản phòng thi ghi nhận thí sinh vắng, số bài thi thu được và bàn giao bài thi.',
  },
  {
    code: 'GRADE_REPORT',
    name: 'Bảng điểm thi học phần',
    description: 'Bảng điểm thi học phần kèm điểm quá trình, điểm thi, điểm tổng kết và chữ ký cán bộ chấm.',
  },
  {
    code: 'GRADE_APPEAL_MINUTES',
    name: 'Biên bản chấm phúc khảo',
    description: 'Biên bản làm việc của Hội đồng phúc khảo ghi nhận điểm gốc, điểm chấm lại và kết luận.',
  },
  {
    code: 'STUDENT_EXAM_PASS',
    name: 'Giấy báo dự thi',
    description: 'Giấy báo dự thi cá nhân của sinh viên gồm lịch thi, ca thi, phòng thi và số báo danh.',
  },
  {
    code: 'EXAM_SUMMARY_REPORT',
    name: 'Báo cáo tổng kết khảo thí',
    description: 'Báo cáo tổng hợp số lượng thí sinh dự thi, tỷ lệ vắng, tỷ lệ đạt và điểm trung bình.',
  },
  {
    code: 'STUDENT_DIRECTORY',
    name: 'Danh sách sinh viên',
    description: 'Bảng in danh sách sinh viên theo lớp, ngành học hoặc toàn khoa.',
  },
  {
    code: 'TEACHER_DIRECTORY',
    name: 'Danh sách giảng viên',
    description: 'Bảng in danh sách cán bộ giảng viên theo khoa và học vị.',
  },
  {
    code: 'SUBJECT_DIRECTORY',
    name: 'Danh sách môn học',
    description: 'Bảng in danh mục môn học, mã học phần, số tín chỉ và khoa phụ trách.',
  },
  {
    code: 'EXAM_ROOM_DIRECTORY',
    name: 'Danh sách phòng thi',
    description: 'Bảng in danh mục phòng thi, tòa nhà và sức chứa máy tính.',
  },
];

const validCodes = new Set(defaults.map((d) => d.code));

async function main() {
  console.log('🔄 Bắt đầu đồng bộ & dọn dẹp Document Templates trong DB...');

  // 1. Cập nhật tên, mô tả và config chuẩn Trường Đại học Nam Cần Thơ cho 14 template cốt lõi
  for (const item of defaults) {
    const existing = await prisma.documentTemplate.findUnique({
      where: { code: item.code },
      include: { versions: true },
    });
    if (existing) {
      await prisma.documentTemplate.update({
        where: { code: item.code },
        data: { name: item.name, description: item.description, isDefault: true },
      });

      for (const ver of existing.versions) {
        const cfg = (ver.config || {}) as any;
        const header = cfg.header || {};
        
        const newInstitution = 'TRƯỜNG ĐẠI HỌC NAM CẦN THƠ';
        let newFaculty = 'KHOA CÔNG NGHỆ THÔNG TIN';

        if (['EXAM_ROOM_MINUTES', 'EXAM_SUMMARY_REPORT', 'SUPERVISOR_ASSIGNMENT'].includes(item.code)) {
          newFaculty = 'HỘI ĐỒNG KHẢO THÍ & ĐBCL';
        } else if (item.code === 'GRADE_APPEAL_MINUTES') {
          newFaculty = 'BAN CHẤM PHÚC KHẢO BÀI THI';
        } else if (item.code === 'STUDENT_EXAM_PASS') {
          newFaculty = 'PHÒNG ĐÀO TẠO & KHẢO THÍ';
        }

        const updatedConfig = {
          ...cfg,
          header: {
            ...header,
            institutionName: newInstitution,
            facultyName: newFaculty,
            subtitle: header.subtitle?.trim() ? header.subtitle : 'Học kỳ 1 - Năm học 2025 - 2026',
            motto: header.motto?.trim() ? header.motto : 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc',
          },
        };

        await prisma.documentTemplateVersion.update({
          where: { id: ver.id },
          data: { config: updatedConfig },
        });
      }

      console.log(`✅ Đã cập nhật chuẩn ĐH Nam Cần Thơ: [${item.code}] -> ${item.name}`);
    }
  }

  // 2. Xóa các template cũ thừa khỏi DB
  const obsolete = await prisma.documentTemplate.findMany({
    where: {
      code: { notIn: Array.from(validCodes) },
    },
  });

  for (const item of obsolete) {
    await prisma.documentTemplateVersion.deleteMany({ where: { templateId: item.id } });
    await prisma.documentTemplate.delete({ where: { id: item.id } });
    console.log(`🗑️ Đã xóa biểu mẫu thừa: [${item.code}] - ${item.name}`);
  }

  console.log('✨ Hoàn tất đồng bộ database Trường Đại học Nam Cần Thơ!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi đồng bộ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
