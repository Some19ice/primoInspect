/**
 * Inspection State Machine
 * Manages inspection status transitions with validation
 */

export type InspectionStatus = 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface InspectionData {
  id: string
  status: InspectionStatus
  responses: Record<string, any>
  checklists?: {
    questions: Array<{
      id: string
      question: string
      required: boolean
      type: string
      evidenceRequired?: boolean
    }>
  }
  evidence?: Array<{
    id: string
    question_id?: string
  }>
  rejection_count?: number
}

export class InspectionStateMachine {
  // Define valid status transitions
  private static readonly TRANSITIONS: Record<
    InspectionStatus,
    InspectionStatus[]
  > = {
    DRAFT: ['PENDING'],
    PENDING: ['IN_REVIEW', 'DRAFT'], // Can go back to draft
    IN_REVIEW: ['APPROVED', 'REJECTED', 'PENDING'],
    APPROVED: [], // Terminal state
    REJECTED: ['PENDING', 'DRAFT'], // Can be revised and resubmitted
  }

  // Maximum rejection count before escalation
  private static readonly MAX_REJECTIONS = 2

  /**
   * Check if a transition is valid
   */
  static canTransition(from: InspectionStatus, to: InspectionStatus): boolean {
    return this.TRANSITIONS[from]?.includes(to) || false
  }

  /**
   * Get all valid transitions from a status
   */
  static getValidTransitions(status: InspectionStatus): InspectionStatus[] {
    return this.TRANSITIONS[status] || []
  }

  /**
   * Validate if inspection can transition to new status
   */
  static validateTransition(
    inspection: InspectionData,
    toStatus: InspectionStatus
  ): ValidationResult {
    const errors: string[] = []

    // Check if transition is allowed
    if (!this.canTransition(inspection.status, toStatus)) {
      errors.push(`Cannot transition from ${inspection.status} to ${toStatus}`)
      return { valid: false, errors }
    }

    // Status-specific validations
    switch (toStatus) {
      case 'PENDING':
        return this.validateSubmission(inspection)

      case 'IN_REVIEW':
        // Manager can start review from pending
        if (inspection.status !== 'PENDING') {
          errors.push('Can only review inspections in PENDING status')
        }
        break

      case 'APPROVED':
        // Must be in review
        if (inspection.status !== 'IN_REVIEW') {
          errors.push('Can only approve inspections in IN_REVIEW status')
        }
        break

      case 'REJECTED':
        // Must be in review
        if (inspection.status !== 'IN_REVIEW') {
          errors.push('Can only reject inspections in IN_REVIEW status')
        }
        // Check escalation threshold
        if ((inspection.rejection_count || 0) >= this.MAX_REJECTIONS) {
          errors.push(
            'Inspection has reached maximum rejections - requires escalation'
          )
        }
        break
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate inspection is ready for submission
   */
  static validateSubmission(inspection: InspectionData): ValidationResult {
    const errors: string[] = []

    // Check if checklist exists
    if (!inspection.checklists) {
      errors.push('Inspection checklist not found')
      return { valid: false, errors }
    }

    const questions = inspection.checklists.questions || []
    const responses = inspection.responses || {}
    const evidence = inspection.evidence || []

    // Validate required questions are answered
    const requiredQuestions = questions.filter(q => q.required)
    const unansweredRequired = requiredQuestions.filter(q => {
      const response = responses[q.id]
      return (
        !response ||
        response.value === undefined ||
        response.value === null ||
        response.value === ''
      )
    })

    if (unansweredRequired.length > 0) {
      errors.push(
        `${unansweredRequired.length} required question(s) not answered`
      )
    }

    // Validate evidence for questions that explicitly require it
    const questionsRequiringEvidence = questions.filter(
      q => q.evidenceRequired === true
    )

    questionsRequiringEvidence.forEach(question => {
      const hasEvidence = evidence.some(e => e.question_id === question.id)
      if (!hasEvidence) {
        errors.push(`Evidence required for question: "${question.question}"`)
      }
    })

    return { valid: errors.length === 0, errors }
  }

  /**
   * Check if inspection requires escalation
   */
  static requiresEscalation(inspection: InspectionData): boolean {
    return (inspection.rejection_count || 0) >= this.MAX_REJECTIONS
  }

  /**
   * Get next recommended action for an inspection
   */
  static getNextAction(inspection: InspectionData): {
    action: string
    description: string
  } {
    switch (inspection.status) {
      case 'DRAFT':
        return {
          action: 'SUBMIT',
          description: 'Complete and submit for review',
        }
      case 'PENDING':
        return {
          action: 'WAIT',
          description: 'Waiting for manager review',
        }
      case 'IN_REVIEW':
        return {
          action: 'WAIT',
          description: 'Under review by manager',
        }
      case 'APPROVED':
        return {
          action: 'COMPLETE',
          description: 'Inspection approved - no action needed',
        }
      case 'REJECTED':
        return {
          action: 'REVISE',
          description: 'Address feedback and resubmit',
        }
      default:
        return {
          action: 'UNKNOWN',
          description: 'Unknown status',
        }
    }
  }

  /**
   * Calculate inspection completion percentage
   */
  static calculateProgress(inspection: InspectionData): number {
    if (!inspection.checklists?.questions) return 0

    const questions = inspection.checklists.questions
    const responses = inspection.responses || {}

    if (questions.length === 0) return 0

    const answeredCount = questions.filter(q => {
      const response = responses[q.id]
      return response && response.value !== undefined && response.value !== null
    }).length

    return Math.round((answeredCount / questions.length) * 100)
  }

  /**
   * Get inspection status color for UI
   */
  static getStatusColor(status: InspectionStatus): string {
    switch (status) {
      case 'DRAFT':
        return 'gray'
      case 'PENDING':
        return 'yellow'
      case 'IN_REVIEW':
        return 'blue'
      case 'APPROVED':
        return 'green'
      case 'REJECTED':
        return 'red'
      default:
        return 'gray'
    }
  }

  /**
   * Get user-friendly status label
   */
  static getStatusLabel(status: InspectionStatus): string {
    return status.replace('_', ' ')
  }
}
