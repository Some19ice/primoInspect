export interface ChecklistQuestion {
  id: string
  question: string
  type: 'boolean' | 'text' | 'number' | 'select' | 'multiselect'
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  category: string
  evidenceRequired?: boolean
  description?: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  description: string
  projectType: 'SOLAR' | 'WIND' | 'BATTERY' | 'HYBRID' | 'CUSTOM'
  version: string
  questions: ChecklistQuestion[]
  estimatedDuration: number // minutes
  categories: string[]
}

export const SOLAR_FARM_CHECKLIST: ChecklistTemplate = {
  id: 'solar-farm-inspection',
  name: 'Solar Farm Inspection',
  description: 'Comprehensive inspection checklist for solar photovoltaic installations',
  projectType: 'SOLAR',
  version: '1.0',
  estimatedDuration: 120,
  categories: ['Safety', 'Electrical', 'Mechanical', 'Performance', 'Environmental'],
  questions: [
    // Safety Category
    {
      id: 'safety-ppe',
      question: 'Are all personnel wearing appropriate PPE?',
      type: 'boolean',
      required: true,
      category: 'Safety',
      evidenceRequired: true,
      description: 'Verify hard hats, safety glasses, and electrical gloves are worn'
    },
    {
      id: 'safety-lockout',
      question: 'Is proper lockout/tagout procedure followed?',
      type: 'boolean',
      required: true,
      category: 'Safety',
      evidenceRequired: true
    },
    {
      id: 'safety-hazards',
      question: 'Document any safety hazards observed',
      type: 'text',
      required: false,
      category: 'Safety',
      evidenceRequired: true
    },

    // Electrical Category
    {
      id: 'electrical-voltage',
      question: 'DC voltage reading at combiner box (V)',
      type: 'number',
      required: true,
      category: 'Electrical',
      validation: { min: 0, max: 1500 },
      evidenceRequired: true
    },
    {
      id: 'electrical-current',
      question: 'DC current reading (A)',
      type: 'number',
      required: true,
      category: 'Electrical',
      validation: { min: 0, max: 100 }
    },
    {
      id: 'electrical-connections',
      question: 'Are all electrical connections secure?',
      type: 'boolean',
      required: true,
      category: 'Electrical',
      evidenceRequired: true
    },
    {
      id: 'electrical-grounding',
      question: 'Is grounding system properly installed?',
      type: 'boolean',
      required: true,
      category: 'Electrical'
    },

    // Mechanical Category
    {
      id: 'mechanical-mounting',
      question: 'Are panel mounting systems secure?',
      type: 'boolean',
      required: true,
      category: 'Mechanical',
      evidenceRequired: true
    },
    {
      id: 'mechanical-damage',
      question: 'Any visible damage to panels or frames?',
      type: 'boolean',
      required: true,
      category: 'Mechanical',
      evidenceRequired: true
    },
    {
      id: 'mechanical-tracking',
      question: 'Tracking system operation (if applicable)',
      type: 'select',
      required: false,
      category: 'Mechanical',
      options: ['Normal', 'Irregular', 'Not Working', 'N/A']
    },

    // Performance Category
    {
      id: 'performance-irradiance',
      question: 'Solar irradiance reading (W/m²)',
      type: 'number',
      required: true,
      category: 'Performance',
      validation: { min: 0, max: 1500 }
    },
    {
      id: 'performance-temperature',
      question: 'Panel temperature (°C)',
      type: 'number',
      required: true,
      category: 'Performance',
      validation: { min: -40, max: 85 }
    },
    {
      id: 'performance-output',
      question: 'Is power output within expected range?',
      type: 'boolean',
      required: true,
      category: 'Performance'
    },

    // Environmental Category
    {
      id: 'environmental-cleanliness',
      question: 'Panel cleanliness assessment',
      type: 'select',
      required: true,
      category: 'Environmental',
      options: ['Clean', 'Light Soiling', 'Heavy Soiling', 'Requires Cleaning'],
      evidenceRequired: true
    },
    {
      id: 'environmental-vegetation',
      question: 'Is vegetation properly managed around installation?',
      type: 'boolean',
      required: true,
      category: 'Environmental'
    }
  ]
}

