/**
 * Seed dữ liệu tối thiểu cho DB mới.
 * Chạy: npm run db:seed (cần DATABASE_URL trong .env)
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Học kỳ hiện tại — sửa theo học kỳ thật khi chạy
  await prisma.systemConfig.upsert({
    where: { id: 1 },
    create: { id: 1, semesterCode: '20251' },
    update: {},
  });

  // Danh mục chức vụ (legacy: position)
  const positions = [
    { id: 0, name: 'Không chức vụ' },
    { id: 1, name: 'Ủy viên' },
    { id: 2, name: 'Phó bí thư' },
    { id: 3, name: 'Bí thư' },
    { id: 4, name: 'Lớp trưởng' },
    { id: 5, name: 'Cán bộ chi đoàn' },
    { id: 6, name: 'Sinh viên' },
    { id: 7, name: 'Ban chấp hành' },
  ];
  for (const p of positions) {
    await prisma.position.upsert({ where: { id: p.id }, create: p, update: p });
  }

  console.log('Seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
