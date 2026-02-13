# Innogram Frontend Implementation - TikTok Design

## Overview
The client application has been completely redesigned with a TikTok-inspired interface using Next.js 16, React 19, and Tailwind CSS 4.

## Project Structure

### Pages (App Router)
```
src/app/
├── page.tsx                    # Landing page (auto-redirects to /feed or /auth/login)
├── auth/
│   ├── login/page.tsx          # Login page
│   └── signup/page.tsx         # Registration page
├── feed/
│   ├── layout.tsx              # Protected layout with TikTokNavbar
│   └── page.tsx                # Main feed with posts
├── profile/
│   ├── layout.tsx              # Protected layout
│   └── [username]/page.tsx     # User profile page
├── chat/
│   ├── layout.tsx              # Protected layout
│   └── page.tsx                # Chat list and window
├── notifications/
│   ├── layout.tsx              # Protected layout
│   └── page.tsx                # Notifications feed
└── layout.tsx                  # Root layout with AuthProvider
```

### Components

#### UI Components (`src/components/ui/`)
- **Button.tsx** - Reusable button with variants (primary, secondary, outline, ghost, danger)
- **Input.tsx** - Form input with label, error, and helper text
- **Modal.tsx** - Dialog component with backdrop
- **Avatar.tsx** - User avatar with fallback

#### Feature Components
- **TikTokNavbar.tsx** - Fixed left sidebar navigation (mobile-responsive)
- **ProtectedRoute.tsx** - Route protection with auth check
- **feed/** - Post-related components
  - PostCard.tsx - Post display with double-tap like, comments
  - CreatePostWidget.tsx - Post creation interface
  - CommentSection.tsx - Comment list and creation
- **chat/** - Chat-related components
  - ChatList.tsx - List of conversations
  - ChatWindow.tsx - Chat display with messages
  - MessageBubble.tsx - Individual message display
- **profile/** - Profile-related components
  - ProfileHeader.tsx - User info and stats
  - PostsGrid.tsx - Grid display of user posts
  - EditProfileModal.tsx - Profile edit form

### Context & Hooks

#### Authentication
- **src/context/AuthContext.tsx** - Global auth state management
  - Manages user, profile, login, signup, logout
  - Auto-retrieves user on app load if token exists
  - Provides `useAuth()` hook

- **src/hooks/useSocket.ts** - WebSocket connection management

### Styling & Theme

#### Global Styles (`src/app/globals.css`)
TikTok-inspired dark theme:
- Primary BG: `#000000`
- Card BG: `#1e1e1e`
- Accent Color: `#FE2C55` (TikTok pink)
- Supports CSS custom properties for easy theming

#### Tailwind Configuration
- Next.js 16 with Tailwind CSS 4
- Custom colors using CSS variables
- Responsive design with mobile-first approach
- Custom animations (fadeIn, slideUp, pulse-heart, etc.)

### API Integration

#### Axios Instance (`src/lib/axios.ts`)
- Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`)
- Auto-attaches Bearer token from localStorage
- Auto-redirects to login on 401 responses

#### Type Definitions (`src/types/index.ts`)
Full TypeScript types for all entities:
- User, Profile, Post, Comment, Chat, Message
- Notification, Asset, ProfileFollow
- PaginatedResponse, PaginationMeta

### Key Features Implemented

✅ **Authentication**
- Email/password login and signup
- Protected routes with auto-redirect
- Token management with auto-refresh

✅ **Feed**
- Post display with infinite scroll
- Double-tap to like functionality
- Like/comment interaction
- Post creation

✅ **Profile**
- User profile viewing
- Profile edit capability
- Follow/unfollow functionality
- Stats display (posts, followers, following)

✅ **Notifications**
- Real-time notification display
- Type indicators (like, comment, follow)
- Notification icons and timestamps

✅ **Chat**
- Chat list with search
- Real-time messaging (Socket.io ready)
- Chat creation and participant management
- Message display and editing

✅ **Responsive Design**
- Mobile-first responsive layout
- Desktop navigation sidebar
- Mobile hamburger menu ready
- Responsive grid and containers

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Architecture Decisions

### Clean Architecture
- UI Components (reusable, composable)
- Page Components (route handlers)
- Services (API calls via axios)
- Context (global state management)
- Hooks (reusable logic)

### State Management
- React Context for global auth state
- Local useState for component state
- Server-side auth validation

### Styling Approach
- Tailwind CSS for utility classes
- CSS custom properties for theme consistency
- No component libraries (custom UI components)

### Form Handling
- React Hook Form for form management
- Zod for schema validation
- Client-side validation before submission

### Data Fetching
- Axios with interceptors for API calls
- Error handling with user feedback
- Loading states for better UX

## Integration with Backend

### API Endpoints Used
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `GET /profiles/me` - Current user profile
- `GET /profiles/:username` - User profile
- `GET /posts/feed` - Main feed with pagination
- `POST /posts` - Create post
- `POST /posts/:id/like` - Toggle post like
- `GET /chats` - List user chats
- `POST /chats` - Create new chat
- `GET /notifications` - Get notifications
- WebSocket connection for real-time updates

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on all screen sizes
- Mobile-first responsive approach

## Performance Considerations
- Code splitting with Next.js
- Image optimization ready
- Lazy loading components
- Efficient re-renders with React 19
- Pagination for infinite scroll

## Security
- HTTPS only in production
- Secure token storage
- CORS-enabled for cross-origin requests
- XSS protection via React escaping
- CSRF protection via same-site cookies

## Testing Readiness
- TypeScript for type safety
- Component composition for testability
- Hooks for isolated logic testing
- Mock API responses in tests

## Future Enhancements
- Dark/light theme toggle
- Internationalization (i18n)
- Service workers for offline support
- Push notifications
- Video support in posts
- Advanced search and filtering
- Accessibility improvements (WCAG)
