import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const SALT_ROUNDS = 10
const DEFAULT_PASSWORD = '123456'

async function upsertByStudentCode(
  studentCode: string,
  data: Parameters<typeof prisma.user.create>[0]['data'],
) {
  const existing = await prisma.user.findUnique({ where: { studentCode } })
  if (!existing) await prisma.user.create({ data })
}

async function upsertByTeacherCode(
  teacherCode: string,
  data: Parameters<typeof prisma.user.create>[0]['data'],
) {
  const existing = await prisma.user.findUnique({ where: { teacherCode } })
  if (!existing) await prisma.user.create({ data })
}

async function upsertAdmin(
  email: string,
  data: Parameters<typeof prisma.user.create>[0]['data'],
) {
  const existing = await prisma.user.findFirst({ where: { email } })
  if (!existing) await prisma.user.create({ data })
}

async function main() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS)

  await upsertAdmin('admin@soes.edu.vn', {
    email: 'admin@soes.edu.vn',
    password: hashedPassword,
    fullName: 'Super Admin',
    isAdmin: true,
    status: 'ACTIVE',
  })

  await upsertByStudentCode('SV000001', {
    password: hashedPassword,
    fullName: 'Nguyen Van An',
    studentCode: 'SV000001',
    status: 'ACTIVE',
  })

  await upsertByTeacherCode('GV000001', {
    email: 'gv001@soes.edu.vn',
    password: hashedPassword,
    fullName: 'Tran Thi Bich',
    teacherCode: 'GV000001',
    status: 'ACTIVE',
  })

  await upsertByStudentCode('SV000002', {
    email: 'combo@soes.edu.vn',
    password: hashedPassword,
    fullName: 'Le Minh Cuong',
    studentCode: 'SV000002',
    teacherCode: 'GV000002',
    status: 'ACTIVE',
  })

  console.log('✅ Seed completed\n')
  console.log('─────────────────────────────────────────────────')
  console.log('Account          | Identifier          | Password')
  console.log('─────────────────────────────────────────────────')
  console.log(`Admin            | admin@soes.edu.vn   | ${DEFAULT_PASSWORD}`)
  console.log(`Student          | SV000001            | ${DEFAULT_PASSWORD}`)
  console.log(`Teacher          | GV000001            | ${DEFAULT_PASSWORD}`)
  console.log(`Student+Teacher  | SV000002 / GV000002 | ${DEFAULT_PASSWORD}`)
  console.log('─────────────────────────────────────────────────')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
