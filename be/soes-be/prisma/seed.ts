import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const SALT_ROUNDS = 10
const DEFAULT_PASSWORD = '123456'

async function main() {
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS)

  // ── User 1: Admin ──────────────────────────────────────
  await prisma.user.upsert({
    where: { id: 'seed-user-admin-001' },
    update: {},
    create: {
      id: 'seed-user-admin-001',
      fullName: 'Super Admin',
      email: 'admin@soes.edu.vn',
      admin: {
        create: {
          adminCode: 'AD000001',
          password: hashed,
          status: 'ACTIVE',
        },
      },
    },
  })

  // ── User 2: Student ────────────────────────────────────
  await prisma.user.upsert({
    where: { id: 'seed-user-student-001' },
    update: {},
    create: {
      id: 'seed-user-student-001',
      fullName: 'Nguyen Van An',
      student: {
        create: {
          studentCode: 'SV000001',
          password: hashed,
          status: 'ACTIVE',
        },
      },
    },
  })

  // ── User 3: Teacher ────────────────────────────────────
  await prisma.user.upsert({
    where: { id: 'seed-user-teacher-001' },
    update: {},
    create: {
      id: 'seed-user-teacher-001',
      fullName: 'Tran Thi Bich',
      email: 'gv001@soes.edu.vn',
      teacher: {
        create: {
          teacherCode: 'GV000001',
          password: hashed,
          status: 'ACTIVE',
        },
      },
    },
  })

  // ── User 4: Student + Teacher ──────────────────────────
  await prisma.user.upsert({
    where: { id: 'seed-user-combo-001' },
    update: {},
    create: {
      id: 'seed-user-combo-001',
      fullName: 'Le Minh Cuong',
      email: 'combo@soes.edu.vn',
      student: {
        create: {
          studentCode: 'SV000002',
          password: hashed,
          status: 'ACTIVE',
        },
      },
      teacher: {
        create: {
          teacherCode: 'GV000002',
          password: hashed,
          status: 'ACTIVE',
        },
      },
    },
  })

  console.log('✅ Seed completed\n')
  console.log('──────────────────────────────────────────────────────')
  console.log('User | Account         | Identifier          | Password')
  console.log('──────────────────────────────────────────────────────')
  console.log(`  1  | Admin            | AD000001            | ${DEFAULT_PASSWORD}`)
  console.log(`  2  | Student          | SV000001            | ${DEFAULT_PASSWORD}`)
  console.log(`  3  | Teacher          | GV000001            | ${DEFAULT_PASSWORD}`)
  console.log(`  4  | Student+Teacher  | SV000002 / GV000002 | ${DEFAULT_PASSWORD}`)
  console.log('──────────────────────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
