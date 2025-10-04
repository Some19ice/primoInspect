import { NextRequest, NextResponse } from 'next/server'
import { withSupabaseAuth, logAuditEvent } from '@/lib/supabase/rbac'
import { supabaseDatabase } from '@/lib/supabase/database'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, error } = await withSupabaseAuth(request)
    if (error) return error

    try {
        const { id } = await params
        const body = await request.json()

        // Validate required fields
        if (!body.responses || !Array.isArray(body.responses)) {
            return NextResponse.json(
                { error: 'Missing or invalid responses array' },
                { status: 400 }
            )
        }

        // Get the inspection to verify ownership/assignment
        const inspectionResult = await supabaseDatabase.getInspectionById(id)
        if (inspectionResult.error || !inspectionResult.data) {
            return NextResponse.json(
                { error: 'Inspection not found' },
                { status: 404 }
            )
        }

        const inspection = inspectionResult.data as any

        // Verify user can complete this inspection
        if (inspection.assigned_to !== user!.id && (user as any)?.user_metadata?.role !== 'PROJECT_MANAGER') {
            return NextResponse.json(
                { error: 'Not authorized to complete this inspection' },
                { status: 403 }
            )
        }

        // Validate responses against checklist
        const checklistResult = await supabaseDatabase.getChecklistById(inspection.checklist_id)
        if (checklistResult.error || !checklistResult.data) {
            return NextResponse.json(
                { error: 'Checklist not found' },
                { status: 404 }
            )
        }

        const checklist = checklistResult.data as any
        const questions = checklist.questions || []

        // Validate required questions are answered
        const requiredQuestions = questions.filter((q: any) => q.required)
        const answeredQuestions = body.responses.filter((r: any) =>
            r.value !== undefined && r.value !== null && r.value !== ''
        )

        const missingRequired = requiredQuestions.filter((q: any) =>
            !answeredQuestions.find((r: any) => r.questionId === q.id)
        )

        if (missingRequired.length > 0) {
            return NextResponse.json(
                {
                    error: 'Missing required responses',
                    missingQuestions: missingRequired.map((q: any) => q.question)
                },
                { status: 400 }
            )
        }

        // Validate evidence requirements
        const evidenceRequiredQuestions = questions.filter((q: any) => q.evidenceRequired)
        const missingEvidence = evidenceRequiredQuestions.filter((q: any) => {
            const response = answeredQuestions.find((r: any) => r.questionId === q.id)
            return !response?.evidenceIds || response.evidenceIds.length === 0
        })

        if (missingEvidence.length > 0) {
            return NextResponse.json(
                {
                    error: 'Missing required evidence',
                    missingEvidence: missingEvidence.map((q: any) => q.question)
                },
                { status: 400 }
            )
        }

        // Update inspection with responses and mark as completed
        const updateResult = await supabaseDatabase.updateInspection(id, {
            responses: body.responses.reduce((acc: any, response: any) => {
                acc[response.questionId] = response
                return acc
            }, {}),
        })

        if (updateResult.error) {
            return NextResponse.json(
                { error: 'Failed to save responses' },
                { status: 500 }
            )
        }

        // Update status to IN_REVIEW for manager approval
        const statusResult = await supabaseDatabase.updateInspectionStatus(
            id,
            'IN_REVIEW',
            { submitted_at: new Date().toISOString() }
        )

        if (statusResult.error) {
            return NextResponse.json(
                { error: 'Failed to update inspection status' },
                { status: 500 }
            )
        }

        // Log audit event
        await logAuditEvent('INSPECTION', id, 'COMPLETED', user!.id, {
            responseCount: body.responses.length,
            requiredAnswered: answeredQuestions.length,
            evidenceProvided: body.responses.filter((r: any) => r.evidenceIds?.length > 0).length,
        })

        // Create notification for project manager
        await supabaseDatabase.createNotification({
            user_id: inspection.project?.created_by || inspection.assigned_to, // Fallback if no project manager
            type: 'INSPECTION_COMPLETED',
            title: 'Inspection Ready for Review',
            message: `${inspection.title} has been completed and is ready for your review`,
            related_entity_type: 'INSPECTION',
            related_entity_id: id,
            priority: inspection.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        })

        return NextResponse.json({
            success: true,
            message: 'Inspection completed successfully',
            status: 'IN_REVIEW',
            submittedAt: new Date().toISOString(),
        })

    } catch (error) {
        console.error('Error completing inspection:', error)
        return NextResponse.json(
            { error: 'Failed to complete inspection' },
            { status: 500 }
        )
    }
}