export const WIND_FARM_CHECKLIST: ChecklistTemplate = {
  id: 'wind-farm-inspection',
  name: 'Wind Farm Inspection',
  description: 'Comprehensive inspection checklist for wind turbine installations',
  projectType: 'WIND',
  version: '1.0',
  estimatedDuration: 180,
  categories: ['Safety', 'Mechanical', 'Electrical', 'Performance', 'Environmental'],
  questions: [
    // Safety Category
    {
      id: 'safety-fall-protection',
      question: 'Is fall protection equipment properly used?',
      type: 'boolean',
      required: true,
      category: 'Safety',
      evidenceRequired: true
    },
    {
      id: 'safety-wind-speed',
      question: 'Current wind speed (m/s)',
      type: 'number',
      required: true,
      category: 'Safety',
      validation: { min: 0, max: 50 }
    },
    {
      id: 'safety-access',
      question: 'Are access routes safe and clear?',
      type: 'boolean',
      required: true,
      category: 'Safety'
    },

    // Mechanical Category
    {
      id: 'mechanical-blades',
      question: 'Blade condition assessment',
      type: 'select',
      required: true,
      category: 'Mechanical',
      options: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
      evidenceRequired: true
    },
    {
      id: 'mechanical-gearbox',
      question: 'Gearbox oil level and condition',
      type: 'select',
      required: true,
      category: 'Mechanical',
      options: ['Normal', 'Low', 'Contaminated', 'Requires Service']
    },
    {
      id: 'mechanical-vibration',
      question: 'Abnormal vibrations detected?',
      type: 'boolean',
      required: true,
      category: 'Mechanical',
      evidenceRequired: true
    },

    // Electrical Category
    {
      id: 'electrical-generator',
      question: 'Generator output voltage (V)',
      type: 'number',
      required: true,
      category: 'Electrical',
      validation: { min: 0, max: 50000 }
    },
    {
      id: 'electrical-transformer',
      question: 'Transformer condition',
      type: 'select',
      required: true,
      category: 'Electrical',
      options: ['Normal', 'Overheating', 'Oil Leak', 'Requires Service']
    },

    // Performance Category
    {
      id: 'performance-power-output',
      question: 'Current power output (kW)',
      type: 'number',
      required: true,
      category: 'Performance',
      validation: { min: 0, max: 10000 }
    },
    {
      id: 'performance-availability',
      question: 'Turbine availability status',
      type: 'select',
      required: true,
      category: 'Performance',
      options: ['Available', 'Maintenance', 'Fault', 'Offline']
    }
  ]
}

export const BATTERY_STORAGE_CHECKLIST: ChecklistTemplate = {
  id: 'battery-storage-inspection',
  name: 'Battery Storage System Inspection',
  description: 'Inspection checklist for energy storage systems',
  projectType: 'BATTERY',
  version: '1.0',
  estimatedDuration: 90,
  categories: ['Safety', 'Electrical', 'Thermal', 'Performance', 'Environmental'],
  questions: [
    // Safety Category
    {
      id: 'safety-ventilation',
      question: 'Is ventilation system operating properly?',
      type: 'boolean',
      required: true,
      category: 'Safety',
      evidenceRequired: true
    },
    {
      id: 'safety-fire-suppression',
      question: 'Fire suppression system status',
      type: 'select',
      required: true,
      category: 'Safety',
      options: ['Active', 'Maintenance Mode', 'Fault', 'Offline']
    },

    // Electrical Category
    {
      id: 'electrical-battery-voltage',
      question: 'Battery bank voltage (V)',
      type: 'number',
      required: true,
      category: 'Electrical',
      validation: { min: 0, max: 1500 }
    },
    {
      id: 'electrical-soc',
      question: 'State of charge (%)',
      type: 'number',
      required: true,
      category: 'Electrical',
      validation: { min: 0, max: 100 }
    },

    // Thermal Category
    {
      id: 'thermal-temperature',
      question: 'Battery temperature (°C)',
      type: 'number',
      required: true,
      category: 'Thermal',
      validation: { min: -20, max: 60 }
    },
    {
      id: 'thermal-cooling',
      question: 'Cooling system operation',
      type: 'select',
      required: true,
      category: 'Thermal',
      options: ['Normal', 'Reduced Capacity', 'Fault', 'Offline']
    }
  ]
}

