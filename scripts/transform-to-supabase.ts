/**
 * T059 - Data Transformation Script for Supabase Format
 * Transforms exported Prisma data to match Supabase schema
 */

import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

interface TransformResult {
  success: boolean
  transformedTables: string[]
  errors: string[]
  outputPath: string
}

export async function transformToSupabaseFormat(): Promise<TransformResult> {
  const result: TransformResult = {
    success: true,
    transformedTables: [],
    errors: [],
    outputPath: ''
  }

  try {
    const exportDir = path.join(process.cwd(), 'data-export')
    const transformDir = path.join(process.cwd(), 'data-transformed')
    await fs.mkdir(transformDir, { recursive: true })
    result.outputPath = transformDir

    // Transform Users to Profiles
    try {
      const usersData = await fs.readFile(path.join(exportDir, 'users.json'), 'utf-8')
      const users = JSON.parse(usersData)
      
      const profiles = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar,
        is_active: user.isActive,
        created_at: user.createdAt || new Date().toISOString(),
        updated_at: user.updatedAt || new Date().toISOString()
      }))

      await fs.writeFile(
        path.join(transformDir, 'profiles.json'),
        JSON.stringify(profiles, null, 2)
      )
      result.transformedTables.push('profiles')
      console.log(`✅ Transformed ${profiles.length} users to profiles`)
    } catch (error) {
      result.errors.push(`Failed to transform users: ${error}`)
    }

    // Transform Projects
    try {
      const projectsData = await fs.readFile(path.join(exportDir, 'projects.json'), 'utf-8')
      const projects = JSON.parse(projectsData)
      
      const transformedProjects = projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        start_date: project.startDate,
        end_date: project.endDate,
        created_by: project.createdBy,
        created_at: project.createdAt || new Date().toISOString(),
        updated_at: project.updatedAt || new Date().toISOString()
      }))

      await fs.writeFile(
        path.join(transformDir, 'projects.json'),
        JSON.stringify(transformedProjects, null, 2)
      )
      result.transformedTables.push('projects')
      console.log(`✅ Transformed ${transformedProjects.length} projects`)

      // Transform Project Members
      const projectMembers: any[] = []
      projects.forEach((project: any) => {
        if (project.members) {
          project.members.forEach((member: any) => {
            projectMembers.push({
              id: uuidv4(),
              project_id: project.id,
              user_id: member.userId,
              role: member.role,
              joined_at: member.joinedAt || new Date().toISOString()
            })
          })
        }
      })

      await fs.writeFile(
        path.join(transformDir, 'project_members.json'),
        JSON.stringify(projectMembers, null, 2)
      )
      result.transformedTables.push('project_members')
      console.log(`✅ Transformed ${projectMembers.length} project members`)

    } catch (error) {
      result.errors.push(`Failed to transform projects: ${error}`)
    }

    // Transform Inspections
    try {
      const inspectionsData = await fs.readFile(path.join(exportDir, 'inspections.json'), 'utf-8')
      const inspections = JSON.parse(inspectionsData)
      
      const transformedInspections = inspections.map((inspection: any) => ({
        id: inspection.id,
        project_id: inspection.projectId,
        checklist_id: inspection.checklistId,
        assigned_to: inspection.assignedTo,
        title: inspection.title,
        description: inspection.description,
        status: inspection.status,
        priority: inspection.priority,
        due_date: inspection.dueDate,
        completed_at: inspection.completedAt,
        created_at: inspection.createdAt || new Date().toISOString(),
        updated_at: inspection.updatedAt || new Date().toISOString()
      }))

      await fs.writeFile(
        path.join(transformDir, 'inspections.json'),
        JSON.stringify(transformedInspections, null, 2)
      )
      result.transformedTables.push('inspections')
      console.log(`✅ Transformed ${transformedInspections.length} inspections`)
    } catch (error) {
      result.errors.push(`Failed to transform inspections: ${error}`)
    }

    // Transform Evidence
    try {
      const evidenceData = await fs.readFile(path.join(exportDir, 'evidence.json'), 'utf-8')
      const evidence = JSON.parse(evidenceData)
      
      const transformedEvidence = evidence.map((item: any) => ({
        id: item.id,
        inspection_id: item.inspectionId,
        uploaded_by: item.uploadedBy,
        filename: item.filename,
        original_name: item.originalName,
        mime_type: item.mimeType,
        file_size: item.fileSize,
        url: item.url,
        thumbnail_url: item.thumbnailUrl,
        latitude: item.latitude,
        longitude: item.longitude,
        accuracy: item.accuracy,
        timestamp: item.timestamp,
        verified: item.verified || false,
        annotations: item.annotations,
        metadata: item.metadata,
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: item.updatedAt || new Date().toISOString()
      }))

      await fs.writeFile(
        path.join(transformDir, 'evidence.json'),
        JSON.stringify(transformedEvidence, null, 2)
      )
      result.transformedTables.push('evidence')
      console.log(`✅ Transformed ${transformedEvidence.length} evidence records`)
    } catch (error) {
      result.errors.push(`Failed to transform evidence: ${error}`)
    }

    // Create transformation summary
    const summary = {
      transformDate: new Date().toISOString(),
      tables: result.transformedTables,
      errors: result.errors,
      totalTables: result.transformedTables.length
    }

    await fs.writeFile(
      path.join(transformDir, 'transform-summary.json'),
      JSON.stringify(summary, null, 2)
    )

    if (result.errors.length > 0) {
      result.success = false
    }

  } catch (error) {
    result.success = false
    result.errors.push(`Transformation failed: ${error}`)
  }

  return result
}

// Run transformation if called directly
if (require.main === module) {
  transformToSupabaseFormat()
    .then((result) => {
      console.log('\n🔄 Transformation Summary:')
      console.log(`Success: ${result.success}`)
      console.log(`Transformed tables: ${result.transformedTables.join(', ')}`)
      console.log(`Output path: ${result.outputPath}`)
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:')
        result.errors.forEach(error => console.log(`  - ${error}`))
      }
    })
    .catch(console.error)
}
