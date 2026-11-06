# GridFit Frontend Technical Documentation

## 1. Implementation status and scope

The current frontend is a functional prototype and demonstration interface rather than a verified backend-integrated production application. The source repositories make this explicit:

- `techara-frontend/README.md` states that the frontend uses mock data and has not yet been connected to the backend.
- `techara-frontend/app/(auth)/login/page.js` validates form input and navigates locally, but it does not call a backend authentication endpoint.
- `techara-frontend/app/providers.js` stores business and dashboard state in React `useState(...)` with in-memory mock data.

This means the current frontend should be treated as an interactive UI prototype. Interface behaviour can be inspected and validated as a user experience, but it does not prove that the corresponding backend operations are live, authenticated or persisted.

## 2. What this project is

GridFit is a Next.js frontend for mini-grid operators and field agents. The operator-facing application supports reviewing sites, viewing business prospects, and assessing whether a business can be supported by a mini-grid. The field application supports collecting business information and recording equipment and meter details.

This document focuses on the field-agent experience implemented in the current source archive, particularly the four screens in Nikki's agreed frontend scope:

- **Field Home** — `/field/home`
- **Log a Business** — `/field/log` (step 1)
- **Equipment List** — `/field/log/equipment` (step 2)
- **Install Meter** — `/field/log/meter` (step 3)

The implementation should be read as the state of the supplied source archive, not as a claim that every part of the workflow is production-integrated. In particular, the meter installation screen currently uses simulated readings and explicitly blocks starting a real metering session until a registered physical device can be assigned.

## 3. Local setup

### Prerequisites

The repository's CI workflow configures Node.js 22. Use a compatible Node.js 22 installation and npm.

You will also need:

- Git
- Access to the Techara frontend repository
- A running backend when testing the site-loading and other backend-connected parts of the field workflow

### Install dependencies

From the repository root:

```bash
npm ci
```

`npm ci` installs the exact dependency versions recorded in `package-lock.json`.

### Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Environment configuration

The source archive excludes local environment files, so do not copy credentials or private values into documentation or commit them to Git.

The source contains these environment-variable references:

| Variable | Used by | Purpose |
|---|---|---|
| `BACKEND_URL` | `app/api/backend/[...path]/route.js`, `app/api/auth/login/route.js` | Server-side URL of the backend API |
| `NEXT_PUBLIC_API_URL` | `lib/api.js`, `lib/api.ts` | Base URL used by the browser-side API helpers |

For local work, configure the backend URL in your untracked `.env.local` file. The backend proxy route returns a 500 response when `BACKEND_URL` is missing. The browser API helpers fall back to their source-defined defaults when `NEXT_PUBLIC_API_URL` is not set.

The current field business form requests sites from `/api/backend/sites`, which is handled by the server-side proxy. Confirm the correct backend URL with the team before testing this request.

### Available npm scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format files with Prettier |
| `npm run format:check` | Check formatting without rewriting files |
| `npm test` | Run Vitest once; `--passWithNoTests` means the command can pass when no tests are present |

The supplied archive contains no test files. The presence of Vitest in `package.json` does not, by itself, mean that automated frontend tests have been written.

## 3. How the application is structured

The frontend uses the Next.js App Router. Page files inside `app/` define routes. Parentheses in a folder name, such as `app/(field)`, create a route group and do not appear in the public URL.

The four field screens are client components because they use React state, event handlers, browser APIs, and Next.js client navigation. Shared state is provided through `app/providers.js`, while common field layout and reusable step-header components keep the screens visually consistent.

The business-logging draft is held in the React context store while the agent moves between the three screens. This is in-memory state: the supplied provider does not persist the draft to local storage or a database. A page refresh can therefore reset the current draft.

### Shared draft state

The initial business draft is defined in `app/providers.js`:

```jsx
export const EMPTY_DRAFT = {
  id: null,
  businessId: null,
  name: "",
  owner: "",
  phone: "",
  type: "Butchery",
  site: "A",
  landmark: "",
  days: [true, true, true, true, true, true, false],
  opens: "07:00",
  closes: "19:00",
  power: ["ZESCO grid", "Generator"],
  equipment: DEFAULT_EQUIPMENT,
  meter: "GF-0107",
};
```

The provider exposes `draft` and `setDraft` through `useStore()`. Each step updates the same draft rather than creating a separate copy of the business information.

### Shared field layout

`components/shared/FieldShell.js` provides the phone-sized field application frame, navigation tabs, and optional fixed footer. The logging steps disable the bottom tabs and supply their own footer action.

