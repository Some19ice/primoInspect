-- Fix ASSIGNED status issue
-- The inspections table CHECK constraint only allows: 'DRAFT', 'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'
-- But seed data had 'ASSIGNED' which causes constraint violations

-- Update any inspections with ASSIGNED status to DRAFT
UPDATE inspections 
SET status = 'DRAFT'
WHERE status = 'ASSIGNED';

-- Add a comment to document the valid statuses
COMMENT ON COLUMN inspections.status IS 'Valid values: DRAFT, PENDING, IN_REVIEW, APPROVED, REJECTED';
