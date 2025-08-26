# Swiftly Dashboard - Developer Documentation

## Overview

The Swiftly Dashboard is a comprehensive post-login interface that provides users with a modern, accessible, and responsive layout for managing their productivity tools. The dashboard is built using Next.js App Router, TypeScript, Tailwind CSS, and Framer Motion.

## Architecture

### File Structure

```
app/dashboard/
├── page.tsx                 # Main dashboard home page
├── tasks/
│   ├── page.tsx            # Tasks overview page
│   ├── my/page.tsx         # Personal tasks subpage
│   └── team/page.tsx       # Team tasks subpage
├── calendar/
│   ├── page.tsx            # Calendar overview page
│   ├── events/page.tsx     # Events subpage
│   └── meetings/page.tsx   # Meetings subpage
├── ai/page.tsx             # AI chat page
├── integrations/page.tsx    # Integrations page
└── billing/page.tsx        # Billing page

components/
├── Layout.tsx              # Main layout wrapper
├── Sidebar.tsx             # Left navigation sidebar
├── Topbar.tsx              # Top navigation bar
├── HomeView.tsx            # Dashboard home content
└── icons.tsx               # Centralized icon exports

types/
└── index.ts                # TypeScript interfaces
```

## Core Components

### Layout Component (`components/Layout.tsx`)

**Purpose**: Persistent layout wrapper used by every authenticated page.

**Responsibilities**:
- Render left sidebar with navigation
- Render main content area
- Include top bar inside main area
- Manage mobile responsiveness
- Handle sidebar collapse/expand functionality
- Provide context for UI shell state

**Props**:
- `children`: React nodes to render in main content area
- `user`: User object with authentication data
- `title`: Page title (optional, defaults to "Dashboard")
- `subtitle`: Page subtitle (optional)

**Features**:
- Responsive sidebar that collapses to 64px on desktop
- Mobile overlay sidebar with backdrop
- Automatic sidebar close on route changes
- Click outside to close mobile sidebar

### Sidebar Component (`components/Sidebar.tsx`)

**Purpose**: Full left navigation with collapsible state and subpage accordions.

**Responsibilities**:
- Display navigation items with Lucide icons
- Manage collapsed/expanded state
- Handle active item highlighting
- Render subpage lists as accordions
- Show profile area at bottom with dropdown

**Features**:
- Default width: 240px expanded, 64px collapsed
- Subpage accordions for Tasks and Calendar
- Profile dropdown with Settings and Logout
- Active state highlighting with blue background
- Smooth animations and transitions
- Keyboard navigation support

**Navigation Items**:
- Home (`/dashboard`)
- Tasks (`/dashboard/tasks`) with subpages:
  - My Tasks (`/dashboard/tasks/my`)
  - Team Tasks (`/dashboard/tasks/team`)
- Calendar (`/dashboard/calendar`) with subpages:
  - Events (`/dashboard/calendar/events`)
  - Meetings (`/dashboard/calendar/meetings`)
- AI Chat (`/dashboard/ai`)
- Integrations (`/dashboard/integrations`)
- Billing (`/dashboard/billing`)

### Topbar Component (`components/Topbar.tsx`)

**Purpose**: Top navigation bar with brand, page title, and profile dropdown.

**Responsibilities**:
- Display brand logo (links to home)
- Show current page title and subtitle
- Include mobile menu toggle button
- Provide profile dropdown on the right

**Features**:
- Fixed height: 64px
- Sticky positioning
- Mobile hamburger menu button
- Profile dropdown with user info and actions
- Click outside and Escape key to close dropdown

### HomeView Component (`components/HomeView.tsx`)

**Purpose**: Dashboard home page content with greeting, quick actions, and AI input.

**Responsibilities**:
- Display personalized greeting based on time of day
- Show four quick action cards
- Provide "Ask Swiftly" input field
- Display placeholder for activity feed

**Features**:
- Dynamic greeting (Good morning/afternoon/evening)
- Responsive grid layout for quick actions
- Interactive cards with hover effects
- Form input with accessibility features
- Smooth animations and transitions

**Quick Actions**:
- Schedule (Calendar icon, blue)
- Reminders (ListChecks icon, green)
- Inbox (MessageSquare icon, purple)
- Notes (FileText icon, orange)

## TypeScript Interfaces

### User Interface
```typescript
interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  roles?: string[]
}
```

### Navigation Item Interface
```typescript
interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  subItems?: NavItem[]
}
```

### Layout Props Interface
```typescript
interface LayoutProps {
  children: React.ReactNode
  user: User
  title?: string
  subtitle?: string
}
```

### Quick Action Interface
```typescript
interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: function
}
```

## State Management

### Local State
- `sidebarCollapsed`: Boolean for desktop sidebar collapse
- `sidebarOpen`: Boolean for mobile sidebar overlay
- `openAccordions`: Set of open accordion IDs
- `profileDropdownOpen`: Boolean for profile dropdown
- `topbarDropdownOpen`: Boolean for topbar profile dropdown

### State Sharing
- UI shell state is managed in Layout component
- State is passed down to child components as props
- No global state management required for current features

## Accessibility Features

