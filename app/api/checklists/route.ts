import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'
import { CHECKLIST_TEMPLATES, getTemplateByProjectType } from '@/lib/templates/checklist-templates'

// GET /api/checklists - Get checklists for a project or all templates
export async function GET(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const projectType = searchParams.get('projectType')

    if (projectId) {
      // Get checklists for specific project
      const result = await supabaseDatabase.getChecklistsForProject(projectId)

      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to fetch project checklists' },
          { status: 500 }
        )
      }

      // If no custom checklists, return templates based on project type
      if (result.data.length === 0 && projectType) {
        const templates = getTemplateByProjectType(projectType)
        return NextResponse.json(templates.map(template => ({
          id: template.id,
          name: template.name,
          description: template.description,
          questions: template.questions,
          version: template.version,
          estimatedDuration: template.estimatedDuration,
          categories: template.categories,
          isTemplate: true
        })))
      }

      return NextResponse.json(result.data)
    } else {
      // Return all available templates
      return NextResponse.json(CHECKLIST_TEMPLATES.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        questions: template.questions,
        version: template.version,
        estimatedDuration: template.estimatedDuration,
        categories: template.categories,
        isTemplate: true
      })))
    }
  } catch (error) {
    console.error('Error fetching checklists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checklists' },
      { status: 500 }
    )
  }
}

// POST /api/checklists - Create custom checklist for project
export async function POST(request: NextRequest) {
  const { user, error } = await withSupabaseAuth(request)
  if (error) return error

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.questions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, questions' },
        { status: 400 }
      )
    }

    // Create checklist using database service
    const result = await supabaseDatabase.createChecklist({
      project_id: body.projectId || null,
      name: body.name,
      description: body.description,
      version: body.version || '1.0',
      questions: body.questions,
      created_by: user!.id,
      is_active: true,
    })

    if (result.error) {
      console.error('Database error creating checklist:', result.error)
      return NextResponse.json(
        { error: 'Failed to create checklist' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error creating checklist:', error)
    return NextResponse.json(
      { error: 'Failed to create checklist' },
      { status: 500 }
    )
  }
}