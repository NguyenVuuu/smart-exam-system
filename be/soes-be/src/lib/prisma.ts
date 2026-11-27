import { PrismaClient } from '@prisma/client'
import { performanceEnabled, recordDatabaseQuery } from './performance'

const prisma = new PrismaClient({ log: performanceEnabled ? [{ emit: 'event', level: 'query' }] : [] })
if (performanceEnabled) prisma.$on('query', ({ duration }) => recordDatabaseQuery(duration))

export default prisma
