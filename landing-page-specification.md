# PrimoInspect Landing Page Specification
## Mobile-First Next.js Web Application

**Document Version:** 1.0  
**Last Updated:** October 4, 2025  
**Purpose:** Design specification for PrimoInspect marketing landing page

---

## 1. Executive Overview

### Purpose
This document defines the visual design, content structure, user experience, and technical requirements for the PrimoInspect landing page. The page serves as the primary digital entry point for potential clients, field teams, and stakeholders to learn about the platform and initiate engagement.

### Target Audience
- **Primary:** Renewable energy project managers and executives evaluating digital inspection solutions
- **Secondary:** Field inspectors seeking efficient mobile tools
- **Tertiary:** C-suite decision makers assessing ROI and strategic value

### Key Objectives
1. Communicate PrimoInspect's value proposition within 5 seconds
2. Demonstrate industry specialization in renewable energy
3. Drive qualified demo requests and trial signups
4. Establish credibility through social proof and metrics
5. Optimize for mobile-first experience with seamless desktop scaling

---

## 2. Design Philosophy & Brand Identity

### Visual Language

**Color Palette**
- **Primary Brand Color:** Deep Ocean Blue (#0A2540)
  - Represents trust, stability, and professionalism
  - Used for headers, primary CTAs, and key UI elements
  
- **Secondary Brand Color:** Renewable Green (#10B981)
  - Symbolizes sustainability and renewable energy focus
  - Used for accents, success states, and energy-related icons
  
- **Accent Color:** Solar Orange (#F59E0B)
  - Conveys energy, innovation, and action
  - Used sparingly for highlights and secondary CTAs

- **Neutral Grays:**
  - Background: #F9FAFB (light gray)
  - Text Primary: #111827 (near black)
  - Text Secondary: #6B7280 (medium gray)
  - Borders: #E5E7EB (light gray)

**Typography**
- **Headings:** Inter or SF Pro Display
  - H1: 48px (mobile: 32px) - Bold, tight line-height (1.1)
  - H2: 36px (mobile: 28px) - Semibold
  - H3: 28px (mobile: 24px) - Semibold
  - H4: 20px (mobile: 18px) - Medium
  
- **Body Text:** Inter or SF Pro Text
  - Large: 18px - Regular (hero descriptions)
  - Base: 16px - Regular (standard content)
  - Small: 14px - Regular (captions, metadata)

**Spacing System**
- Base unit: 8px
- Scale: 8, 16, 24, 32, 48, 64, 96, 128px
- Mobile padding: 16-24px horizontal
- Desktop max-width: 1280px centered

**Visual Style**
- Clean, modern, professional aesthetic
- Generous white space for readability
- Subtle shadows and depth (avoid flat design)
- Rounded corners (8px for cards, 6px for buttons)
- High-quality photography featuring real renewable energy sites
- Iconography: Outline style with 2px stroke weight

---

## 3. Page Structure & Sections

### 3.1 Navigation Header (Sticky)

**Mobile Layout (< 768px)**
```
┌─────────────────────────────────────┐
│ [Logo]              [Menu Icon ☰]  │
└─────────────────────────────────────┘
```

**Desktop Layout (≥ 768px)**
```
┌──────────────────────────────────────────────────────────┐
│ [Logo]  Features  Solutions  Pricing  About  [Request Demo] │
└──────────────────────────────────────────────────────────┘
```

**Specifications:**
- Height: 64px (mobile), 72px (desktop)
- Background: White with subtle shadow on scroll
- Logo: 140px width (mobile), 180px width (desktop)
- Navigation links: 16px, medium weight, #374151 color
- CTA button: Solid green background, white text, 12px padding
- Sticky behavior: Remains visible on scroll with smooth transition
- Mobile menu: Full-screen overlay with fade-in animation



### 3.2 Hero Section

**Visual Hierarchy**
```
Mobile Layout:
┌─────────────────────────────────────┐
│                                     │
│    [Headline - 2 lines max]        │
│                                     │
│    [Subheadline - 3 lines]         │
│                                     │
│    [Primary CTA Button]            │
│    [Secondary CTA Link]            │
│                                     │
│    [Hero Image/Video]              │
│                                     │
│    [Trust Indicators Row]          │
│                                     │
└─────────────────────────────────────┘

Desktop Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Headline]                    [Hero Image/Video]       │
│  [Subheadline]                 [Interactive Demo]       │
│                                                          │
│  [Primary CTA] [Secondary CTA]                          │
│                                                          │
│  [Trust Indicators Row]                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Content Specifications:**

**Headline:**
- Text: "Transform Renewable Energy Inspections with Digital Intelligence"
- Alternative: "Field Inspections Built for Solar, Wind & Energy Storage"
- Font: 48px desktop / 32px mobile, Bold
- Color: #0A2540 (Deep Ocean Blue)
- Max width: 600px
- Line height: 1.1

**Subheadline:**
- Text: "PrimoInspect streamlines field operations with offline-capable mobile inspections, real-time analytics, and automated reporting—purpose-built for utility-scale renewable energy projects."
- Font: 18px desktop / 16px mobile, Regular
- Color: #6B7280 (Medium Gray)
- Max width: 540px
- Line height: 1.6

**Primary CTA:**
- Text: "Request a Demo"
- Style: Solid button, #10B981 background, white text
- Size: 16px text, 14px vertical padding, 32px horizontal padding
- Border radius: 6px
- Hover: Darken 10%, subtle lift shadow
- Icon: Arrow right (→) on hover

**Secondary CTA:**
- Text: "Watch 2-Min Overview"
- Style: Text link with play icon
- Color: #0A2540, underline on hover
- Icon: Play circle outline

**Hero Visual:**
- Type: High-quality photo or short looping video (15-20 seconds)
- Content: Field inspector using tablet at solar farm or wind turbine site
- Dimensions: 16:9 aspect ratio, 1200x675px minimum
- Treatment: Subtle overlay gradient if text overlays needed
- Mobile: Full-width, positioned below text
- Desktop: Right side, 50% width

**Trust Indicators:**
- Layout: Horizontal row, 4 items
- Content:
  - "8.1 GW+ Installed Capacity"
  - "40% Faster Inspections"
  - "95%+ Data Accuracy"
  - "SOC 2 Type II Certified"
- Style: Small text (14px), icon + number + label
- Icons: Minimal outline style
- Mobile: 2x2 grid or horizontal scroll



### 3.3 Problem Statement Section

**Purpose:** Establish pain points that resonate with target audience

**Layout:**
```
┌─────────────────────────────────────┐
│   [Section Eyebrow Text]           │
│   [Section Headline]               │
│                                     │
│   ┌─────────┐  ┌─────────┐        │
│   │ Pain 1  │  │ Pain 2  │        │
│   │ [Icon]  │  │ [Icon]  │        │
│   │ [Text]  │  │ [Text]  │        │
│   └─────────┘  └─────────┘        │
│                                     │
│   ┌─────────┐  ┌─────────┐        │
│   │ Pain 3  │  │ Pain 4  │        │
│   └─────────┘  └─────────┘        │
└─────────────────────────────────────┘
```

**Content:**

**Eyebrow:** "The Challenge"
- Font: 14px, uppercase, semibold, letter-spacing: 0.05em
- Color: #10B981 (Renewable Green)

**Headline:** "Paper-Based Inspections Can't Keep Up with Modern Renewable Energy Projects"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540

**Pain Points (4 cards):**

1. **Manual Data Entry Delays**
   - Icon: Clock with alert
   - Text: "Field teams spend 3-4 hours daily on paperwork instead of inspections"
   
2. **Data Accuracy Issues**
   - Icon: Document with error mark
   - Text: "Transcription errors and lost forms compromise project quality"
   
3. **Limited Visibility**
   - Icon: Eye with slash
   - Text: "Critical issues take hours or days to reach management"
   
4. **Client Expectations**
   - Icon: Users with question mark
   - Text: "Clients demand real-time transparency that paper can't provide"

**Card Styling:**
- Background: White
- Border: 1px solid #E5E7EB
- Padding: 24px
- Border radius: 8px
- Shadow: Subtle on hover
- Icon: 48px, #F59E0B (Solar Orange)
- Text: 16px, #374151



### 3.4 Solution Overview Section

**Purpose:** Present PrimoInspect as the comprehensive solution

**Layout:**
```
Desktop (Side-by-side):
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Device Mockup]              [Headline]                │
│  [Screenshot/Video]           [Description]             │
│                                                          │
│                               [Feature List]            │
│                               • Item 1                  │
│                               • Item 2                  │
│                               • Item 3                  │
│                                                          │
│                               [CTA Button]              │
└──────────────────────────────────────────────────────────┘
```

**Content:**

**Headline:** "One Platform. Complete Visibility. Proven Results."
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540

**Description:**
"PrimoInspect combines mobile-first data collection, intelligent workflow automation, and real-time analytics in a single platform designed specifically for renewable energy field operations."
- Font: 18px, Regular
- Color: #6B7280
- Max width: 480px

**Key Features (Checkmark list):**
- ✓ Offline-capable mobile inspections for remote sites
- ✓ Automated report generation in under 60 seconds
- ✓ Real-time dashboards for project managers and clients
- ✓ AI-powered issue detection and predictive maintenance
- ✓ Seamless integration with existing project management tools
- ✓ SOC 2 Type II certified security and compliance

**Visual Element:**
- Type: Mobile device mockup showing app interface
- Content: Inspection form with photo capture
- Style: Floating with subtle shadow, slight 3D perspective
- Animation: Subtle parallax scroll effect on desktop

**CTA:**
- Text: "See How It Works"
- Style: Outline button, #10B981 border and text
- Size: Medium (14px text, 12px padding)



### 3.5 Features Showcase Section

**Purpose:** Deep dive into core capabilities with visual demonstrations

**Layout Pattern (Alternating):**
```
Feature 1 (Image Left):
┌──────────────────────────────────────────────────────────┐
│  [Image/Demo]         [Feature Name]                     │
│                       [Description]                      │
│                       [Benefit Points]                   │
└──────────────────────────────────────────────────────────┘

Feature 2 (Image Right):
┌──────────────────────────────────────────────────────────┐
│  [Feature Name]       [Image/Demo]                       │
│  [Description]                                           │
│  [Benefit Points]                                        │
└──────────────────────────────────────────────────────────┘
```

**Features to Showcase (6 total):**

**1. Mobile Data Collection**
- **Headline:** "Capture Everything, Everywhere—Even Offline"
- **Description:** "Field teams work seamlessly without connectivity. Rich media capture, GPS tracking, and voice-to-text ensure complete, accurate data collection at remote renewable energy sites."
- **Benefits:**
  - 7-day offline operation capacity
  - Automatic sync when connectivity restored
  - Photo/video annotation tools
  - Barcode/QR scanning for asset tracking
- **Visual:** Mobile app screenshot showing inspection form with photo capture
- **Icon:** Mobile device with checkmark

**2. Workflow Automation**
- **Headline:** "Intelligent Workflows That Adapt to Your Process"
- **Description:** "Automated task assignment, multi-level approvals, and real-time notifications keep projects moving. Digital signatures and audit trails ensure compliance."
- **Benefits:**
  - Configurable approval chains
  - Automated task routing
  - Real-time status updates
  - Complete audit trails
- **Visual:** Workflow diagram or dashboard showing task progression
- **Icon:** Connected nodes/flowchart

**3. Real-Time Analytics**
- **Headline:** "Insights That Drive Better Decisions"
- **Description:** "Live dashboards provide instant visibility into project health, quality metrics, and team performance. Predictive analytics identify issues before they become problems."
- **Benefits:**
  - Customizable KPI dashboards
  - Trend analysis and forecasting
  - Performance benchmarking
  - Exportable reports in multiple formats
- **Visual:** Dashboard screenshot with charts and metrics
- **Icon:** Bar chart with upward trend

**4. Renewable Energy Specialization**
- **Headline:** "Purpose-Built for Solar, Wind & Energy Storage"
- **Description:** "Industry-specific templates, asset hierarchies, and inspection protocols designed for utility-scale renewable energy projects. Not a generic form builder."
- **Benefits:**
  - Pre-built templates for solar PV, wind turbines, battery systems
  - Equipment-specific checklists
  - Performance correlation with energy production
  - Regulatory compliance templates (NERC, FERC, OSHA)
- **Visual:** Template library or asset hierarchy visualization
- **Icon:** Solar panel and wind turbine

**5. Automated Reporting**
- **Headline:** "Professional Reports in Seconds, Not Hours"
- **Description:** "One-click report generation with customizable templates. Automated delivery to stakeholders ensures transparency and builds client confidence."
- **Benefits:**
  - Sub-60-second report generation
  - Branded, professional layouts
  - Scheduled automatic delivery
  - Multiple export formats (PDF, Excel, Word)
- **Visual:** Report preview with before/after timeline
- **Icon:** Document with sparkles

**6. Enterprise Integration**
- **Headline:** "Works With Your Existing Tools"
- **Description:** "Seamless integration with project management, ERP, and communication platforms. API-first architecture ensures data flows where you need it."
- **Benefits:**
  - Procore, PlanGrid, Autodesk integrations
  - SAP, Oracle ERP connectivity
  - Slack, Teams notifications
  - RESTful API for custom integrations
- **Visual:** Integration diagram showing connected platforms
- **Icon:** Puzzle pieces connecting

**Styling for Each Feature:**
- Container: Max-width 1200px, centered
- Spacing: 96px vertical between features
- Image: 50% width desktop, full-width mobile
- Text: 50% width desktop, full-width mobile
- Padding: 48px vertical, 24px horizontal (mobile)
- Background: Alternating white and #F9FAFB



### 3.6 Industry Specialization Section

**Purpose:** Emphasize renewable energy expertise and differentiation

**Layout:**
```
┌─────────────────────────────────────┐
│   [Section Headline]               │
│   [Description]                    │
│                                     │
│   ┌──────┐ ┌──────┐ ┌──────┐      │
│   │Solar │ │ Wind │ │Energy│      │
│   │  PV  │ │Turbine│Storage│      │
│   └──────┘ └──────┘ └──────┘      │
│                                     │
│   [Detailed Capabilities Grid]     │
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Built for the Unique Demands of Renewable Energy"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540

**Description:**
"Generic inspection tools weren't designed for utility-scale renewable projects. PrimoInspect understands solar arrays, wind turbines, and battery systems—with specialized templates, asset hierarchies, and compliance frameworks."

**Asset Type Cards (3 primary):**

**1. Solar PV Systems**
- Icon: Solar panel illustration
- Inspection Types:
  - Module condition assessment
  - Inverter performance checks
  - Electrical connection testing
  - Mounting system integrity
  - Thermal imaging analysis
- Template Count: "12+ specialized templates"

**2. Wind Energy**
- Icon: Wind turbine illustration
- Inspection Types:
  - Blade condition surveys
  - Gearbox diagnostics
  - Generator system checks
  - Tower structural assessment
  - Foundation integrity
- Template Count: "8+ specialized templates"

**3. Energy Storage**
- Icon: Battery illustration
- Inspection Types:
  - Battery health monitoring
  - Thermal management systems
  - Safety system verification
  - Power electronics testing
  - Fire suppression checks
- Template Count: "6+ specialized templates"

**Card Styling:**
- Size: Equal width, 3 columns desktop / 1 column mobile
- Background: White with gradient border (green to orange)
- Padding: 32px
- Icon: 64px, centered at top
- Hover: Subtle lift and shadow

**Supporting Details Grid:**
- 2x3 grid of capability badges
- Items:
  - "GPS Asset Mapping"
  - "Weather Integration"
  - "Performance Correlation"
  - "Predictive Maintenance"
  - "Regulatory Compliance"
  - "Warranty Documentation"
- Style: Small pills with icons, #F9FAFB background



### 3.7 ROI & Metrics Section

**Purpose:** Quantify business value with compelling statistics

**Layout:**
```
┌─────────────────────────────────────┐
│   [Headline]                       │
│   [Subheadline]                    │
│                                     │
│   ┌────────┐ ┌────────┐ ┌────────┐│
│   │  40%   │ │  95%   │ │  60%   ││
│   │Faster  │ │Accuracy│ │Less    ││
│   │Inspect.│ │        │ │Admin   ││
│   └────────┘ └────────┘ └────────┘│
│                                     │
│   ┌────────┐ ┌────────┐ ┌────────┐│
│   │ 312%   │ │18 Mo.  │ │$500K   ││
│   │  ROI   │ │Payback │ │Yr 1    ││
│   └────────┘ └────────┘ └────────┘│
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Measurable Impact from Day One"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540

**Subheadline:**
"Real results from renewable energy contractors who've made the switch to digital inspections."
- Font: 18px, Regular
- Color: #6B7280

**Metric Cards (6 total):**

**Primary Metrics (Top Row):**

1. **40% Reduction**
   - Label: "Inspection Completion Time"
   - Description: "Field teams complete inspections faster with streamlined workflows"
   - Icon: Stopwatch
   - Color accent: #10B981

2. **95%+ Accuracy**
   - Label: "Data Quality Rate"
   - Description: "Structured forms eliminate transcription errors and missing data"
   - Icon: Target with checkmark
   - Color accent: #10B981

3. **60% Reduction**
   - Label: "Administrative Overhead"
   - Description: "Automated reporting frees teams to focus on high-value work"
   - Icon: Document stack decreasing
   - Color accent: #10B981

**Financial Metrics (Bottom Row):**

4. **312% ROI**
   - Label: "3-Year Return on Investment"
   - Description: "Efficiency gains and new business opportunities drive strong returns"
   - Icon: Growth chart
   - Color accent: #F59E0B

5. **18 Months**
   - Label: "Payback Period"
   - Description: "Rapid value realization through immediate efficiency improvements"
   - Icon: Calendar with checkmark
   - Color accent: #F59E0B

6. **$500K+**
   - Label: "Year 1 Benefits"
   - Description: "Labor savings, reduced rework, and improved client retention"
   - Icon: Dollar sign with upward arrow
   - Color accent: #F59E0B

**Card Styling:**
- Background: White
- Border: 1px solid #E5E7EB
- Padding: 32px
- Border radius: 8px
- Number: 48px, Bold, colored by accent
- Label: 16px, Semibold, #111827
- Description: 14px, Regular, #6B7280
- Icon: 32px, positioned top-right
- Hover: Subtle shadow and lift

**Section Background:**
- Light gradient from #F9FAFB to white
- Padding: 96px vertical



### 3.8 Social Proof & Testimonials Section

**Purpose:** Build credibility through customer success stories

**Layout:**
```
┌─────────────────────────────────────┐
│   [Section Headline]               │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ "Quote from customer..."    │  │
│   │                             │  │
│   │ [Name, Title]               │  │
│   │ [Company Logo]              │  │
│   └─────────────────────────────┘  │
│                                     │
│   [Company Logos Row]              │
│   [Logo] [Logo] [Logo] [Logo]     │
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Trusted by Leading Renewable Energy Contractors"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540
- Alignment: Center

**Featured Testimonial (Rotating carousel, 3 testimonials):**

**Testimonial 1:**
- Quote: "PrimoInspect transformed our field operations. What used to take 4 hours now takes 90 minutes, and our clients love the real-time visibility. It's been a game-changer for our solar division."
- Name: "Sarah Mitchell"
- Title: "VP of Operations"
- Company: "Primoris Renewable Energy"
- Photo: Professional headshot (circular, 80px)
- Company Logo: Positioned below quote

**Testimonial 2:**
- Quote: "The offline capability is crucial for our remote wind sites. Our teams can work all day without connectivity and everything syncs perfectly when they're back in range. Data accuracy has improved dramatically."
- Name: "James Rodriguez"
- Title: "Project Manager"
- Company: "Renewable Energy Contractor"
- Photo: Professional headshot
- Company Logo: Positioned below quote

**Testimonial 3:**
- Quote: "We've reduced report generation time from 2 days to 2 minutes. Our clients receive professional, detailed reports immediately after inspections. It's elevated our entire service offering."
- Name: "Emily Chen"
- Title: "Quality Director"
- Company: "Solar Installation Company"
- Photo: Professional headshot
- Company Logo: Positioned below quote

**Testimonial Card Styling:**
- Background: White
- Border: None
- Padding: 48px
- Max-width: 800px, centered
- Quote: 24px, Regular, #111827, italic
- Quote marks: Large decorative quotes in #10B981
- Name: 18px, Semibold, #111827
- Title/Company: 16px, Regular, #6B7280
- Shadow: Soft, elevated appearance

**Carousel Controls:**
- Dots: Bottom center, 12px circles
- Auto-rotate: 8 seconds per testimonial
- Swipe: Touch-enabled on mobile
- Fade transition: 300ms

**Client Logos Section:**
- Headline: "Powering Inspections For"
- Layout: Horizontal row, 5-6 logos
- Logo treatment: Grayscale, opacity 60%
- Hover: Full color, opacity 100%
- Mobile: Horizontal scroll or 2x3 grid
- Logos: 120px width, auto height, centered
- Spacing: 48px between logos

**Example Logo Placeholders:**
- Primoris Services Corporation
- Major Solar Developer
- Wind Energy Company
- Energy Storage Provider
- Utility Company
- EPC Contractor



### 3.9 Use Cases / Personas Section

**Purpose:** Show how different roles benefit from the platform

**Layout:**
```
┌─────────────────────────────────────┐
│   [Section Headline]               │
│                                     │
│   [Tab Navigation]                 │
│   [Inspector] [Manager] [Executive]│
│                                     │
│   ┌─────────────────────────────┐  │
│   │ [Persona Content]           │  │
│   │ [Image] [Description]       │  │
│   │ [Key Benefits List]         │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Built for Every Role in Your Organization"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540
- Alignment: Center

**Tab Navigation:**
- 3 tabs: Field Inspector | Project Manager | Executive
- Active state: #10B981 underline, bold text
- Inactive state: #6B7280 text
- Mobile: Full-width stacked buttons

**Persona 1: Field Inspector**

**Visual:** Photo of inspector with tablet at solar site
**Headline:** "Empower Your Field Teams"
**Description:**
"Give inspectors the tools they need to work efficiently in challenging environments. Intuitive mobile interface, offline capability, and quick data entry mean more time on inspections, less time on paperwork."

**Key Benefits:**
- ✓ Work offline for 7+ days at remote sites
- ✓ Capture photos, videos, and voice notes instantly
- ✓ Auto-populate data with barcode scanning
- ✓ GPS and timestamp tracking automatic
- ✓ Submit inspections with one tap
- ✓ Access inspection history on-device

**CTA:** "See the Mobile App"

**Persona 2: Project Manager**

**Visual:** Dashboard screenshot or manager reviewing tablet
**Headline:** "Complete Project Visibility"
**Description:**
"Monitor project health in real-time, identify issues before they escalate, and keep stakeholders informed. Automated workflows and intelligent routing ensure nothing falls through the cracks."

**Key Benefits:**
- ✓ Real-time dashboards with live KPIs
- ✓ Automated task assignment and tracking
- ✓ Instant notifications for critical issues
- ✓ One-click report generation
- ✓ Team performance analytics
- ✓ Client portal for transparency

**CTA:** "Explore the Dashboard"

**Persona 3: Executive**

**Visual:** Executive viewing analytics on laptop
**Headline:** "Strategic Insights at Your Fingertips"
**Description:**
"Make data-driven decisions with comprehensive analytics and trend analysis. Track performance across projects, identify opportunities for improvement, and demonstrate value to clients and stakeholders."

**Key Benefits:**
- ✓ Cross-project performance metrics
- ✓ Predictive analytics and forecasting
- ✓ Compliance and quality tracking
- ✓ ROI and efficiency reporting
- ✓ Client satisfaction metrics
- ✓ Competitive benchmarking

**CTA:** "View Analytics Demo"

**Styling:**
- Content area: Max-width 1000px, centered
- Image: 40% width desktop, full-width mobile
- Text: 60% width desktop, full-width mobile
- Padding: 64px vertical
- Background: White
- Transition: Smooth fade between tabs (300ms)



### 3.10 Security & Compliance Section

**Purpose:** Address enterprise security concerns and build trust

**Layout:**
```
┌─────────────────────────────────────┐
│   [Headline]                       │
│   [Description]                    │
│                                     │
│   ┌──────┐ ┌──────┐ ┌──────┐      │
│   │Badge │ │Badge │ │Badge │      │
│   └──────┘ └──────┘ └──────┘      │
│                                     │
│   [Security Features Grid]         │
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Enterprise-Grade Security & Compliance"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540

**Description:**
"Your data security is our top priority. PrimoInspect meets the highest industry standards for data protection, privacy, and compliance."
- Font: 18px, Regular
- Color: #6B7280

**Certification Badges (3 prominent):**

1. **SOC 2 Type II**
   - Badge: Official SOC 2 seal
   - Description: "Independently audited security controls"

2. **GDPR Compliant**
   - Badge: GDPR shield icon
   - Description: "European data protection standards"

3. **ISO 27001**
   - Badge: ISO certification mark
   - Description: "Information security management"

**Security Features Grid (2x3 on desktop, 1 column mobile):**

1. **End-to-End Encryption**
   - Icon: Lock with shield
   - Text: "AES-256 encryption for data at rest, TLS 1.3 for data in transit"

2. **Multi-Factor Authentication**
   - Icon: Key with checkmark
   - Text: "MFA and SSO integration for secure access control"

3. **Role-Based Permissions**
   - Icon: User with settings
   - Text: "Granular access controls based on user roles and responsibilities"

4. **Audit Trails**
   - Icon: Document with timeline
   - Text: "Complete audit logs for all user actions and data changes"

5. **Data Residency**
   - Icon: Globe with pin
   - Text: "Configurable data storage locations to meet regional requirements"

6. **Regular Backups**
   - Icon: Cloud with arrows
   - Text: "Automated daily backups with point-in-time recovery"

**Feature Card Styling:**
- Background: #F9FAFB
- Border: 1px solid #E5E7EB
- Padding: 24px
- Border radius: 8px
- Icon: 40px, #10B981
- Text: 14px, #374151

**Section Background:**
- Background: White
- Padding: 96px vertical
- Border top: 1px solid #E5E7EB



### 3.11 Pricing Section (Optional)

**Purpose:** Provide transparent pricing information or lead to pricing page

**Layout:**
```
┌─────────────────────────────────────┐
│   [Headline]                       │
│   [Description]                    │
│                                     │
│   ┌────────┐ ┌────────┐ ┌────────┐│
│   │Starter │ │  Pro   │ │Enterprise│
│   │        │ │        │ │        ││
│   │[Price] │ │[Price] │ │[Custom]││
│   │        │ │        │ │        ││
│   │[CTA]   │ │[CTA]   │ │[CTA]   ││
│   └────────┘ └────────┘ └────────┘│
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Flexible Plans for Teams of All Sizes"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540

**Description:**
"Start with a free trial, scale as you grow. All plans include core features with no hidden fees."
- Font: 18px, Regular
- Color: #6B7280

**Pricing Tiers (3 options):**

**Tier 1: Starter**
- Price: "$49/user/month"
- Billing: "Billed annually"
- Description: "Perfect for small teams getting started"
- Features:
  - Up to 10 users
  - Unlimited inspections
  - Mobile app access
  - Basic reporting
  - Email support
  - 5GB storage
- CTA: "Start Free Trial"
- Style: Standard card

**Tier 2: Professional** (Most Popular)
- Price: "$89/user/month"
- Billing: "Billed annually"
- Description: "For growing teams with advanced needs"
- Features:
  - Up to 50 users
  - Everything in Starter, plus:
  - Advanced analytics
  - Custom templates
  - API access
  - Priority support
  - 50GB storage
  - Workflow automation
- CTA: "Start Free Trial"
- Style: Highlighted card with "Most Popular" badge
- Badge: #10B981 background, white text

**Tier 3: Enterprise**
- Price: "Custom Pricing"
- Billing: "Contact sales"
- Description: "For large organizations with complex requirements"
- Features:
  - Unlimited users
  - Everything in Professional, plus:
  - Dedicated account manager
  - Custom integrations
  - SLA guarantees
  - Advanced security
  - Unlimited storage
  - White-label options
- CTA: "Contact Sales"
- Style: Standard card

**Card Styling:**
- Width: Equal thirds on desktop, full-width stacked on mobile
- Background: White
- Border: 2px solid #E5E7EB (Professional: #10B981)
- Padding: 40px
- Border radius: 12px
- Price: 48px, Bold, #0A2540
- Features: 14px, Regular, checkmark icons
- CTA: Full-width button
- Hover: Subtle lift and shadow

**Additional Elements:**
- "All plans include 14-day free trial" banner
- "No credit card required" subtext
- "Cancel anytime" guarantee
- Link to detailed pricing comparison page

**Alternative Approach (If not showing pricing):**
- Headline: "Pricing That Scales With Your Business"
- Description: "Flexible plans designed for renewable energy contractors of all sizes. Get a custom quote based on your specific needs."
- Single CTA: "Get Custom Pricing"
- Supporting text: "Typical ROI: 312% over 3 years | Payback period: 18 months"



### 3.12 FAQ Section

**Purpose:** Address common objections and questions preemptively

**Layout:**
```
┌─────────────────────────────────────┐
│   [Headline]                       │
│                                     │
│   ┌─────────────────────────────┐  │
│   │ Question 1              [+] │  │
│   └─────────────────────────────┘  │
│   ┌─────────────────────────────┐  │
│   │ Question 2              [+] │  │
│   └─────────────────────────────┘  │
│   ┌─────────────────────────────┐  │
│   │ Question 3              [-] │  │
│   │ [Expanded Answer]           │  │
│   └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Frequently Asked Questions"
- Font: 36px desktop / 28px mobile, Semibold
- Color: #0A2540
- Alignment: Center

**Questions & Answers (8-10 total):**

**Q1: How long does implementation take?**
A: Most teams are up and running within 2-4 weeks. Our implementation includes data migration, custom template setup, team training, and ongoing support. Larger enterprises with complex integrations typically complete implementation in 6-8 weeks.

**Q2: Does PrimoInspect work offline?**
A: Yes! Offline capability is a core feature. Field teams can work for 7+ days without connectivity, capturing all inspection data, photos, and videos locally. Everything automatically syncs when connection is restored, with intelligent conflict resolution.

**Q3: Can we customize inspection templates?**
A: Absolutely. You can create unlimited custom templates using our drag-and-drop builder, or start with our pre-built renewable energy templates and modify them. No coding required. We also offer professional services for complex template design.

**Q4: How does PrimoInspect integrate with our existing tools?**
A: We offer native integrations with major project management platforms (Procore, PlanGrid, Autodesk), ERP systems (SAP, Oracle), and communication tools (Slack, Teams). Our RESTful API enables custom integrations with any system.

**Q5: What kind of training and support do you provide?**
A: Every plan includes comprehensive onboarding with role-based training modules, video tutorials, and documentation. Professional and Enterprise plans include dedicated support with guaranteed response times. We also offer on-site training for large deployments.

**Q6: Is our data secure and compliant?**
A: Yes. PrimoInspect is SOC 2 Type II certified with AES-256 encryption, multi-factor authentication, and complete audit trails. We're GDPR and CCPA compliant, with configurable data residency options to meet regional requirements.

**Q7: Can we try PrimoInspect before committing?**
A: Yes! We offer a 14-day free trial with full access to all features. No credit card required. We'll also provide a personalized demo and help you set up a pilot project to evaluate the platform with your team.

**Q8: What happens to our data if we decide to leave?**
A: You own your data, always. We provide complete data export in standard formats (CSV, JSON, PDF) at any time. There are no lock-in contracts or data retention fees. We'll work with you to ensure a smooth transition.

**Q9: How does pricing work for seasonal teams?**
A: We offer flexible licensing that accommodates seasonal workforce fluctuations common in renewable energy. You can scale users up or down monthly, and we offer special pricing for contractors with significant seasonal variation.

**Q10: Can PrimoInspect handle multiple projects simultaneously?**
A: Yes. The platform is designed for multi-project management. You can organize inspections by project, client, location, or asset type. Dashboards provide both project-specific and cross-project analytics.

**Accordion Styling:**
- Container: Max-width 800px, centered
- Item spacing: 16px between items
- Background: White
- Border: 1px solid #E5E7EB
- Padding: 24px
- Border radius: 8px
- Question: 18px, Semibold, #111827
- Answer: 16px, Regular, #374151, line-height 1.6
- Icon: Plus/minus, 24px, #10B981
- Transition: Smooth expand/collapse (300ms)
- Hover: Subtle background color change

**Additional Element:**
- "Still have questions?" section at bottom
- Text: "Our team is here to help"
- CTA: "Contact Support" or "Schedule a Call"
- Style: Centered, simple link



### 3.13 Final CTA Section

**Purpose:** Strong conversion-focused section before footer

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│         [Headline]                 │
│         [Subheadline]              │
│                                     │
│    [Primary CTA]  [Secondary CTA]  │
│                                     │
│    [Trust Indicators]              │
│                                     │
└─────────────────────────────────────┘
```

**Content:**

**Headline:** "Ready to Transform Your Inspections?"
- Font: 48px desktop / 32px mobile, Bold
- Color: White
- Alignment: Center

**Subheadline:**
"Join leading renewable energy contractors who've modernized their field operations with PrimoInspect. Start your free trial today—no credit card required."
- Font: 20px desktop / 18px mobile, Regular
- Color: White with 90% opacity
- Max-width: 600px, centered

**Primary CTA:**
- Text: "Start Free 14-Day Trial"
- Style: Large solid button, white background, #0A2540 text
- Size: 18px text, 16px vertical padding, 40px horizontal padding
- Border radius: 8px
- Hover: Subtle shadow and lift
- Icon: Arrow right

**Secondary CTA:**
- Text: "Schedule a Demo"
- Style: Outline button, white border and text
- Size: 18px text, 16px vertical padding, 40px horizontal padding
- Border radius: 8px
- Hover: White background, #0A2540 text

**Trust Indicators (Below CTAs):**
- "✓ 14-day free trial"
- "✓ No credit card required"
- "✓ Setup in minutes"
- Layout: Horizontal row, small text (14px)
- Color: White with 80% opacity
- Icons: Checkmarks in #10B981

**Section Styling:**
- Background: Gradient from #0A2540 to #10B981 (diagonal)
- Alternative: Solid #0A2540 with subtle pattern overlay
- Padding: 128px vertical (desktop), 80px vertical (mobile)
- Text alignment: Center
- Max-width: 800px content area, centered

**Optional Background Element:**
- Subtle geometric pattern or renewable energy imagery
- Low opacity (10-15%) to not distract from content
- Could include solar panel grid pattern or wind turbine silhouettes



### 3.14 Footer

**Purpose:** Navigation, legal links, and company information

**Layout:**
```
Desktop:
┌──────────────────────────────────────────────────────────┐
│ [Logo]                                                   │
│                                                          │
│ [Product]    [Company]    [Resources]    [Legal]       │
│ • Features   • About      • Blog         • Privacy      │
│ • Pricing    • Careers    • Docs         • Terms        │
│ • Demo       • Contact    • Support      • Security     │
│                                                          │
│ [Social Icons]                                          │
│                                                          │
│ © 2025 PrimoInspect. All rights reserved.              │
└──────────────────────────────────────────────────────────┘

Mobile:
┌─────────────────────────────────────┐
│ [Logo]                             │
│                                     │
│ [Accordion Sections]               │
│ ▼ Product                          │
│ ▼ Company                          │
│ ▼ Resources                        │
│ ▼ Legal                            │
│                                     │
│ [Social Icons]                     │
│                                     │
│ © 2025 PrimoInspect               │
└─────────────────────────────────────┘
```

**Content:**

**Logo & Tagline:**
- Logo: 160px width, grayscale or white version
- Tagline: "Digital inspections for renewable energy"
- Font: 14px, Regular, #9CA3AF

**Column 1: Product**
- Features
- Pricing
- Integrations
- Mobile App
- Web Dashboard
- API Documentation
- What's New

**Column 2: Company**
- About Us
- Careers
- Contact Sales
- Partners
- Press Kit
- Brand Guidelines

**Column 3: Resources**
- Blog
- Case Studies
- Documentation
- Help Center
- Video Tutorials
- Webinars
- Community Forum

**Column 4: Legal**
- Privacy Policy
- Terms of Service
- Security
- Compliance
- Cookie Policy
- Accessibility

**Social Media Icons:**
- LinkedIn
- Twitter/X
- YouTube
- GitHub (if applicable)
- Style: 32px, circular, #6B7280
- Hover: #10B981
- Spacing: 16px between icons

**Bottom Bar:**
- Copyright: "© 2025 PrimoInspect. All rights reserved."
- Additional links: "Sitemap | Status Page"
- Font: 14px, Regular, #6B7280

**Footer Styling:**
- Background: #111827 (dark gray, almost black)
- Text color: #9CA3AF (light gray)
- Link hover: #10B981
- Padding: 64px vertical (desktop), 48px vertical (mobile)
- Border top: 1px solid #1F2937

**Mobile Accordion Behavior:**
- Sections collapsed by default
- Tap to expand/collapse
- Smooth animation (300ms)
- Only one section open at a time (optional)

---

## 4. Interactive Elements & Animations

### Scroll Animations

**Fade-In on Scroll:**
- Elements: Section headlines, feature cards, testimonials
- Trigger: When element enters viewport (80% visible)
- Animation: Fade from 0 to 100% opacity, slight upward movement (20px)
- Duration: 600ms
- Easing: Ease-out

**Parallax Effects:**
- Elements: Hero background image, section backgrounds
- Speed: 0.5x scroll speed
- Mobile: Disabled for performance

**Number Counters:**
- Elements: ROI metrics (40%, 95%, 312%, etc.)
- Trigger: When section enters viewport
- Animation: Count from 0 to target number
- Duration: 2000ms
- Easing: Ease-out

### Hover States

**Buttons:**
- Primary: Darken 10%, lift 2px, shadow increase
- Secondary: Background fill, text color invert
- Duration: 200ms
- Easing: Ease-in-out

**Cards:**
- Lift: 4px upward
- Shadow: Increase from subtle to medium
- Border: Color shift to accent color
- Duration: 300ms

**Images:**
- Scale: 105% zoom on hover
- Overlay: Slight darkening or color overlay
- Duration: 400ms

### Loading States

**Page Load:**
- Hero section: Fade in immediately
- Subsequent sections: Lazy load as user scrolls
- Images: Progressive loading with blur-up effect
- Videos: Poster image with play button overlay

**Form Submissions:**
- Button: Loading spinner replaces text
- Disable: Prevent multiple submissions
- Success: Checkmark animation
- Error: Shake animation with error message

### Mobile Interactions

**Touch Gestures:**
- Carousel: Swipe left/right
- Accordion: Tap to expand/collapse
- Menu: Slide in from right
- Smooth scrolling: Enabled for anchor links

**Pull-to-Refresh:**
- Not implemented (static landing page)

**Haptic Feedback:**
- Button taps: Light haptic (iOS)
- Form submission: Medium haptic



---

## 5. Responsive Design Specifications

### Breakpoints

```css
/* Mobile First Approach */
- Mobile: 320px - 767px (base styles)
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Large Desktop: 1440px+
```

### Mobile (320px - 767px)

**Layout:**
- Single column layout
- Full-width sections
- Horizontal padding: 16-24px
- Vertical spacing: 48-64px between sections
- Font sizes: Reduced by 20-30% from desktop

**Navigation:**
- Hamburger menu (top right)
- Full-screen overlay menu
- Logo: 140px width
- Sticky header: 64px height

**Hero:**
- Headline: 32px
- Subheadline: 16px
- CTA buttons: Full-width stacked
- Hero image: Full-width below text
- Trust indicators: 2x2 grid

**Feature Cards:**
- Full-width stacked
- Spacing: 24px between cards
- Images: Full-width above text

**Testimonials:**
- Single column
- Swipe carousel
- Full-width cards

**Footer:**
- Accordion sections
- Social icons: Centered row
- Copyright: Centered

### Tablet (768px - 1023px)

**Layout:**
- 2-column grid for cards
- Max-width: 720px centered
- Horizontal padding: 32px
- Vertical spacing: 64-80px

**Navigation:**
- Full navigation visible
- Condensed spacing
- Logo: 160px width

**Hero:**
- Headline: 40px
- Side-by-side layout begins
- CTA buttons: Inline

**Feature Cards:**
- 2-column grid
- Alternating image/text layout

**Footer:**
- 2-column layout
- Expanded sections

### Desktop (1024px+)

**Layout:**
- Multi-column grids (3-4 columns)
- Max-width: 1280px centered
- Horizontal padding: 48-64px
- Vertical spacing: 96-128px

**Navigation:**
- Full navigation with spacing
- Logo: 180px width
- Sticky header: 72px height

**Hero:**
- Headline: 48px
- 50/50 split layout
- CTA buttons: Inline with spacing

**Feature Cards:**
- 3-column grid
- Alternating full-width sections

**Footer:**
- 4-column layout
- All sections expanded

### Large Desktop (1440px+)

**Layout:**
- Same as desktop but more generous spacing
- Max-width: 1440px
- Larger font sizes (optional)
- More white space

---

## 6. Performance Optimization

### Image Optimization

**Formats:**
- WebP with JPEG fallback
- SVG for icons and logos
- Progressive JPEG for photos

**Responsive Images:**
```html
<picture>
  <source srcset="hero-mobile.webp" media="(max-width: 767px)">
  <source srcset="hero-tablet.webp" media="(max-width: 1023px)">
  <source srcset="hero-desktop.webp" media="(min-width: 1024px)">
  <img src="hero-desktop.jpg" alt="Description">
</picture>
```

**Lazy Loading:**
- All images below fold: `loading="lazy"`
- Hero image: Eager loading
- Blur-up placeholder technique

**Sizing:**
- Hero images: Max 200KB
- Feature images: Max 100KB
- Icons: Max 10KB
- Thumbnails: Max 30KB

### Code Optimization

**Next.js Features:**
- Static Site Generation (SSG) for landing page
- Image optimization with next/image
- Font optimization with next/font
- Code splitting and tree shaking

**CSS:**
- Tailwind CSS with purge enabled
- Critical CSS inlined
- Non-critical CSS deferred

**JavaScript:**
- Minimal client-side JS
- Defer non-critical scripts
- Use Intersection Observer for scroll animations

### Performance Targets

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Additional Metrics:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total Page Size: < 2MB
- Number of Requests: < 50

### Caching Strategy

**Static Assets:**
- Images: Cache for 1 year
- CSS/JS: Cache for 1 year with hash
- Fonts: Cache for 1 year

**HTML:**
- Cache for 1 hour
- Revalidate on server

**CDN:**
- Use Vercel Edge Network or Cloudflare
- Global distribution
- Automatic compression (Brotli/Gzip)

