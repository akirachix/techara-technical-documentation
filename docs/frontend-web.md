# Frontend Web

The GridFit browser application is implemented in Next.js using the App Router and React. The supplied frontend README describes it as a prototype that uses mock data and is not yet fully connected to the backend.

## Technology stack

- Next.js 16.4.x (package manifest)
- React 19.x
- JavaScript and TypeScript
- CSS Modules and global CSS
- Tailwind CSS 4 is present in the development dependencies
- Radix UI Dialog
- Lucide React icons
- React Hook Form
- ESLint 9 and Prettier 3
- Vitest is declared as a test dependency; the test command uses `--passWithNoTests`

Use the exact versions in `package.json` and the lockfile when reproducing the environment.

## Prerequisites and setup

Install a compatible Node.js version and npm. From the frontend repository root:

```bash
npm install
npm run dev
```

The development server is normally available at `http://localhost:3000`.

Useful scripts:

```bash
npm run build
npm run start
npm run lint
npm run format
npm run format:check
npm test
```

`npm test` is configured to pass when no tests are found. A green result alone therefore does not prove meaningful frontend test coverage.

## Project structure

| Path | Purpose |
|---|---|
| `app/` | Next.js route segments and page components |
| `app/(auth)/` | Operator authentication and splash pages |
| `app/(field)/` | Field workflow pages |
| `app/dashboard/` | Operator dashboard pages |
| `app/field/` | Field-agent application pages |
| `app/api/` | Next.js route handlers, including backend proxy/auth route |
| `components/shared/` | Shared shells, logo, badges, charts, modal, toast and UI components |
| `lib/` | API helpers, data, formatting, business and meter utilities |
| `public/` | Static assets and web-app manifests |

## Routes

### Operator interface

| Route | Purpose |
|---|---|
| `/splash` | Splash screen |
| `/login` | Operator login |
| `/signup` | Account creation |
| `/dashboard` | Dashboard entry |
| `/dashboard/overview` | Overview |
| `/dashboard/sites` | Site list/details |
| `/dashboard/prospects` | Business prospects |
| `/dashboard/fit-check/[id]` | Fit-check view for a business |
| `/dashboard/compare` | Compare sites |
| `/dashboard/import` | Import data |
| `/dashboard/settings` | Profile and settings |

### Field interface

| Route | Purpose |
|---|---|
| `/field` | Field app entry |
| `/field/login` | Field-agent login |
| `/field/join` | Join/invitation flow |
| `/field/home` | Field home |
| `/field/log` | Start business logging |
| `/field/log/equipment` | Record equipment |
| `/field/log/meter` | Record meter information |
| `/field/businesses` | List recorded businesses |
| `/field/businesses/[id]` | Business details |
| `/field/meters` | Meter list |
| `/field/profile` | Field-agent profile |
| `/field/change-password` | Password-change flow |

The repository contains route components for these paths. Availability of a route does not imply that its backend operation is integrated.

## API integration status

The source includes `lib/api.js`, `lib/api.ts`, typed business/meter helpers and a Next.js backend proxy route. The frontend README nevertheless states that the application currently uses mock data and has not yet been connected to the backend. Treat the README as the declared integration status and verify each screen/API pair before describing it as live.

The frontend code references `BACKEND_URL` and `NEXT_PUBLIC_API_URL`. Do not publish secret values. Confirm which variable is used by the deployed Vercel environment and ensure server-only secrets are not exposed through a `NEXT_PUBLIC_` variable.

## Authentication and state

The README says login is simulated for the current prototype: any email/password works on the operator side; the field side accepts a nine-digit phone number and six-digit PIN. This is demonstration behaviour, not production authentication. The backend uses bearer JWTs; a production integration must use the backend's real login response, enforce role checks server-side and handle token expiry/logout safely.

The README also says changes are stored in memory and reset when the page is refreshed. Do not promise durable persistence for mock flows.

## Styling and accessibility

Shared UI components live in `components/shared/`; route-specific styles are generally CSS Modules. The design uses Afacad for body/UI text and Alumni Sans for display headings, with brand colours documented in [Brand Guideline](brand-guideline.md).

New pages should:
- Use semantic headings and landmarks.
- Associate form labels with inputs.
- Provide keyboard-visible focus states.
- Avoid communicating status through colour alone.
- Include loading, empty, validation and error states.
- Keep responsive layouts usable on small field devices.

## QA and deployment

Run lint, formatting and production build checks before opening a pull request. Add actual Vitest tests as functionality is implemented; `--passWithNoTests` must not be treated as coverage. The frontend is deployed on Vercel according to the team's deployment context; confirm the production project URL and configured build environment in Vercel.
