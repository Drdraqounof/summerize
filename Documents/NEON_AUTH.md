Migrate to Neon Auth with Better Auth
Update from the legacy Stack Auth-based implementation


Copy page

Beta
The Neon Auth with Better Auth is in Beta. Share your feedback on Discord or via the Neon Console.

This guide shows you the code differences between legacy Neon Auth (Stack Auth) and Neon Auth with Better Auth. Use it as a reference to understand what changes if you decide to upgrade.

Legacy Neon Auth (Stack Auth) is no longer accepting new users
If you're using legacy Neon Auth with Stack Auth, you can continue using it. We'll keep supporting it for existing users. But we encourage you to try Neon with Better Auth instead.

Why Neon Auth with Better Auth?
Native Branching Support

Authentication branches automatically with your database. Each branch gets isolated users, sessions, and auth configuration, perfect for preview environments and testing.

Database as Source of Truth

Your Neon database is the single source of truth for authentication data. No webhooks, no sync delays, no external dependencies. Query users directly with SQL.

Simplified Configuration

One environment variable instead of four. Easier setup, fewer moving parts.

Open-Source Foundation

Built on Better Auth, enabling faster development of new features and better community support.

Environment variables
Update your environment variables to use Better Auth's configuration.

.env (before - Stack Auth)
NEXT_PUBLIC_STACK_PROJECT_ID=your-project-id
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-client-key
STACK_SECRET_SERVER_KEY=your-server-secret
.env (after - Better Auth)
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.build/neondb/auth
NEON_AUTH_COOKIE_SECRET=your-secret-at-least-32-characters-long
note
For React SPAs, use VITE_NEON_AUTH_URL instead. The NEON_AUTH_COOKIE_SECRET is only needed for Next.js (generate with openssl rand -base64 32).

You can find your Auth URL in the Neon Console under Auth → Configuration.

What changed
You replace multiple Stack Auth-specific keys with a single Better Auth URL that points at your Neon project. For Next.js, you also need a cookie secret for session caching.

Next.js migration
Install packages
Uninstall Stack Auth packages and install @neondatabase/auth

Terminal
npm uninstall @stackframe/stack
npm install @neondatabase/auth@latest @neondatabase/auth-ui
What changed
Your app now depends on Neon Auth's Next.js SDK and UI package instead of the Stack Auth SDK.

Update SDK initialization
Before (Stack Auth)
After (Better Auth)
// ./lib/auth/client.ts
'use client';
import { createAuthClient } from '@neondatabase/auth/next';
// to use in react client components
export const authClient = createAuthClient();
// ./lib/auth/server.ts
import { createNeonAuth } from '@neondatabase/auth/next/server';
// to use in react server components, server actions, and API routes
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
What changed
You initialize the Neon Auth client with createAuthClient for client components and with createNeonAuth() for server-side auth. The unified auth instance provides .handler(), .middleware(), .getSession(), and all Better Auth server methods.

Replace components
Sign in page
Before (Stack Auth)
After (Better Auth)
import { AuthView } from '@neondatabase/auth-ui';
export default function SignInPage() {
  return <AuthView pathname="sign-in" />;
}
What changed
You render Neon Auth's AuthView client component and tell it which flow to show using the pathname prop.

Sign up page
Before (Stack Auth)
After (Better Auth)
import { AuthView } from '@neondatabase/auth-ui';
export default function SignUpPage() {
  return <AuthView pathname="sign-up" />;
}
What changed
You swap the dedicated <SignUp /> component for the same AuthView component, configured with the "sign-up" pathname.

User button
Before (Stack Auth)
After (Better Auth)
import { UserButton } from '@neondatabase/auth-ui';
export function Header() {
  return <UserButton />;
}
What changed
You keep the same UserButton API but import it from the Neon Auth UI package and mark the component as client-side.

Replace hooks
Before (Stack Auth)
After (Better Auth)
'use client';
import { useSession } from '@/lib/auth/client';
export function MyComponent() {
  const { data } = useSession();
  const user = data?.user;
  return <div>{user ? `Hello, ${user.name || user.email}` : 'Not logged in'}</div>;
}
What changed
Instead of useUser(), you call useSession() hook from authClient and read the user & session data from response.

Update provider setup
Before (Stack Auth)
After (Better Auth)
'use client';
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import '@neondatabase/auth-ui/css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
export default function RootLayout({ children }) {
  const router = useRouter();
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={router.refresh}
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}

What changed
You wrap your app in NeonAuthUIProvider, pass it the authClient, and import the Neon Auth UI styles.

Styling options
To learn more about applying styles to the Auth UI components, including plain CSS and Tailwind CSS v4 options, see UI Component Styles.

Replace auth handler route
Before (Stack Auth)
After (Better Auth)
// app/api/auth/[...path]/route.ts
import { auth } from '@/lib/auth/server';
export const { GET, POST } = auth.handler();
What changed
You proxy Neon Auth APIs from your Next.js application. The auth.handler() method forwards all API requests to the Neon Auth server.