### Keyboard Navigation
- All interactive controls reachable via Tab
- Enter and Space keys for accordion toggles
- Escape key to close dropdowns
- Focus-visible outlines using Tailwind ring utilities

### Screen Reader Support
- Proper ARIA labels for icons used as links
- `aria-expanded` and `aria-controls` for accordions
- `aria-current="page"` for active navigation items
- Semantic HTML structure (nav, header, main)

### Color Contrast
- WCAG AA compliant color combinations
- Subtle gray tones for secondary text
- Strong contrast for headings and primary text

## Responsive Behavior

### Breakpoints
- **Mobile**: `< 768px` - Sidebar becomes overlay
- **Tablet**: `768px - 1024px` - Sidebar remains fixed
- **Desktop**: `> 1024px` - Full sidebar with collapse option

### Mobile Features
- Hamburger menu button in topbar
- Sidebar slides in from left as overlay
- Backdrop with click-to-close functionality
- Automatic sidebar close on route changes

### Desktop Features
- Persistent sidebar with collapse toggle
- Collapsed width: 64px (icons only)
- Expanded width: 240px (full navigation)
- Smooth width transitions

## Animations and Transitions

### Framer Motion Integration
- Smooth sidebar width changes
- Overlay slide animations
- Fade in/out effects for dropdowns
- Staggered animations for quick action cards

### Performance Considerations
- Short animation durations (160ms - 240ms)
- Respects `prefers-reduced-motion`
- Hardware-accelerated transforms
- Minimal re-renders during animations

## Future Expansion Points

### Authentication Integration
**Current**: Placeholder user data
**Future**: Integrate with Supabase auth
- Replace placeholder user with real auth data
- Implement proper logout functionality
- Add user profile management

### Data Fetching
**Current**: Static placeholder content
**Future**: Connect to backend APIs
- Real-time task data
- Calendar event synchronization
- User preferences and settings

### Feature Implementation
**Current**: Placeholder pages with "coming soon" messages
**Future**: Implement actual functionality
- Task management system
- Calendar integration
- AI chat functionality
- Third-party integrations

### Analytics and Tracking
**Current**: Console.log for user interactions
**Future**: Proper analytics implementation
- User behavior tracking
- Feature usage metrics
- Performance monitoring

## Testing Strategy

### Unit Tests
- Component rendering tests
- Props validation
- State management logic
- Event handler functionality

### Integration Tests
- Navigation flow testing
- Layout persistence across routes
- Responsive behavior validation
- Accessibility compliance

### E2E Tests (Cypress)
- Complete user journey testing
- Mobile/desktop responsive testing
- Keyboard navigation verification
- Cross-browser compatibility

## Performance Notes

### Optimization Strategies
- Lazy loading for subpage components
- Tree-shaking for Lucide icons
- Minimal bundle size for sidebar
- Efficient re-render patterns

### Monitoring Points
- First contentful paint
- Time to interactive
- Bundle size analysis
- Runtime performance metrics

## Security Considerations

### Input Sanitization
- No user-supplied HTML rendering
- Form input validation
- XSS prevention measures
- CSRF protection for future forms

### Authentication
- Route protection middleware
- Session validation
- Secure logout procedures
- Role-based access control (future)

## Internationalization (i18n)

### Current Structure
- Hardcoded English strings
- Centralized component structure
- Easy to extract for translation

### Future Implementation
- Translation key mapping
- Locale detection
- RTL language support
- Cultural adaptation

## Development Workflow

### Code Organization
- Single responsibility components
- Prop-driven styling
- Reusable utility functions
- Clear separation of concerns

### Styling Approach
- Tailwind utility classes
- Consistent design tokens
- Responsive design patterns
- Accessibility-first approach

### Component Guidelines
- Keep components small and focused
- Use TypeScript for all components
- Implement proper error boundaries
- Follow React best practices

## Troubleshooting

### Common Issues
1. **Sidebar not collapsing**: Check `sidebarCollapsed` state
2. **Mobile overlay not working**: Verify z-index values
3. **Navigation highlighting**: Check `usePathname` hook
4. **Animation performance**: Reduce motion duration if needed

### Debug Tools
- React DevTools for component state
- Browser DevTools for responsive testing
- Accessibility audit tools
- Performance profiling

## Deployment Notes

### Build Requirements
- Node.js 18+ required
- Next.js 14+ compatibility
- Tailwind CSS compilation
- TypeScript compilation

### Environment Variables
- Supabase configuration (future)
- Analytics keys (future)
- Feature flags (future)

### Build Optimization
- Static page generation where possible
- Image optimization
- Bundle splitting
- CDN configuration

---

## Quick Start

1. **Install dependencies**: `npm install`
2. **Start development**: `npm run dev`
3. **Navigate to**: `http://localhost:3000/dashboard`
4. **Test responsive**: Resize browser window
5. **Test navigation**: Click through all menu items
6. **Test accessibility**: Use Tab key and screen reader

## Contributing

When adding new features:
1. Follow existing component patterns
2. Maintain TypeScript types
3. Ensure responsive design
4. Test accessibility compliance
5. Update this documentation
6. Add appropriate tests

---

*Last updated: [Current Date]*
*Version: 1.0.0*

