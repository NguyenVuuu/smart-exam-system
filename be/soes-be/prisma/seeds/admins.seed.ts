import { Admin, PrismaClient } from '@prisma/client'
import { DEFAULT_PASSWORD, hashPassword, padCode } from './helpers'

// Fixed dev accounts that must never be overwritten
const FIXED_ADMINS = [
  {
    userId: 'seed-user-admin-001',
    adminCode: 'US000001',
    fullName: 'Super Admin',
    email: 'admin@soes.edu.vn',
    username: 'US000001',
    role: 'ADMIN' as const,
  },
  {
    userId: 'seed-user-gvo-001',
    adminCode: 'US000002',
    fullName: 'Giao Vu Nguyen',
    email: 'giaovu@soes.edu.vn',
    username: 'US000002',
    role: 'EDUCATION_OFFICER' as const,
  },
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
      update: {
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        password: hashed,
        roles: [data.role],
        status: 'ACTIVE',
      },
      create: {
        id: data.userId,
        fullName: data.fullName,
        email: data.email,
        username: data.username,
        password: hashed,
        roles: [data.role],
        status: 'ACTIVE',
      },
    })
    const existingAdmin = await prisma.admin.findFirst({ where: { userId: user.id } })
    const admin = existingAdmin
      ? await prisma.admin.update({ where: { id: existingAdmin.id }, data: { adminCode: data.adminCode, role: data.role, status: 'ACTIVE' } })
      : await prisma.admin.create({ data: { adminCode: data.adminCode, role: data.role, status: 'ACTIVE', userId: user.id } })
    admins.push(admin)
  }

  // Extra demo admins
  for (let i = 2; i <= 1 + EXTRA_ADMIN_COUNT; i++) {
    const adminCode = `US${padCode(i + 1, 6)}`
    const userId = `seed-user-admin-${padCode(i, 3)}`

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        password: hashed,
        roles: ['ADMIN'],
        status: 'ACTIVE',
      },
      create: {
        id: userId,
        fullName: `Admin ${i}`,
        email: `admin${i}@soes.edu.vn`,
        username: adminCode,
        password: hashed,
        roles: ['ADMIN'],
        status: 'ACTIVE',
      },
    })
    const existing = await prisma.admin.findFirst({ where: { userId: user.id } })
    const admin = existing
      ? await prisma.admin.update({ where: { id: existing.id }, data: { adminCode, role: 'ADMIN', status: 'ACTIVE' } })
      : await prisma.admin.create({ data: { adminCode, role: 'ADMIN', status: 'ACTIVE', userId: user.id } })
    admins.push(admin)
  }

  console.log(`✓ Admins completed (${admins.length})`)
  return admins
}