`app/(field)/_components/StepHeader.js` displays the current step title, subtitle, back action, and three-part progress indicator. The step labels are Business, Equipment, and Meter.

## 4. Repository structure

The following paths are the main files relevant to the field workflow:

```text
app/
├── (field)/
│   ├── _components/
│   │   ├── StepHeader.js
│   │   ├── channels.js
│   │   └── log.module.css
│   └── field/
│       ├── home/
│       │   ├── page.js
│       │   └── home.module.css
│       └── log/
│           ├── page.js
│           ├── equipment/
│           │   └── page.js
│           └── meter/
│               └── page.js
├── api/
│   ├── auth/
│   │   └── login/
│   │       └── route.js
│   └── backend/
│       └── [...path]/
│           └── route.js
├── globals.css
├── layout.tsx
└── providers.js

components/
└── shared/
    ├── FieldShell.js
    ├── Modal.js
    ├── Toasts.js
    ├── Logo.js
    └── ui.module.css

lib/
├── api.js
├── api.ts
├── data.js
├── format.js
├── gridfit.js
├── businesses.ts
└── meters.ts
```

The route group `(field)` is organizational. For example, `app/(field)/field/home/page.js` is served at `/field/home`.

## 5. Main dependencies

The versions below are taken from the supplied `package.json`.

| Package | Version | Use in the frontend |
|---|---:|---|
| `next` | `16.4.3` | App framework, routing, server routes and production build |
| `react` / `react-dom` | `19.3.0` | Component rendering and state |
| `lucide-react` | `0.475.0` | Interface icons |
| `@radix-ui/react-dialog` | `1.3.1` | Accessible dialog primitive |
| `react-hook-form` | `^7.91.0` | Form support in the wider application |
| `tailwindcss` | `^4` | Styling dependency |
| `typescript` | `^5` | TypeScript support |
| `vitest` | `^5.0.5` | Test runner |

The four field screens use CSS Modules for their page-specific styles and shared CSS classes from `components/shared/ui.module.css`. The global design tokens and base styles are in `app/globals.css`.

## 6. Coding standards and UI conventions

### Component conventions

- Use React components for page-level screens and reusable interface elements.
- Add `"use client"` to components that need React state, effects, event handlers, or client-side navigation.
- Use the App Router's `useRouter` from `next/navigation` for in-app navigation in client components.
- Keep reusable field workflow elements in `app/(field)/_components/` and shared application elements in `components/shared/`.
- Use CSS Modules for styles scoped to a component or screen.

### State updates

Update nested draft data immutably. The existing screens use functional state updates so that each update is based on the latest draft:

```jsx
const set = (key, value) =>
  setDraft((current) => ({ ...current, [key]: value }));
```

For equipment changes, create a new array rather than mutating the existing one:

```jsx
const setEquipment = (list) =>
  setDraft((current) => ({ ...current, equipment: list }));
```

### Visual styling

The global stylesheet defines the GridFit palette, typography, spacing-related tokens, border radii, and focus treatment. Prefer these existing CSS variables and shared classes over introducing unrelated colours or one-off styling values.

The current global fonts are Afacad for body text and Alumni Sans for headings. The main brand purple is `#46317C`; orange is used for emphasis and status feedback.

### Accessibility

- Give icon-only buttons an accessible name using `aria-label`.
- Keep visible labels associated with form controls.
- Preserve keyboard-visible focus styling (`:focus-visible`) from `app/globals.css`.
- Use button elements for actions and links for navigation.
- Ensure disabled actions are actually disabled when the underlying operation is unavailable.

## 7. The four field screens

### Field Home

**Route:** `/field/home`

**Source:** `app/(field)/field/home/page.js`

The Field Home screen presents the field agent's starting point. It reads field-agent and visit information from the shared store and the data module. It displays the agent greeting, visit information, meter-related counts, and notifications. The screen also provides the entry point for starting a new business record.

The `startNew` handler resets the shared draft to `EMPTY_DRAFT`, selects an available meter from the current meter list when possible, and navigates to `/field/log`.

The home page currently depends on seeded application data such as `FIELD_AGENT`, `TODAY_VISITS`, and `NOTIFICATIONS` from `lib/data.js`. Do not describe these dashboard values as live backend data unless the integration is implemented and verified.

### Log a Business — step 1

**Route:** `/field/log`

**Source:** `app/(field)/field/log/page.js`

This screen collects the business profile information, including its name, owner, phone number, type, site, operating days and hours, landmark, and power sources.

