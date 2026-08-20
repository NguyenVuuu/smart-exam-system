import { PrismaClient, AIGenerationMaterial, AIGenerationHistory, Material } from '@prisma/client'

interface AIGenerationMaterialSeedInput {
  histories: AIGenerationHistory[]
  materials: Material[]
}

export async function seedAIGenerationMaterials(
  prisma: PrismaClient,
  { histories, materials }: AIGenerationMaterialSeedInput,
): Promise<void> {
  console.log('Seeding AIGenerationMaterials...')

  let total = 0

  for (const history of histories) {
    // Link first 2 materials to each AI generation
    const linkedMaterials = materials.slice(0, 2)
    
    for (const material of linkedMaterials) {
      const existing = await prisma.aIGenerationMaterial.findUnique({
        where: { historyId_materialId: { historyId: history.id, materialId: material.id } },
      })
      if (existing) continue

      await prisma.aIGenerationMaterial.create({
        data: {
          historyId: history.id,
          materialId: material.id,
        },
      })
      total++
    }
  }

  console.log(`✓ AIGenerationMaterials completed (${total} created)`)
}
