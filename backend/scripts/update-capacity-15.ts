import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.examRoom.updateMany({
    data: {
      capacity: 15,
    },
  });
  console.log(`Đã cập nhật sức chứa 15 chỗ cho ${updated.count} phòng thi trong database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