The page requests the available mini-grid sites from `/api/backend/sites`. It keeps a local loading state while the request is in progress and stores any returned error in the page's `errors` state. When the available sites load, the current draft site is retained if it is still valid; otherwise the first available site is selected.

Before moving to the equipment screen, the page validates the required business name, owner name, operating days, opening and closing times, and selected site. The owner field requires at least two name parts. The screen does not move forward when validation errors exist.

A representative validation excerpt from the current implementation is:

```jsx
const next = () => {
  const n = {};
  const ownerParts = draft.owner.trim().split(/\s+/).filter(Boolean);

  if (!draft.name.trim()) n.name = "Add the business name";
  if (ownerParts.length < 2)
    n.owner = "Enter the owner's first and last name";
  if (!draft.days.some(Boolean)) n.days = "Pick at least one day they open";
  if (draft.opens >= draft.closes)
    n.hours = "Closing time must be after opening time";
  if (sitesLoading) n.sites = "Please wait while sites are loading";
  if (!sitesLoading && !sites.some((site) => site.site_id === draft.site))
    n.sites = "Select an available mini-grid site";

  setErrors(n);

  if (Object.keys(n).length) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  router.push("/field/log/equipment");
};
```

### Equipment List — step 2

**Route:** `/field/log/equipment`

**Source:** `app/(field)/field/log/equipment/page.js`

The Equipment screen allows the field agent to record the appliances used by the business. It supports quantity adjustments, quick-add equipment options, and a custom equipment entry. Each equipment item contains a name, wattage, quantity, metering preference, and optional tag.

The screen calculates an estimated connected load in kilowatts. The calculation is performed by `estimateKw` in `app/(field)/_components/channels.js`:

```jsx
export function estimateKw(equipment) {
  return equipment.reduce((sum, item) => sum + item.qty * item.watts, 0) / 1000;
}
```

The same helper assigns metered equipment to a maximum of four channels. Items marked as not metered are excluded from channel allocation. When the agent continues, the page checks that at least one equipment item exists and that at least one item is selected for metering. It then navigates to `/field/log/meter`.

### Install Meter — step 3

**Route:** `/field/log/meter`

**Source:** `app/(field)/field/log/meter/page.js`

The meter screen displays the selected meter identifier, channel assignments, channel checks, and a short installation checklist.

**Important implementation status:** this screen is currently a demonstration, not a completed physical meter integration. The voltage and frequency values are generated locally at intervals. The rescan action displays a demo-mode message, and the start-metering action is disabled. The code explicitly states that a registered physical device must be assigned before metering can start.

The simulated readings are updated by a client-side interval:

```jsx
useEffect(() => {
  const id = setInterval(() => {
    setReading({
      v: 226 + Math.round(Math.random() * 4),
      hz: +(49.9 + Math.random() * 0.2).toFixed(1),
    });
  }, 2500);

  return () => clearInterval(id);
}, []);
```

Do not present these values as readings from a connected meter. A real device assignment and telemetry integration are still required before this screen can start a live metering session.

## 8. API integration

### Backend proxy route

`app/api/backend/[...path]/route.js` provides a Next.js server route that forwards requests to the configured backend. It reads `BACKEND_URL`, forwards the requested path and query string, and returns the backend response to the browser.

The proxy also checks for the `techara_access_token` cookie and uses it as a Bearer token when present. If the cookie is not present, it forwards an incoming Authorization header when supplied.

A shortened excerpt showing the backend configuration guard and URL construction is:

```js
const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  return NextResponse.json(
    { detail: "BACKEND_URL is not configured" },
    { status: 500 },
  );
}

const incomingUrl = new URL(request.url);
const targetUrl = new URL(
  `${path.join("/")}${incomingUrl.search}`,
  `${backendUrl.replace(/\/+$/, "")}/`,
);
```

The route exports handlers for `GET`, `POST`, `PATCH`, and `DELETE`.

### Field workflow integration boundary

In the supplied field workflow, the business form fetches site data from `/api/backend/sites`. The equipment step updates the in-memory draft. The meter screen displays simulated readings and does not complete a real device assignment.

The repository also contains browser-side API helpers in `lib/api.js` and `lib/api.ts`, and meter-related functions in `lib/meters.ts`. Their existence should not be confused with proof that the four screens call those functions. In the supplied source, the field logging pages shown here use the proxy for site loading and local state for equipment and meter demonstration behavior.

### Current integration considerations

The archive contains both `lib/api.js` and `lib/api.ts`, with different base-URL defaults and error-handling implementations. Before extending API integration, confirm which helper is intended for the feature and avoid introducing a third competing request pattern.

