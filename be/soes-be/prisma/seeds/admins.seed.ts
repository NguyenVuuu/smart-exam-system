import { Admin, PrismaClient } from '@prisma/client'
import { DEFAULT_PASSWORD, hashPassword, padCode } from './helpers'

// Fixed dev accounts that must never be overwritten
const FIXED_ADMINS = [
  { userId: 'seed-user-admin-001', adminCode: 'AD000001', fullName: 'Super Admin', email: 'admin@soes.edu.vn' },
]

// Additional demo admins (seeded by index starting from 2)
const EXTRA_ADMIN_COUNT = 1

export async function seedAdmins(prisma: PrismaClient): Promise<Admin[]> {
  console.log('Seeding Admins...')

  const hashed = await hashPassword(DEFAULT_PASSWORD)
  const admins: Admin[] = []

  // Fixed dev accounts
  for (const data of FIXED_ADMINS) {
    const user = await prisma.user.upsert({
      where: { id: data.userId },
      update: {},
      create: { id: data.userId, fullName: data.fullName, email: data.email },
    })
    const admin = await prisma.admin.upsert({
      where: { adminCode: data.adminCode },
      update: {},
      create: { adminCode: data.adminCode, password: hashed, status: 'ACTIVE', userId: user.id },
    })
    admins.push(admin)
  }

  // Extra demo admins
  for (let i = 2; i <= 1 + EXTRA_ADMIN_COUNT; i++) {
    const adminCode = `AD${padCode(i, 6)}`
    const userId = `seed-user-admin-${padCode(i, 3)}`

    const existing = await prisma.admin.findUnique({ where: { adminCode } })
    if (existing) { admins.push(existing); continue }

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, fullName: `Admin ${i}`, email: `admin${i}@soes.edu.vn` },
    })
    const admin = await prisma.admin.create({
      data: { adminCode, password: hashed, status: 'ACTIVE', userId: user.id },
    })
    admins.push(admin)
  }

  console.log(`✓ Admins completed (${admins.length})`)
  return admins
}
