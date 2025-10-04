interface ChecklistQuestion {
    id: string
    type: string
    question: string
    required: boolean
    evidenceRequired?: boolean
    conditions?: Array<{
        questionId: string
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
        value: any
    }>
    validation?: {
        min?: number
        max?: number
        pattern?: string
        customValidator?: string
    }
}

interface ChecklistResponse {
    questionId: string
    value: any
    evidenceIds?: string[]
    notes?: string
}

export class ChecklistValidator {
    static validateResponse(
        question: ChecklistQuestion,
        response: ChecklistResponse
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // Required field validation
        if (question.required && (response.value === undefined || response.value === null || response.value === '')) {
            errors.push(`${question.question} is required`)
        }

        // Type-specific validation
        switch (question.type) {
            case 'number':
                if (response.value !== undefined && response.value !== '') {
                    const numValue = Number(response.value)
                    if (isNaN(numValue)) {
                        errors.push(`${question.question} must be a valid number`)
                    } else {
                        if (question.validation?.min !== undefined && numValue < question.validation.min) {
                            errors.push(`${question.question} must be at least ${question.validation.min}`)
                        }
                        if (question.validation?.max !== undefined && numValue > question.validation.max) {
                            errors.push(`${question.question} must be no more than ${question.validation.max}`)
                        }
                    }
                }
                break

            case 'text':
                if (response.value && question.validation?.pattern) {
                    const regex = new RegExp(question.validation.pattern)
                    if (!regex.test(response.value)) {
                        errors.push(`${question.question} format is invalid`)
                    }
                }
                break

            case 'multiselect':
                if (response.value && Array.isArray(response.value)) {
                    if (question.validation?.min && response.value.length < question.validation.min) {
                        errors.push(`${question.question} requires at least ${question.validation.min} selections`)
                    }
                    if (question.validation?.max && response.value.length > question.validation.max) {
                        errors.push(`${question.question} allows maximum ${question.validation.max} selections`)
                    }
                }
                break
        }

        // Evidence validation
        if (question.evidenceRequired && (!response.evidenceIds || response.evidenceIds.length === 0)) {
            errors.push(`${question.question} requires evidence to be uploaded`)
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    static validateConditionalDisplay(
        question: ChecklistQuestion,
        allResponses: Record<string, ChecklistResponse>
    ): boolean {
        if (!question.conditions || question.conditions.length === 0) {
            return true // No conditions, always show
        }

        return question.conditions.every(condition => {
            const dependentResponse = allResponses[condition.questionId]
            if (!dependentResponse) return false

            const responseValue = dependentResponse.value

            switch (condition.operator) {
                case 'equals':
                    return responseValue === condition.value
                case 'not_equals':
                    return responseValue !== condition.value
                case 'greater_than':
                    return Number(responseValue) > Number(condition.value)
                case 'less_than':
                    return Number(responseValue) < Number(condition.value)
                case 'contains':
                    if (Array.isArray(responseValue)) {
                        return responseValue.includes(condition.value)
                    }
                    return String(responseValue).toLowerCase().includes(String(condition.value).toLowerCase())
                default:
                    return false
            }
        })
    }

    static validateCompleteChecklist(
        questions: ChecklistQuestion[],
        responses: Record<string, ChecklistResponse>
    ): {
        isComplete: boolean
        errors: string[]
        warnings: string[]
        missingRequired: string[]
        missingEvidence: string[]
        completionRate: number
    } {
        const errors: string[] = []
        const warnings: string[] = []
        const missingRequired: string[] = []
        const missingEvidence: string[] = []

        // Filter questions that should be displayed based on conditions
        const visibleQuestions = questions.filter(q =>
            this.validateConditionalDisplay(q, responses)
        )

        let answeredCount = 0

        visibleQuestions.forEach(question => {
            const response = responses[question.id]
            const validation = this.validateResponse(question, response || { questionId: question.id, value: undefined })

            if (!validation.isValid) {
                errors.push(...validation.errors)

                if (question.required) {
                    missingRequired.push(question.question)
                }

                if (question.evidenceRequired && (!response?.evidenceIds || response.evidenceIds.length === 0)) {
                    missingEvidence.push(question.question)
                }
            } else if (response && response.value !== undefined && response.value !== '') {
                answeredCount++
            }

            // Add warnings for optional but recommended fields
            if (!question.required && (!response || response.value === undefined || response.value === '')) {
                if (question.type === 'boolean' || question.evidenceRequired) {
                    warnings.push(`Consider completing: ${question.question}`)
                }
            }
        })

        const completionRate = visibleQuestions.length > 0
            ? Math.round((answeredCount / visibleQuestions.length) * 100)
            : 100

        return {
            isComplete: errors.length === 0,
            errors,
            warnings,
            missingRequired,
            missingEvidence,
            completionRate
        }
    }

    static getNextRecommendedQuestion(
        questions: ChecklistQuestion[],
        responses: Record<string, ChecklistResponse>
    ): ChecklistQuestion | null {
        // Find the first unanswered required question
        const visibleQuestions = questions.filter(q =>
            this.validateConditionalDisplay(q, responses)
        )

        const unansweredRequired = visibleQuestions.find(q =>
            q.required && (!responses[q.id] || responses[q.id].value === undefined || responses[q.id].value === '')
        )

        if (unansweredRequired) return unansweredRequired

        // Find the first unanswered optional question
        const unansweredOptional = visibleQuestions.find(q =>
            !q.required && (!responses[q.id] || responses[q.id].value === undefined || responses[q.id].value === '')
        )

        return unansweredOptional || null
    }
}

// Enhanced question templates with conditional logic
export const ENHANCED_QUESTION_TEMPLATES = {
    SAFETY_CONDITIONAL: {
        id: 'safety-hazards-present',
        question: 'Are there any safety hazards present?',
        type: 'boolean',
        required: true,
        category: 'Safety',
    },
    SAFETY_DETAILS: {
        id: 'safety-hazard-details',
        question: 'Describe the safety hazards in detail',
        type: 'text',
        required: true,
        evidenceRequired: true,
        category: 'Safety',
        conditions: [
            {
                questionId: 'safety-hazards-present',
                operator: 'equals',
                value: true
            }
        ]
    },
    EQUIPMENT_RATING: {
        id: 'equipment-condition',
        question: 'Rate the overall equipment condition',
        type: 'rating',
        required: true,
        scale: 5,
        category: 'Equipment',
    },
    EQUIPMENT_MAINTENANCE: {
        id: 'maintenance-required',
        question: 'What maintenance is required?',
        type: 'multiselect',
        required: true,
        evidenceRequired: true,
        category: 'Equipment',
        options: ['Cleaning', 'Lubrication', 'Replacement', 'Calibration', 'Repair'],
        conditions: [
            {
                questionId: 'equipment-condition',
                operator: 'less_than',
                value: 4
            }
        ],
        validation: {
            min: 1,
            max: 3
        }
    }
}