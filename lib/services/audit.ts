import { supabaseDatabase } from '@/lib/supabase/database'

export class AuditService {
  static async logAction(data: {
    entityType: string
    entityId: string
    action: string
    userId?: string | null
    metadata?: Record<string, unknown>
  }): Promise<void> {
    // For demo purposes - log to console
    // In production, use Supabase database to store audit logs
    console.log('Audit log:', data)
  }

  static async getAuditTrail(entityType: string, entityId: string) {
    // For demo purposes - return empty array
    // In production, use Supabase database to retrieve audit logs
    return []
  }
}

// Export for backward compatibility
export const AuditTrailService = AuditService