## 9. Security expectations

- Keep backend credentials and private configuration in untracked environment files or deployment secrets.
- Do not expose server-only backend URLs or credentials through `NEXT_PUBLIC_` variables.
- Validate user input before advancing or submitting a form.
- Treat all backend responses as untrusted input and handle error responses explicitly.
- Keep authentication and authorization enforcement on the backend. Hiding a frontend control is not a substitute for a backend permission check.
- The login route stores the access token in an `httpOnly` cookie. Do not change the cookie security settings without reviewing the authentication design with the team.
- Do not log access tokens, passwords, or sensitive business-owner information.

The backend proxy's token forwarding and the login route's cookie behavior should be reviewed together when changing authentication. The field workflow documentation does not imply that the frontend itself is the authority for user permissions.

## 10. Testing workflow

The package scripts provide linting, formatting checks, Vitest execution, and a production build:

```bash
npm run format:check
npm run lint
npm test
npm run build
```

The supplied GitHub Actions workflow, `.github/workflows/ci.yaml`, runs these checks using a self-hosted runner labelled `classroom-ci`. It configures Node.js 22, installs dependencies with `npm ci`, and then runs formatting, lint, tests, and build.

The current archive contains no test files. Before treating the field workflow as covered by automated tests, add tests for the behavior that matters, including:

- Required business details and invalid operating hours
- Site-loading success, empty results, and backend errors
- Equipment quantity changes and custom equipment validation
- Channel allocation and the four-channel limit
- The disabled meter-start state while physical device assignment is unavailable

Manual checks should also cover narrow mobile viewports, keyboard navigation, visible validation messages, and navigation back and forth between the three logging steps.

## 11. Deployment and environment controls

The application is built with Next.js:

```bash
npm run build
npm run start
```

Set the production `BACKEND_URL` in the deployment environment so the server-side proxy and login route can reach the backend. Set `NEXT_PUBLIC_API_URL` only where the browser-side API helper is intentionally used and its public base URL is appropriate.

The supplied `next.config.ts` defines redirects from `/` to `/splash` and from `/dashboard` to `/dashboard/overview`. It also defines a `/backend/:path*` rewrite to a local backend address. Review this rewrite before production deployment; the local address is a development-oriented default and should not be assumed to be the production backend.

The CI workflow is configured for the repository's self-hosted classroom runner. Do not change the runner configuration as part of ordinary frontend feature work without approval from the team or trainer.

## 12. Troubleshooting

| Problem | What to check |
|---|---|
| Site list does not load on the business form | Confirm the backend is running, `BACKEND_URL` is configured, and the backend exposes the expected `/sites` endpoint |
| Proxy returns `BACKEND_URL is not configured` | Add the correct server-side `BACKEND_URL` to the local environment and restart the dev server |
| Browser cannot reach the backend | Check the backend process, configured URL, network access, and browser/server console output |
| Draft information disappears after refresh | The current provider stores the draft in React state; refresh persistence is not implemented in the supplied code |
| Meter values keep changing but no physical device is detected | This is the documented demo behavior of the current Install Meter screen |
| Meter start button is unavailable | The current code disables it until registered physical device assignment is integrated |
| Formatting check fails | Run `npm run format` on the intended files, inspect the diff, and rerun `npm run format:check` |
| Lint or build fails | Read the first reported source error, fix the underlying issue, and rerun the failed command |

## 13. Definition of done

A field workflow change is ready for review when:

- The change stays within the agreed screen and feature scope.
- Existing shared components and design tokens are reused where appropriate.
- Draft state is updated immutably and remains consistent across the relevant screens.
- Required inputs and error states are handled.
- Navigation and back actions work at mobile sizes.
- No demo behavior is described or presented as a live backend or physical-device integration.
- `npm run format:check`, `npm run lint`, `npm test`, and `npm run build` have been run, and their actual results are reported accurately.
- Any API or authentication change has been coordinated with the backend owners.
- The pull request explains the change and includes relevant screenshots for UI changes.

## Summary

The GridFit field frontend is built with Next.js App Router and React. The Field Home screen opens the business-logging experience, while the three logging screens share one in-memory draft through the application provider. The business form loads available sites through the backend proxy; the equipment screen calculates estimated load and assigns up to four meter channels; and the Install Meter screen currently demonstrates simulated readings without starting a live metering session.

This documentation reflects the supplied frontend source archive. Revisit the integration and testing sections as the backend and physical meter workflows are completed.
