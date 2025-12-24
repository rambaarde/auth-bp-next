# auth-bp-next

Next.js Authentication Boilerplate with NextAuth.js, JWT security, and support for whitelabeling, RBAC, and multitenant architectures.

<div align="center">

[![npm version](https://img.shields.io/npm/v/auth-bp-next?style=flat-square&color=green)](https://www.npmjs.com/package/auth-bp-next)
[![npm downloads](https://img.shields.io/npm/dm/auth-bp-next?style=flat-square&color=brightgreen)](https://www.npmjs.com/package/auth-bp-next)
[![license](https://img.shields.io/npm/l/auth-bp-next?style=flat-square)](https://github.com/rambaarde/auth-bp-next/blob/main/LICENSE)

[📦 View on npm](https://www.npmjs.com/package/auth-bp-next)

</div>

## Features

✅ **NextAuth.js** - Production-ready authentication with JWT strategy  
✅ **Automatic JWT Injection** - All API requests include Bearer token automatically  
✅ **Database Agnostic** - Choose Supabase or Google Cloud SQL  
✅ **Optional Whitelabel** - Dynamic branding (logo, color, brand name)  
✅ **Optional RBAC** - Role-Based Access Control with permission guards  
✅ **Optional Multitenant** - Subdomain-based tenant routing  
✅ **TypeScript** - Full type safety throughout  
✅ **AI-Native** - `.context.md` files in every folder for LLM assistance  

## Installation

```bash
# Create a new Next.js project
nest new my-app
cd my-app

# Install auth-bp-next
npm install auth-bp-next

# Run the CLI
npx auth-bp-next init
```

## Quick Start

Running `npx auth-bp-next init` will prompt you with configuration options:

```
? Which database are you using?
  > Supabase PostgreSQL
    Google Cloud SQL PostgreSQL

? Enable Whitelabeling? (Yes / No)
? Enable RBAC (Role-Based Access Control)? (Yes / No)
? Enable Multitenant support? (Yes / No)
? Backend API URL: (http://localhost:3001)
```

This generates a **complete Next.js authentication system** with:

- **NextAuth Handler** - `app/api/auth/[...nextauth]/route.ts` with CredentialsProvider
- **Auth Components** - Login and register forms (with optional whitelabel branding)
- **Middleware** - Protected routes, subdomain extraction (multitenant), role verification (RBAC)
- **API Client** - Axios with automatic JWT Bearer token injection
- **Environment Config** - `.env.local` with database-specific variables
- **.context.md Files** - AI-friendly documentation for Copilot/Cursor

## How It Works

### Three Core Generators

#### 1. Generator Orchestrator
Scaffolds the complete Next.js auth file structure:
- `app/api/auth/[...nextauth]/route.ts` - NextAuth credential provider + callbacks
- `lib/auth.config.ts` - Centralized auth configuration
- `lib/api-client.ts` - Axios client with JWT interceptors
- `components/auth/login-form.tsx` - Login UI (with optional branding)
- `components/auth/register-form.tsx` - Registration UI
- `.env.local` - Environment variables (conditional on database selection)

#### 2. Middleware Builder
Dynamically constructs `middleware.ts` based on configuration:
- **Multitenant**: Extracts subdomain (e.g., `tenant.example.com` → `/mp/tenant`)
- **RBAC**: Decodes JWT to verify user roles
- **Protected Routes**: Redirects unauthenticated users to `/login`

#### 3. Context Generator
Creates `.context.md` files in every key directory:
- `.context.md` - Project overview and data flow
- `app/api/auth/.context.md` - NextAuth configuration details
- `components/auth/.context.md` - Login/register component guide
- `middleware.context.md` - Request routing and RBAC explanation
- `lib/.context.md` - API client and JWT management

### Data Flow: Client → NextAuth → Backend → Database

```
User Login Form
    ↓
signIn('credentials', { email, password })
    ↓
NextAuth CredentialsProvider
    ↓
POST http://localhost:3001/auth/login
    ↓
Backend validates, returns: { accessToken, user }
    ↓
JWT callback: Store accessToken in encrypted session
    ↓
Session callback: Expose to client via useSession()
    ↓
API Client Interceptor: Attach "Authorization: Bearer <JWT>"
    ↓
All requests to backend include JWT automatically
```

## Generated Project Structure

After running `npx auth-bp-next init`, you get:

```
app/
├── api/auth/[...nextauth]/
│   ├── route.ts                 # NextAuth handler
│   └── .context.md              # NextAuth guide
├── login/page.tsx               # Login page
├── register/page.tsx            # Registration page
└── layout.tsx                   # Root layout with <AuthProvider>

components/auth/
├── login-form.tsx               # Login form (whitelabel props)
├── register-form.tsx            # Register form
├── auth-provider.tsx            # SessionProvider wrapper
├── protected-route.tsx          # Protected component wrapper
└── .context.md                  # Component guide

lib/
├── auth.config.ts               # Backend URL + session settings
├── api-client.ts                # Axios + JWT interceptors
└── .context.md                  # API client guide

hooks/
├── use-auth.ts                  # useSession() wrapper
├── use-rbac/index.ts           # Role checking (if RBAC enabled)
└── use-tenant/index.ts         # Tenant context (if multitenant enabled)

types/
└── auth.ts                      # User, Session, AuthResponse types

middleware.ts                    # Route protection + subdomain handling
.context.md                      # Project overview
.env.local                       # Environment variables
.auth-bp-config.json            # Configuration snapshot
```

## Usage

### Setup AuthProvider

In your `app/layout.tsx`:

```tsx
import { AuthProvider } from '@/components/auth/auth-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Use Auth Hook

```tsx
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not logged in</div>;

  return <div>Welcome, {session?.user?.firstName}!</div>;
}
```

### Protect Routes

```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <h1>Dashboard</h1>
    </ProtectedRoute>
  );
}
```

### Call Backend API

```tsx
'use client';
import { apiClient } from '@/lib/api-client';

export function MyComponent() {
  const handleFetch = async () => {
    const data = await apiClient.get('/auth/profile');
    // JWT is automatically attached via interceptor
    console.log(data);
  };

  return <button onClick={handleFetch}>Fetch Profile</button>;
}
```

### RBAC Components (if enabled)

```tsx
'use client';
import { Can, Cannot } from '@/components/rbac/can';

export function AdminPanel() {
  return (
    <>
      <Can role="admin">
        <button>Delete User</button>
      </Can>

      <Cannot role="admin">
        <p>You need admin access</p>
      </Cannot>
    </>
  );
}
```

### Check User Roles (if enabled)

```tsx
'use client';
import { useRBAC } from '@/hooks/use-rbac';

export function MyComponent() {
  const { hasRole, hasAnyRole } = useRBAC();

  if (hasRole('admin')) {
    return <div>Admin Panel</div>;
  }

  return <div>User Panel</div>;
}
```

### Tenant Context (if enabled)

```tsx
'use client';
import { useTenant } from '@/hooks/use-tenant';

export function TenantInfo() {
  const { tenantId, hasTenant } = useTenant();

  return <div>Tenant: {tenantId}</div>;
}
```

## Environment Variables

After setup, copy `.env.example` to `.env.local` and configure:

### Required
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### Database (Supabase)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Database (Google Cloud SQL)
```
GOOGLE_CLOUD_SQL_INSTANCE=project:region:instance
GOOGLE_CLOUD_SQL_USER=postgres
GOOGLE_CLOUD_SQL_PASSWORD=your-password
```

### Whitelabel (if enabled)
```
NEXT_PUBLIC_BRAND_NAME=Your Brand
NEXT_PUBLIC_BRAND_LOGO=/logo.png
NEXT_PUBLIC_PRIMARY_COLOR=#3b82f6
```

### Multitenant (if enabled)
```
NEXT_PUBLIC_TENANT_DOMAIN=yourdomain.com
NEXT_PUBLIC_ALLOW_SUBDOMAINS=true
```

## Integration with Backend

This package works seamlessly with `auth-bp-nest` backend package.

**Critical**: Both must be initialized with **matching configuration options**:
- Same database (Supabase or Google Cloud SQL)
- Same whitelabel setting
- Same RBAC enabled/disabled
- Same multitenant enabled/disabled

**Also critical**:
1. Frontend `.env.local` must have `NEXT_PUBLIC_API_URL` pointing to backend
2. Backend `.env` must have `JWT_SECRET` that matches frontend `NEXTAUTH_SECRET`
3. Backend must enable CORS for frontend origin

See `ROOT_CONTEXT.md` in the project root for full integration details.

## JWT & Security

### How JWT is Stored
- JWT is stored in encrypted NextAuth session cookie
- Never stored in localStorage
- Automatically sent with every request

### How JWT is Attached
```typescript
// lib/api-client.ts
client.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.user?.accessToken) {
    config.headers.Authorization = `Bearer ${session.user.accessToken}`;
  }
  return config;
});
```

### Token Expiration
- Session duration: 30 days (configurable in `lib/auth.config.ts`)
- Expired token → 401 response → Redirect to `/login`
- No manual refresh needed (NextAuth handles it)

## Middleware

The generated `middleware.ts` handles:

1. **Public Routes** - Allow without auth:
   - `/login`, `/register`, `/forgot-password`

2. **Protected Routes** - Require authentication:
   - `/dashboard`, `/profile`, `/admin`, `/mp`

3. **Multitenant Routing** (if enabled):
   - Extracts subdomain from Host header
   - Rewrites to `/mp/[tenant]` route
   - Validates tenant slug format

4. **RBAC Guards** (if enabled):
   - Decodes JWT from cookie
   - Extracts user roles
   - Injects `x-user-roles` header for route handlers

## .context.md Files

Every major directory includes a `.context.md` file that explains:
- Module purpose and responsibilities
- Architecture decisions
- How data flows
- Common patterns with code examples
- Integration points

These files help AI assistants (Copilot, Cursor, etc.) understand code without hallucinating.

## Development

```bash
npm install
npm run dev      # Start dev server (port 3000)
npm run build    # Build for production
npm run start    # Start production server
```

## Production Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment variables on your hosting platform

3. Ensure backend is accessible at `NEXT_PUBLIC_API_URL`

4. Deploy to Vercel, AWS, GCP, or your choice of platform

## Troubleshooting

**Problem**: "401 Unauthorized" on API calls
- Check `lib/api-client.ts` interceptors are working
- Verify JWT is in session via `useSession()`
- Confirm backend JWT_SECRET matches NEXTAUTH_SECRET

**Problem**: Session not persisting
- Check NEXTAUTH_SECRET is set in `.env.local`
- Verify NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

**Problem**: Subdomain not working (multitenant)
- Verify Host header format: `tenant.localhost:3000`
- Check tenant slug only contains alphanumeric + hyphens
- Review middleware.ts subdomain extraction logic

**Problem**: RBAC roles not showing
- Confirm backend returns roles in login response
- Check user object includes `roles` array in session
- Verify middleware is decoding JWT correctly

## See Also

- [NextAuth.js Docs](https://next-auth.js.org)
- [auth-bp-nest Backend](https://www.npmjs.com/package/auth-bp-nest)
- [Supabase Docs](https://supabase.com/docs)
- [Google Cloud SQL Docs](https://cloud.google.com/sql/docs)

## License

MIT
