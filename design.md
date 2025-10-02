# C-Arm + CBCT Medical Imaging Software - Design Style Guide

## Design Philosophy

### Core Principles
- **Clinical Precision**: Every interface element serves a medical purpose
- **Apple-Inspired Minimalism**: Clean, uncluttered interfaces that reduce cognitive load
- **Dark Theme Optimization**: Designed for extended use in dimly lit medical environments
- **Safety-First Design**: Critical functions are prominently displayed and easily accessible
- **Touch-Friendly Interface**: Large, easily tappable targets for sterile environment use

### Visual Language
- **Medical Professional Aesthetic**: Serious, trustworthy, and technologically advanced
- **High Contrast**: Ensures readability in various lighting conditions
- **Subtle Animations**: Smooth transitions that provide feedback without distraction
- **Consistent Iconography**: Medical-standard symbols and intuitive visual cues

## Color Palette

### Primary Colors (Dark Theme)
- **Background Primary**: `#1a1a1a` (Deep charcoal for main background)
- **Background Secondary**: `#2d2d2d` (Slightly lighter for cards and panels)
- **Background Tertiary**: `#3a3a3a` (For input fields and subtle divisions)

### Accent Colors
- **Primary Blue**: `#007AFF` (Apple's system blue for primary actions)
- **Success Green**: `#34C759` (For positive feedback and completion states)
- **Warning Orange**: `#FF9500` (For cautions and important notifications)
- **Critical Red**: `#FF3B30` (For errors, emergencies, and critical actions)
- **Info Cyan**: `#5AC8FA` (For informational displays and secondary actions)

### Text Colors
- **Primary Text**: `#FFFFFF` (Pure white for maximum contrast)
- **Secondary Text**: `#8E8E93` (Gray for less important information)
- **Tertiary Text**: `#6D6D70` (Darker gray for labels and metadata)
- **Disabled Text**: `#48484A` (For inactive elements)

### Medical Imaging Specific
- **Dose Indicator**: `#FFD60A` (Yellow for radiation dose displays)
- **Live Indicator**: `#32D74B` (Bright green for live imaging status)
- **Standby Indicator**: `#FF9F0A` (Orange for standby/ready states)

## Typography

### Font Stack
- **Primary Font**: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif`
- **Monospace Font**: `'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace`

### Typography Scale
- **Hero Title**: 48px / 52px line-height / -0.5px letter-spacing
- **Page Title**: 34px / 41px line-height / -0.4px letter-spacing
- **Section Title**: 28px / 34px line-height / -0.3px letter-spacing
- **Headline**: 20px / 25px line-height / -0.2px letter-spacing
- **Body Large**: 17px / 22px line-height / -0.1px letter-spacing
- **Body**: 15px / 20px line-height / 0px letter-spacing
- **Caption**: 13px / 18px line-height / 0.1px letter-spacing
- **Small**: 11px / 13px line-height / 0.2px letter-spacing

### Font Weights
- **Light**: 300 (For large displays and subtle text)
- **Regular**: 400 (Default body text)
- **Medium**: 500 (Emphasized text and labels)
- **Semibold**: 600 (Headings and important information)
- **Bold**: 700 (Critical alerts and strong emphasis)

## Visual Effects & Animations

### Core Libraries Integration
- **Anime.js**: Smooth micro-interactions and state transitions
- **ECharts.js**: Medical data visualization with custom dark theme
- **Matter.js**: Physics-based animations for collision detection visualization
- **p5.js**: Custom medical imaging visualizations and interactive elements
- **Pixi.js**: High-performance image rendering and processing
- **Splitting.js**: Text animation effects for headings
- **Typed.js**: Dynamic text displays for real-time data
- **Splide**: Image carousel for study navigation

### Animation Principles
- **Subtle Motion**: Maximum 300ms duration for UI transitions
- **Medical Precision**: No bouncy or playful easing curves
- **Feedback Focused**: Animations provide clear user feedback
- **Performance Optimized**: Smooth 60fps animations even with complex medical data

### Specific Effects
- **Button Hover**: Subtle scale (1.02x) with soft shadow
- **Card Interactions**: Gentle lift effect with increased shadow
- **Loading States**: Professional pulse animations for data loading
- **State Changes**: Smooth color transitions for mode switches
- **Image Transitions**: Fade effects for image swapping and updates

## Layout & Spacing

### Grid System
- **Base Unit**: 8px grid system for consistent spacing
- **Container Max Width**: 1440px for main content areas
- **Sidebar Width**: 320px for navigation and tool palettes
- **Card Padding**: 24px internal padding for content cards
- **Button Padding**: 12px vertical, 24px horizontal

### Component Spacing
- **Section Margins**: 48px between major sections
- **Component Gaps**: 16px between related elements
- **Form Field Spacing**: 20px between form inputs
- **Toolbar Spacing**: 8px between toolbar icons

## Component Design

### Buttons
- **Primary**: Blue background, white text, 44px height
- **Secondary**: Transparent background, blue border and text
- **Danger**: Red background for critical actions
- **Icon Buttons**: 44x44px minimum touch target

### Form Elements
- **Input Fields**: Dark background with subtle border, focus state with blue accent
- **Dropdowns**: Custom styled with smooth animations
- **Checkboxes/Radio**: Custom medical-grade styling
- **Sliders**: For medical parameter adjustment with precise control

### Cards & Panels
- **Elevation**: Subtle shadows for depth hierarchy
- **Borders**: 1px solid borders in tertiary background color
- **Hover States**: Gentle elevation increase for interactive cards
- **Content Padding**: Consistent 24px internal spacing

### Data Visualization
- **Chart Colors**: Muted medical palette with high contrast
- **Grid Lines**: Subtle gray lines for reference
- **Data Points**: Clear, distinguishable markers
- **Tooltips**: Dark background with white text

## Medical Imaging Specific Design

### Live Imaging Display
- **Aspect Ratio**: 16:9 for standard medical displays
- **Border**: 2px solid border in primary blue when active
- **Status Indicators**: Overlaid badges for live/radiation states
- **Tool Overlays**: Semi-transparent panels for image tools

### Dose Display
- **Positioning**: Top-right corner of imaging area
- **Typography**: Monospace font for precise readings
- **Color Coding**: Green (safe), yellow (caution), red (high)
- **Animation**: Gentle pulsing for active radiation

### Control Panels
- **Grouping**: Related controls clustered with subtle dividers
- **Hierarchy**: Primary controls prominently displayed
- **Status Feedback**: Clear visual feedback for all interactions
- **Emergency Controls**: Red coloring and larger touch targets

## Responsive Design

### Breakpoints
- **Desktop Large**: 1440px+ (Primary target for medical workstations)
- **Desktop**: 1024px - 1439px
- **Tablet**: 768px - 1023px (For mobile medical carts)
- **Mobile**: 320px - 767px (For emergency/field use)

### Adaptive Elements
- **Navigation**: Collapsible sidebar on smaller screens
- **Image Display**: Scales proportionally while maintaining aspect ratio
- **Control Panels**: Stack vertically on mobile devices
- **Typography**: Scales appropriately for readability

## Accessibility

### Contrast Ratios
- **Normal Text**: Minimum 4.5:1 contrast ratio
- **Large Text**: Minimum 3:1 contrast ratio
- **Interactive Elements**: Minimum 3:1 contrast ratio

### Focus States
- **Visible Focus**: Clear blue outline for keyboard navigation
- **Focus Order**: Logical tab order through interface
- **Skip Links**: Available for screen reader users

### Medical Safety Considerations
- **Color Independence**: Never rely solely on color for critical information
- **Clear Labeling**: All controls clearly labeled with text
- **Confirmation Dialogs**: For all critical and destructive actions
- **Status Announcements**: Screen reader announcements for state changes