export const PRIMARIS_SAFETY_AUDIT: ChecklistTemplate = {
  id: 'primaris-safety-audit',
  name: 'Primaris Site Safety Audit Report',
  description: 'Comprehensive site safety audit checklist covering all major safety categories per Primaris standards',
  projectType: 'CUSTOM',
  version: '1.0',
  estimatedDuration: 90,
  categories: ['First Aid/Emergency Info', 'Electrical/Hand Tools', 'Excavating/Shoring', 'Fall Protection', 'Housekeeping', 'Fire Prevention', 'Confined Spaces', 'Other Safety Items', 'Summary'],
  questions: [
    // First Aid/Emergency Info
    {
      id: 'first-aid-card-completed',
      question: 'First Aid Card Completed and Signed',
      type: 'boolean',
      required: true,
      category: 'First Aid/Emergency Info',
      evidenceRequired: false
    },
    {
      id: 'cpr-aed-trained-personnel',
      question: 'CPR/AED Trained Personnel',
      type: 'boolean',
      required: true,
      category: 'First Aid/Emergency Info',
      evidenceRequired: false
    },
    {
      id: 'first-aid-kit-checked-weekly',
      question: 'First Aid Kit Checked Weekly',
      type: 'boolean',
      required: true,
      category: 'First Aid/Emergency Info',
      evidenceRequired: false
    },
    {
      id: 'proper-permits-obtained',
      question: 'Proper Permits Obtained',
      type: 'boolean',
      required: true,
      category: 'First Aid/Emergency Info',
      evidenceRequired: true
    },
    {
      id: 'safety-meeting-complete',
      question: 'Safety Meeting Complete',
      type: 'boolean',
      required: true,
      category: 'First Aid/Emergency Info',
      evidenceRequired: false
    },
    {
      id: 'documentation-available',
      question: 'Documentation Available',
      type: 'boolean',
      required: true,
      category: 'First Aid/Emergency Info',
      evidenceRequired: false
    },

    // Electrical/Hand Tools
    {
      id: 'electrical-hand-tools-inspected',
      question: 'Electrical/Hand Tools Inspected',
      type: 'boolean',
      required: true,
      category: 'Electrical/Hand Tools',
      evidenceRequired: true
    },
    {
      id: 'cords-serviceable',
      question: 'Cords Serviceable',
      type: 'boolean',
      required: true,
      category: 'Electrical/Hand Tools',
      evidenceRequired: false
    },
    {
      id: 'gfci-in-place',
      question: 'GFCI in Place',
      type: 'boolean',
      required: true,
      category: 'Electrical/Hand Tools',
      evidenceRequired: true
    },
    {
      id: 'gfci-tested',
      question: 'GFCI Tested',
      type: 'boolean',
      required: true,
      category: 'Electrical/Hand Tools',
      evidenceRequired: false
    },
    {
      id: 'proper-tool-box-talk',
      question: 'Proper Tool Box Talk',
      type: 'boolean',
      required: true,
      category: 'Electrical/Hand Tools',
      evidenceRequired: false
    },
    {
      id: 'ppe-required',
      question: 'PPE Required',
      type: 'boolean',
      required: true,
      category: 'Electrical/Hand Tools',
      evidenceRequired: false
    },

    // Excavating/Shoring
    {
      id: 'all-one-calls-completed',
      question: 'All One Calls Completed',
      type: 'boolean',
      required: true,
      category: 'Excavating/Shoring',
      evidenceRequired: true
    },
    {
      id: 'daily-checklist-complete',
      question: 'Daily Checklist Complete',
      type: 'boolean',
      required: true,
      category: 'Excavating/Shoring',
      evidenceRequired: false
    },
    {
      id: 'competent-person-onsite',
      question: 'Competent Person On-Site',
      type: 'boolean',
      required: true,
      category: 'Excavating/Shoring',
      evidenceRequired: false
    },
    {
      id: 'proper-sloping-shoring',
      question: 'Proper Sloping/Shoring',
      type: 'boolean',
      required: true,
      category: 'Excavating/Shoring',
      evidenceRequired: true
    },
    {
      id: 'dewatering-complete',
      question: 'Dewatering Complete',
      type: 'boolean',
      required: false,
      category: 'Excavating/Shoring',
      evidenceRequired: false
    },
    {
      id: 'ladders-serviceable',
      question: 'Ladders Serviceable',
      type: 'boolean',
      required: true,
      category: 'Excavating/Shoring',
      evidenceRequired: false
    },

    // Fall Protection
    {
      id: 'fall-protection-plan',
      question: 'Fall Protection Plan',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'tied-off-6ft-above-standing',
      question: 'Tied Off 6 Feet Above Standing',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: true
    },
    {
      id: 'foot-protection',
      question: 'Foot Protection',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'head-protection',
      question: 'Head Protection',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'home-reflective-vest-hi-vis',
      question: 'Home/Reflective Vest/Hi-Vis',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'hearing-protection',
      question: 'Hearing Protection',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'permit-obtained',
      question: 'Permit Obtained',
      type: 'boolean',
      required: false,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'harness-serviceable',
      question: 'Harness Serviceable',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'harness-worn-properly',
      question: 'Harness Worn Properly',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: true
    },
    {
      id: 'proper-lanyard',
      question: 'Proper Lanyard',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },
    {
      id: 'impact-hazard-avoided',
      question: 'Impact Hazard Avoided',
      type: 'boolean',
      required: true,
      category: 'Fall Protection',
      evidenceRequired: false
    },

    // Housekeeping
    {
      id: 'clean-orderly-work-area',
      question: 'Clean/Orderly Work Area',
      type: 'boolean',
      required: true,
      category: 'Housekeeping',
      evidenceRequired: true
    },
    {
      id: 'items-labeled-stored-properly',
      question: 'Items Labeled/Stored Properly',
      type: 'boolean',
      required: true,
      category: 'Housekeeping',
      evidenceRequired: false
    },
    {
      id: 'walkways-clear',
      question: 'Walkways Clear',
      type: 'boolean',
      required: true,
      category: 'Housekeeping',
      evidenceRequired: false
    },
    {
      id: 'items-labeled-stored-properly-2',
      question: 'Items Labeled/Stored Properly',
      type: 'boolean',
      required: true,
      category: 'Housekeeping',
      evidenceRequired: false
    },

    // Fire Prevention
    {
      id: 'fire-extinguisher-available',
      question: 'Fire Extinguisher Available',
      type: 'boolean',
      required: true,
      category: 'Fire Prevention',
      evidenceRequired: false
    },
    {
      id: 'monthly-fire-extinguisher-inspection',
      question: 'Monthly Fire Extinguisher Inspection',
      type: 'boolean',
      required: true,
      category: 'Fire Prevention',
      evidenceRequired: false
    },
    {
      id: 'hot-work-permit-available',
      question: 'Hot Work Permit Available',
      type: 'boolean',
      required: false,
      category: 'Fire Prevention',
      evidenceRequired: false
    },
    {
      id: 'proper-size-extinguisher-available',
      question: 'Proper Size Extinguisher Available',
      type: 'boolean',
      required: true,
      category: 'Fire Prevention',
      evidenceRequired: false
    },
    {
      id: 'safety-watch-fire-watch',
      question: 'Safety Watch/Fire Watch',
      type: 'boolean',
      required: false,
      category: 'Fire Prevention',
      evidenceRequired: false
    },

    // Confined Spaces
    {
      id: 'permit-obtained-confined',
      question: 'Permit Obtained',
      type: 'boolean',
      required: false,
      category: 'Confined Spaces',
      evidenceRequired: false
    },
    {
      id: 'area-identified',
      question: 'Area Identified',
      type: 'boolean',
      required: false,
      category: 'Confined Spaces',
      evidenceRequired: false
    },
    {
      id: 'atmospheric-test-documentation',
      question: 'Atmospheric Test/Documentation',
      type: 'boolean',
      required: false,
      category: 'Confined Spaces',
      evidenceRequired: true
    },
    {
      id: 'rescue-plan-in-place',
      question: 'Rescue Plan in Place',
      type: 'boolean',
      required: false,
      category: 'Confined Spaces',
      evidenceRequired: false
    },

    // Other Safety Items
    {
      id: 'proper-metal-gas-cans',
      question: 'Proper Metal Gas Cans',
      type: 'boolean',
      required: true,
      category: 'Other Safety Items',
      evidenceRequired: false
    },
    {
      id: 'bulk-stored-fuel-labeled',
      question: 'Bulk Stored Fuel Labeled',
      type: 'boolean',
      required: true,
      category: 'Other Safety Items',
      evidenceRequired: false
    },
    {
      id: 'flammable-cabinet-available',
      question: 'Flammable Cabinet Available',
      type: 'boolean',
      required: false,
      category: 'Other Safety Items',
      evidenceRequired: false
    },
    {
      id: 'qualified-rigger',
      question: 'Qualified Rigger',
      type: 'boolean',
      required: false,
      category: 'Other Safety Items',
      evidenceRequired: false
    },
    {
      id: 'housekeeping-free-of-defective-issues',
      question: 'Housekeeping Free of Defective Issues',
      type: 'boolean',
      required: true,
      category: 'Other Safety Items',
      evidenceRequired: false
    },
    {
      id: 'white-check-on-all-connections',
      question: 'White Check on All Connections',
      type: 'boolean',
      required: true,
      category: 'Other Safety Items',
      evidenceRequired: false
    },
    {
      id: 'lockout-tagout-available',
      question: 'Lockout/Tagout Available',
      type: 'boolean',
      required: true,
      category: 'Other Safety Items',
      evidenceRequired: false
    },
    {
      id: 'eye-wash-station',
      question: 'Eye Wash Station',
      type: 'boolean',
      required: false,
      category: 'Other Safety Items',
      evidenceRequired: false
    },

    // Summary
    {
      id: 'safety-inspection-summary',
      question: 'Safety Inspection Summary - Discrepancy',
      type: 'text',
      required: false,
      category: 'Summary',
      evidenceRequired: false,
      description: 'Document any safety discrepancies observed during the inspection'
    },
    {
      id: 'corrective-action',
      question: 'Corrective Action',
      type: 'text',
      required: false,
      category: 'Summary',
      evidenceRequired: false,
      description: 'Document corrective actions taken or required to address any issues'
    },
    {
      id: 'safety-rating',
      question: 'Safety Rating',
      type: 'select',
      required: true,
      category: 'Summary',
      options: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory'],
      evidenceRequired: false
    },
    {
      id: 'ehs-non-ehs',
      question: 'EHS/Non-EHS Classification',
      type: 'select',
      required: true,
      category: 'Summary',
      options: ['EHS', 'Non-EHS'],
      evidenceRequired: false
    }
  ]
}

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  SOLAR_FARM_CHECKLIST,
  WIND_FARM_CHECKLIST,
  BATTERY_STORAGE_CHECKLIST,
  PRIMARIS_SAFETY_AUDIT
]

export function getTemplateByProjectType(projectType: string): ChecklistTemplate[] {
  return CHECKLIST_TEMPLATES.filter(template =>
    template.projectType === projectType || template.projectType === 'CUSTOM'
  )
}

export function getTemplateById(id: string): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES.find(template => template.id === id)
}
