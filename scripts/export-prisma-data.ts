/**
 * T058 - Data Export Script from Prisma Database
 * Exports existing data from Prisma database for migration to Supabase
 */

import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface ExportResult {
  success: boolean
  exportedTables: string[]
  errors: string[]
  exportPath: string
}

export async function exportPrismaData(): Promise<ExportResult> {
  const result: ExportResult = {
    success: true,
    exportedTables: [],
    errors: [],
    exportPath: ''
  }

  try {
    const exportDir = path.join(process.cwd(), 'data-export')
    await fs.mkdir(exportDir, { recursive: true })
    result.exportPath = exportDir

    // Export Users
    try {
      const users = await prisma.user.findMany()
      await fs.writeFile(
        path.join(exportDir, 'users.json'),
        JSON.stringify(users, null, 2)
      )
      result.exportedTables.push('users')
      console.log(`✅ Exported ${users.length} users`)
    } catch (error) {
      result.errors.push(`Failed to export users: ${error}`)
    }

    // Export Projects
    try {
      const projects = await prisma.project.findMany({
        include: {
          members: true,
          checklists: true
        }
      })
      await fs.writeFile(
        path.join(exportDir, 'projects.json'),
        JSON.stringify(projects, null, 2)
      )
      result.exportedTables.push('projects')
      console.log(`✅ Exported ${projects.length} projects`)
    } catch (error) {
      result.errors.push(`Failed to export projects: ${error}`)
    }

    // Export Inspections
    try {
      const inspections = await prisma.inspection.findMany({
        include: {
          evidence: true,
          approvals: true
        }
      })
      await fs.writeFile(
        path.join(exportDir, 'inspections.json'),
        JSON.stringify(inspections, null, 2)
      )
      result.exportedTables.push('inspections')
      console.log(`✅ Exported ${inspections.length} inspections`)
    } catch (error) {
      result.errors.push(`Failed to export inspections: ${error}`)
    }

    // Export Evidence
    try {
      const evidence = await prisma.evidence.findMany()
      await fs.writeFile(
        path.join(exportDir, 'evidence.json'),
        JSON.stringify(evidence, null, 2)
      )
      result.exportedTables.push('evidence')
      console.log(`✅ Exported ${evidence.length} evidence records`)
    } catch (error) {
      result.errors.push(`Failed to export evidence: ${error}`)
    }

    // Create export summary
    const summary = {
      exportDate: new Date().toISOString(),
      tables: result.exportedTables,
      errors: result.errors,
      totalRecords: result.exportedTables.length
    }

    await fs.writeFile(
      path.join(exportDir, 'export-summary.json'),
      JSON.stringify(summary, null, 2)
    )

    if (result.errors.length > 0) {
      result.success = false
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Export failed: ${error}`)
  } finally {
    await prisma.$disconnect()
  }

  return result
}

// Run export if called directly
if (require.main === module) {
  exportPrismaData()
    .then((result) => {
      console.log('\n📊 Export Summary:')
      console.log(`Success: ${result.success}`)
      console.log(`Exported tables: ${result.exportedTables.join(', ')}`)
      console.log(`Export path: ${result.exportPath}`)
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:')
        result.errors.forEach(error => console.log(`  - ${error}`))
      }
    })
    .catch(console.error)
}
