# auth-bp-next

Next.js Authentication Boilerplate with support for whitelabeling, RBAC, and multitenant architectures.

## Features

✅ **JWT Authentication** - Secure token-based authentication  
✅ **Session Management** - Token refresh and persistent sessions  
✅ **Optional RBAC** - Role-Based Access Control with permissions  
✅ **Optional Multitenant** - Multi-tenant support with context  
✅ **Whitelabeling** - Support for custom branding integration  
✅ **React Hooks** - Easy-to-use hooks for auth, RBAC, and tenants  
✅ **TypeScript** - Full type safety throughout  
✅ **AI-Native** - `.context.md` files in every folder for LLM assistance  

## Installation

```bash
npm install auth-bp-next
npx auth-bp-next init
```

## Quick Start

After running `init`, you'll be prompted with configuration options:

```
? Enable Whitelabeling? (Yes / No)
? Enable RBAC? (Yes / No)
? Enable Multitenant support? (Yes / No)
? Backend API URL: (http://localhost:3001)
```

This generates a complete Next.js authentication module with:
- Auth context and provider
- React hooks for authentication
- API client with interceptors
- Protected route components
- RBAC components (if selected)
- Type definitions
- Configuration files

## Project Structure

```
src/
├── contexts/              # Global auth context
│   ├── auth-context.ts   # Context definition
│   └── auth-provider.tsx # Provider component
├── hooks/                # React hooks
│   ├── use-auth.ts      # Main auth hook
│   ├── use-protected-route.ts
│   ├── use-rbac.ts      # (Optional) RBAC hook
│   └── use-tenant.ts    # (Optional) Tenant hook
├── api/                 # API integration
│   ├── api-client.ts   # Axios client with interceptors
│   ├── auth.api.ts     # Auth endpoints
│   └── endpoints.ts    # API endpoint constants
├── components/         # Reusable components
│   ├── auth-provider.tsx
│   ├── protected-route.tsx
│   ├── can.tsx         # (Optional) RBAC component
│   ├── cannot.tsx      # (Optional) RBAC component
│   └── tenant-selector.tsx # (Optional) Tenant selector
├── types/             # Type definitions
│   └── auth.types.ts
├── middleware/        # Next.js middleware
│   └── auth.middleware.ts
├── config/           # Configuration
│   └── api.config.ts
└── .context.md       # Root context for AI assistance
```

## Usage

### Setup AuthProvider

In your `src/app/layout.tsx`:

```tsx
import { AuthProvider } from '@/components/auth-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Use Auth Hook

```tsx
'use client';
import { useAuth } from '@/hooks/use-auth';

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={() => login(email, password)}>Login</button>
      )}
    </div>
  );
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <h1>Dashboard</h1>
    </ProtectedRoute>
  );
}
```

### RBAC Components (if enabled)

```tsx
import { Can, Cannot } from '@/components/';

export function AdminPanel() {
  return (
    <>
      <Can role="admin">
        <div>Admin-only content</div>
      </Can>

      <Cannot role="admin">
        <div>Non-admin content</div>
      </Cannot>
    </>
  );
}
```

### RBAC Hooks (if enabled)

```tsx
'use client';
import { useRBAC } from '@/hooks/use-rbac';

export function MyComponent() {
  const { hasRole, hasPermission } = useRBAC();

  if (hasRole('admin')) {
    return <div>Admin content</div>;
  }

  return <div>User content</div>;
}
```

### Multitenant Hook (if enabled)

```tsx
'use client';
import { useTenant } from '@/hooks/use-tenant';

export function MyComponent() {
  const { tenantId, tenantSlug } = useTenant();

  return <div>Current tenant: {tenantSlug}</div>;
}
```

## Configuration

Each folder has a `.context.md` file explaining:
- Purpose and responsibilities
- How to extend and customize
- Related modules and dependencies
- Common tasks and examples

## Environment Variables

See `.env.example` for all required environment variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Integration with Backend

This package works seamlessly with `auth-bp-nest` backend package. Ensure both are initialized with matching configuration options.

## API Integration

The generated `api-client.ts` includes:
- Automatic JWT token attachment
- Token refresh logic
- Error handling and retries
- Type-safe endpoints

All requests to your backend are automatically authenticated.

## Development

```bash
npm install
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm test         # Run tests
```

## Production Build

```bash
npm run build
npm run start
```

## License

MIT
