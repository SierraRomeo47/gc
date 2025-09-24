# FuelEU Maritime Compliance Management - Design Guidelines

## Design Approach Selection
**Reference-Based Approach**: Drawing inspiration from ship-watch.com's professional maritime data presentation and comprehensive analytics interface, adapted for compliance management workflows.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Primary: 27 57% 45% (Maritime Blue #1B4F72)
- Secondary: 201 61% 42% (Ocean Blue #2E86AB)
- Background: 210 17% 98% (Light Grey #F8F9FA)

**Functional Colors:**
- Accent/Compliance Red: 332 55% 42% (#A23B72)
- Success: 134 61% 41% (Green #28A745)
- Text: 210 29% 24% (Navy #2C3E50)

### B. Typography
- **Primary Font**: Roboto via Google Fonts CDN
- **Secondary Font**: Open Sans via Google Fonts CDN
- **Font Weights**: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Hierarchy**: Large titles (text-2xl), section headers (text-xl), body text (text-base), captions (text-sm)

### C. Layout System
**Tailwind Spacing Primitives**: Consistent use of units 2, 4, 8, 12, 16, and 20
- Micro spacing: p-2, m-2 (8px)
- Standard spacing: p-4, m-4 (16px) 
- Section spacing: p-8, m-8 (32px)
- Container spacing: p-12, m-12 (48px)
- Large spacing: p-16, m-16 (64px)
- Component spacing: p-20, m-20 (80px)

### D. Component Library

**Navigation:**
- Top navigation bar with maritime-themed logo
- Breadcrumb navigation for compliance workflows
- Side navigation for vessel categories and compliance tools

**Vessel Cards:**
- Grid layout displaying vessel information with ship type icons
- Compliance status indicators using color-coded badges
- Fuel consumption metrics prominently displayed

**Data Tables:**
- Sortable columns for voyage data and compliance metrics
- Expandable rows for detailed compliance information
- Pagination controls for large datasets

**Compliance Meters:**
- Circular progress indicators for compliance percentages
- Linear progress bars for penalty offset calculations
- Traffic light system (red/amber/green) for compliance status

**Forms:**
- Grouped form sections for vessel registration and monitoring plans
- Step-by-step wizard interface for compliance calculations
- Validation messaging with clear error states

**Data Displays:**
- Interactive charts for fuel consumption trends
- Timeline visualization for banking/borrowing activities
- Comparison views for different vessel types

**Overlays:**
- Modal dialogs for detailed vessel information
- Slide-over panels for compliance documentation
- Toast notifications for system updates and alerts

### E. Professional Maritime Aesthetic
- Clean, data-focused interface with generous whitespace
- Maritime-inspired iconography from Heroicons CDN
- Consistent card-based layout for information grouping
- Clear visual hierarchy emphasizing compliance status and critical metrics
- Responsive grid system accommodating various screen sizes
- Professional color scheme reflecting maritime industry standards

## Key Design Principles
1. **Data Clarity**: Prioritize clear presentation of compliance metrics and vessel data
2. **Workflow Efficiency**: Streamlined interfaces for banking, borrowing, and trading operations
3. **Status Visibility**: Immediate visual feedback on compliance status across all vessel types
4. **Professional Trust**: Maritime industry-appropriate aesthetic building user confidence
5. **Regulatory Compliance**: Interface design supporting FuelEU Maritime regulatory requirements