Protect routes
Component-level protection
Before (Stack Auth)
After (Better Auth)
'use client';
import { SignedIn, RedirectToSignIn } from '@neondatabase/auth-ui';
export default function ProtectedPage() {
  return (
    <SignedIn>
      <div>Protected content</div>
      <RedirectToSignIn />
    </SignedIn>
  );
}
What changed
You switch from hook-based redirects to declarative UI helpers that show content only when the user is signed in.

Middleware-based protection
Next.js version compatibility
proxy.ts replaces middleware.ts in Next.js 16. On earlier versions, name the file middleware.ts and export default function middleware instead of proxy. The auth logic is identical.

proxy.ts (new)
import { auth } from '@/lib/auth/server';
export default auth.middleware({
  // Redirects unauthenticated users to sign-in page
  loginUrl: '/auth/sign-in',
});
export const config = {
  matcher: [
    // Protected routes requiring authentication
    '/dashboard/:path*',
    '/settings/:path*',
    // Do not run the middleware for the static resources
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
What changed
You can optionally add middleware to enforce auth at the edge for specific paths.

Server-side user access
Before (Stack Auth)
After (Better Auth)
import { auth } from '@/lib/auth/server';
// Server components using auth methods must be rendered dynamically
export const dynamic = 'force-dynamic';
export default async function ServerComponent() {
  const { data: session } = await auth.getSession();
  return <div>{session?.user?.name || session?.user?.email}</div>;
}
What changed
Server components now call auth.getSession() and read the user from the returned session. Components using auth methods must set dynamic = 'force-dynamic'.

React SPA migration
Install packages
Uninstall Stack Auth packages and install @neondatabase/auth

Terminal
npm uninstall @stackframe/stack
npm install @neondatabase/auth@latest @neondatabase/auth-ui
What changed
You use the framework-agnostic Neon JS SDK plus the shared UI package instead of the Stack Auth client SDK.

Update SDK initialization
Before (Stack Auth)
After (Better Auth)
// src/auth.ts
import { createAuthClient } from '@neondatabase/auth';
export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);
const { useSession } = authClient;
What changed
You replace the Stack Auth client app with a Neon Auth authClient wired to your Neon Auth URL.

Replace components
Components are the same as Next.js. Use <AuthView>, <UserButton>, <SignedIn>, and <SignedOut> from @neondatabase/neon-auth-ui.

What changed
The UI building blocks are shared across frameworks, so you can reuse the same auth components in SPAs.

Replace hooks
Before (Stack Auth)
After (Better Auth)
import { useSession } from './auth';
export function MyComponent() {
  const { data: session } = useSession();
  const user = data?.user;
  return <div>{user ? `Hello, ${user.name || user.email}` : 'Not logged in'}</div>;
}
What changed
Instead of a React hook from Stack Auth, you call authClient.getSession() and manage the session in your own component state.

Update provider setup
Before (Stack Auth)
After (Better Auth)
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import '@neondatabase/auth-ui/css';
import { authClient } from './auth';
function App() {
  return <NeonAuthUIProvider authClient={authClient}>{/* Your app */}</NeonAuthUIProvider>;
}
What changed
You drop the Stack Auth provider/theme and wrap your app in NeonAuthUIProvider with the Neon Auth UI styles.

Styling options
To learn more about applying styles to the Auth UI components, including plain CSS and Tailwind CSS v4 options, see UI Component Styles.

Remove auth handler route
Delete any StackHandler routes. Create custom pages for sign-in and sign-up using <AuthView>.

src/pages/SignIn.tsx
import { AuthView } from '@neondatabase/auth-ui';
export default function SignIn() {
  return <AuthView pathname="sign-in" />;
}
What changed
Routing is fully controlled by your SPA, and the AuthView component just renders the appropriate view for each path.

React Router integration
If you're using React Router, pass navigation helpers to the provider.

src/App.tsx (React Router)
import { NeonAuthUIProvider } from '@neondatabase/auth-ui';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from './auth';
function App() {
  const navigate = useNavigate();
  return (
    <NeonAuthUIProvider authClient={authClient} navigate={navigate} Link={Link}>
      {/* Your app */}
    </NeonAuthUIProvider>
  );
}
What changed
You let Better Auth reuse your router's navigation and Link components so redirects and links stay in sync with your SPA.

Eject to Stack Auth
If you prefer to continue using Stack Auth independently instead of migrating to Better Auth, you can claim your Stack Auth project and manage it directly.

Claim your project via the Neon Console
Go to your project's Auth page, Configuration tab in the Neon Console.
Click Claim project in the Claim project section.
Follow the prompts to select the Stack Auth account that should receive ownership.
After claiming, you'll have direct access to manage your project in the Stack Auth dashboard.

Update your environment variables
Once claimed, update your environment variables to use Stack Auth's direct configuration. Your existing code will continue to work without changes since you're already using the Stack Auth SDK (@stackframe/stack).

Manage independently
After claiming, you can:

Manage OAuth providers directly in Stack Auth.
Configure production security settings.
Access Stack Auth's dashboard and features.
important
Ejecting to Stack Auth means you'll manage authentication independently from Neon. You'll need to handle updates, support, and infrastructure yourself. Your authentication data will no longer be managed through the Neon Console.