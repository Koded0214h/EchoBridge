# EchoBridge — Full Code Audit

_Generated 2026-04-27. Read top to bottom; items are ordered by priority within each section._

---

## CRITICAL SECURITY — Fix Before Anything Else

These need to be resolved before the app is accessible to any external user.

| # | Issue | File | Action |
|---|-------|------|--------|
| 1 | **Neon DB credentials in `.env`** committed to repo | `backend/.env` | Rotate credentials in Neon dashboard immediately. Add `.env` to `.gitignore` if not already. Create `.env.example` with placeholder values. |
| 2 | **Hardcoded `SECRET_KEY`** marked "insecure" | `backend/backend/settings.py:26` | Replace with `SECRET_KEY = os.environ['SECRET_KEY']`. Generate a fresh key with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` and store in `.env`. |
| 3 | **`DEBUG = True` hardcoded** | `settings.py:29` | Change to `DEBUG = os.getenv('DEBUG', 'False') == 'True'` |
| 4 | **`ALLOWED_HOSTS = ["*"]`** | `settings.py:31` | Change to `ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')` |
| 5 | **`CORS_ALLOW_ALL_ORIGINS = True`** | `settings.py:63` | Remove this line and use `CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',')` |

---

## Backend Issues

### Settings & Config (`backend/backend/settings.py`)

- `SPECTACULAR_SETTINGS` defined **twice** (lines ~84-88 and ~105-110) — second block silently overwrites the first. Deduplicate.
- No logging configuration — add `LOGGING` dict to catch request errors.
- No rate limiting — `MatchQueryView` is an unauthenticated POST that does full table scans. Add `django-ratelimit` or throttle via DRF.
- OpenAPI docs (`/api/docs/`, `/api/redoc/`) exposed publicly with no auth — disable in production or guard with `permission_classes = [IsAdminUser]`.
- No HTTPS enforcement (`SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`) configured for prod.

### Models (`backend/resources/models.py`)

- No `created_at` / `updated_at` timestamps on either model.
- `Category` has no `__str__` method.
- `Resource` `keywords` field is a raw `TextField` with comma-separated values — this makes keyword search slow and brittle. Either create a `Keyword` model with FK, or switch to `django.contrib.postgres.fields.ArrayField`.
- `slug` on `Category` has no auto-generation; needs to be manually set or a `pre_save` signal added.
- `audio_fallback_text` is `blank=True` — if empty, responses have no fallback text. Should default to `description` if not provided.
- No soft delete support — consider `is_active` boolean instead of permanently removing records.

### API Views (`backend/resources/views.py`, `interactions/views.py`)

- **`MatchQueryView` performance**: `Resource.objects.all()` fetches the entire table into memory on every request. Filter at the DB level or add a full-text search index.
- No pagination on `ResourceList` or the nested resources inside `CategoryList` — large datasets will break.
- `findall(r'\w+', query)` recompiles the regex every request — compile it once at module level.
- `MatchQueryView` returns only the first match regardless of relevance score — should rank and return top-N.
- No max-length validation on the `query` field — a 10MB string will hit the matching logic.
- No API versioning (no `/api/v1/` prefix) — harder to evolve the API without breaking clients.

### Serializers (`backend/resources/serializers.py`)

- `keywords` field excluded from `ResourceSerializer` response — frontend can't display or filter on keywords. Decide whether to expose it.
- `CategorySerializer` nests all resources inline — for large resource sets this produces massive JSON. Add pagination or use a link relation instead.

### Seed Command (`backend/resources/management/commands/seed_resources.py`)

- Keywords stored with inconsistent spacing (`"lonely, alone"` vs `"lonely,alone"`) — normalize before saving.
- `get_or_create` on `title` (not slug) — title collisions silently fail to update existing records.
- Only 5 resources — fine for dev, but needs a clear story for adding production data.

### Tests

- Backend: 2 tests total, no edge cases, no error conditions, no auth tests.
- `interactions/tests.py:17` uses hardcoded URL `/api/match/` — use `reverse('match-query')` instead.
- Frontend: **zero tests** — no vitest/jest config, no test files.
- Add at minimum: empty-query test, no-match fallback test, category list response shape test.

### Dependencies (`backend/requirements.txt`)

- File appears to include all transitive deps (100+ packages) — regenerate from a clean virtualenv with only direct deps.
- Packages that appear unused: `beautifulsoup4`, `selenium`, `openai`, `anthropic`, `firebase` — remove or document why they're there.
- Root-level `requirements.txt` is a duplicate of `backend/requirements.txt` — pick one location.
- No dev-specific deps separated (`pytest-django`, `factory-boy`) — consider `requirements-dev.txt`.

---

## Frontend Issues

### Routing (`frontend/src/App.jsx`)

- Manual routing with `history.pushState` and a `Set` of known routes (line ~16-30) is fragile — use React Router (or TanStack Router).
  - Back/forward navigation can break.
  - No route-level code splitting possible.
  - Deeply nested navigation becomes unmaintainable.

### App.jsx Architecture

- `App.jsx` is **835 lines** and does routing, state, onboarding, settings, resources, and voice — split into separate page files under `src/pages/`.
- `SplashScreen` auto-advances after 4s with no clear UX indicator — add a visible progress bar or countdown.
- `OnboardingPrompt` text area not inside a `<form>` element — breaks default browser form behavior and submit-on-Enter.
- `findBestResource()` call in `HomePage` uses a 180ms `setTimeout` as a fake loading state — remove the artificial delay or replace with real async logic.

### State & Storage (`frontend/src/context/AppContext.jsx`)

- `readBooleanStorage` uses `=== 'true'` string comparison — fails if a non-string boolean was stored. Use `JSON.parse`.
- No debouncing on preference persistence — every preference toggle triggers a localStorage write. Debounce by 300ms.
- `onboardingSeen` stored in `sessionStorage` — user sees onboarding again in every new tab. Confirm this is intentional or switch to localStorage.
- Default `setResponseCache: () => undefined` in context initial value — if `Provider` is forgotten, cache silently does nothing. Throw an error in the default instead.
- No error boundaries — a crash in any page component unmounts the whole app with no recovery UI.

### Audio Service (`frontend/src/services/audioService.js`)

- **Voice loading race condition** (line ~37-54): 300ms timeout is arbitrary — some browsers fire `voiceschanged` multiple times; listener is never removed after timeout (memory leak). Use a one-shot listener with `{ once: true }`.
- `speak()` calls `speechSynthesis.cancel()` before speaking with no warning — if two `speak()` calls race, the second silently cancels the first.
- `onerror` handler can call `reject()` twice if the error event fires twice — wrap in a flag.
- No timeout if speech stalls — `speak()` can hang indefinitely. Add a `setTimeout` fallback.
- Welcome/onboarding strings hardcoded in service (line ~116-122) — extract to constants or a strings file for easier editing.
- `maxAlternatives: 1` on speech recognition — won't retry on ambiguous input.
- No confidence score check on STT results — low-confidence transcripts can produce wrong matches.

### VoiceInputButton Component (`frontend/src/components/VoiceInputButton.jsx`)

- 10-second silence timeout (line ~70-75) is hardcoded — should be a prop with a sensible default so different screens can configure it.
- The timeout doesn't actually detect silence — it fires regardless. If user is still speaking at 9s, recognition stops anyway. Use SpeechRecognition's native end event instead.
- 150ms hardcoded delay before `onTranscript` fires (line ~90-93) — unclear purpose, remove or document.
- Error message for `not-allowed` is generic — should say "Please allow microphone access in your browser settings."
- Missing error codes: `network-error`, `audio-capture`, `service-not-allowed`.
- Listening state icon is `◌` (Unicode circle) — unintuitive; use an animated mic icon or ripple effect.

### ResourceModal Component (`frontend/src/components/ResourceModal.jsx`)

- Focuses close button on open (line ~6-7) — convention is to focus the first interactive content element (e.g., the "Read aloud" button) so screen reader users hear the resource immediately.
- `<dt>/<dd>` pairs wrapped in `<div>` inside `<dl>` (line ~41-50) — breaks definition list semantics. Remove the wrapping `<div>` or use CSS grid on the `<dl>` directly.

### Resources Data (`frontend/src/data/resources.js`)

- Resources hardcoded in a JS file — adding or editing requires a code deploy. Should be fetched from the backend API.
- `findBestResource()` keyword matching has no stemming, no fuzzy match, no synonym support — "loneliness" won't match the keyword "lonely". Consider a simple edit-distance threshold.
- Splitting on `/[^a-z0-9]+/` turns "can't" into `["can", "t"]` — add an apostrophe contraction pass before tokenizing.
- `contact` numbers hardcoded in data file — cannot update hotline numbers without a deploy.

### CSS (`frontend/src/App.css`, `frontend/src/index.css`)

- `#ffd700` (gold accent) appears 10+ times in raw hex — move to the existing `--accent` CSS variable.
- Transition shorthand duplicated across 5+ selectors — extract to a utility class or CSS variable.
- `--shadow` (line ~28) inconsistently applied — some elements use it, some have custom shadows.
- Pulse animation on voice button (line ~378) has no `prefers-reduced-motion` guard — all other transitions are guarded but this one is missed.
- `100svh` used without a `100vh` fallback — breaks on browsers that don't support `svh` units (Safari < 15.4).
- Root background uses two radial + one linear gradient — heavy on mobile GPU. Simplify or use `will-change: transform` hint.
- `font-synthesis: none` (index.css line ~10) prevents bold/italic synthesis — if system fonts lack bold variants, text will appear the same weight everywhere.
- Text-size "extra large" tops out at 20px — may still be too small for users with severe vision loss. Consider 24px as the top step.

### Build & Tooling (`frontend/vite.config.js`, `package.json`)

- No API proxy in Vite config — frontend makes raw cross-origin requests to Django. Add `server.proxy` so dev uses the same origin and CORS isn't needed in dev.
- No code splitting — entire app in one JS bundle. Add `import()` lazy loading per route.
- No `.env` for API base URL — URL is presumably hardcoded somewhere (or defaulting). Add `VITE_API_BASE_URL` env var.
- No TypeScript — props aren't validated at build time. At minimum add PropTypes or migrate to TS.
- `scan:a11y` npm script will fail if app isn't already running — document or wire it into a dev startup script.
- No test runner configured (`vitest`, `@testing-library/react`) — add before writing any tests.
- Vite 8.0.10 listed but Vite 5.x is current stable — check version alignment (could be a typo in package.json).

### `index.html`

- No Open Graph meta tags — link previews on Slack/WhatsApp/Twitter will be blank.
- Missing `<meta name="description">` content.
- `theme-color` hardcoded to `#0a0a0a` — fine, but should match CSS variable.

---

## Infrastructure & DevOps

- No Docker or docker-compose — new contributors have to manually set up Python + Node environments.
- No CI/CD pipeline (no GitHub Actions, no Vercel config, no fly.toml) — every deploy is manual.
- No `.env.example` files for backend or frontend — new contributors don't know what env vars are required.
- No staging environment — changes go straight from dev to prod.
- Django migrations not committed (possibly in `.gitignore`) — running on a fresh DB won't create tables without them. Commit migrations.
- No database backup strategy for Neon.
- `quick.sh` is a single curl test — not a useful dev or deploy script.

---

## UI / UX Improvements (Separate Pass)

These are design-level improvements beyond bug fixes. Since you're planning a UI refresh, use this as a checklist.

1. **Splash screen** — Add a visible progress indicator (animated arc, fill bar) so user knows it will advance. Give a "Skip" button for returning users.
2. **Voice input feedback** — Replace the `◌` icon with an animated waveform or pulsing mic ring during recognition. Color-code states: idle (grey), listening (green), processing (amber), error (red).
3. **Voice timeout** — Let the 10s silence timer reset when the user starts speaking. Show a countdown.
4. **Onboarding** — Add a "skip" option for users who don't want guided onboarding.
5. **Home page response** — When a resource is matched, show more than just the title. Show description + contact in-line before the modal.
6. **Resource grid** — Add a text search filter bar above the grid. Cards with no hover state look flat — add subtle lift/border on hover for sighted users.
7. **Settings** — Replace high-contrast `<select>` with two radio buttons ("System" / "Force on"). Add a "Reset to defaults" button.
8. **Error states** — When TTS fails, show an inline banner with a "Retry" button, not just a silent fallback.
9. **Loading states** — Voice processing and API calls need a visual loading indicator (spinner or skeleton) so users don't think the app is frozen.
10. **404 page** — Currently renders a plain message; style it consistently and add a "Go home" link.
11. **Mobile keyboard** — When the text input is focused on mobile, the `<textarea>` should not jump behind the virtual keyboard. Use `visualViewport` API or CSS `env(keyboard-inset-height)`.
12. **Typography hierarchy** — The heading scale could be bolder/larger at the top level to create clearer visual priority.
13. **Animation coherence** — Standardize easing curves (`ease-out` for enters, `ease-in` for exits) across all transitions. Currently some elements use `ease`, some `ease-out`.

---

## Missing vs. PRD

| Feature | Status |
|---------|--------|
| Splash + welcome TTS | ✅ Done |
| Onboarding (voice + type) | ✅ Done |
| Keyword matching | ✅ Done (client-side) |
| TTS responses | ✅ Done |
| Resource browsing | ✅ Done |
| Accessibility (ARIA, contrast, motion) | ✅ Mostly done |
| Full keyboard navigation | ⚠️ Partial |
| WCAG 2.1 AA audit | ❌ Not done |
| Backend API integration (resources from DB) | ❌ Frontend still uses hardcoded data |
| Authentication (Phase 2) | ❌ Not started |
| AI interpretation (Phase 2) | ❌ Not started |
| Offline PWA (Phase 2) | ❌ Not started |
| Multi-language (Phase 2) | ❌ Not started |

---

## Suggested Priority Order

### This week
1. Rotate Neon credentials + move all secrets to `.env`
2. Fix `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
3. Wire frontend to backend API (remove hardcoded `resources.js`)
4. Split `App.jsx` into page components
5. Add React Router

### Next sprint
6. Add pagination to resource endpoints
7. Replace comma-separated keywords with proper DB field
8. Add rate limiting to `MatchQueryView`
9. Write 10+ backend tests + set up vitest for frontend
10. Add Vite API proxy + `VITE_API_BASE_URL`

### UI refresh (separate branch)
11. Voice input animated feedback
12. Splash progress indicator
13. Home response card redesign
14. Settings radio buttons for high contrast
15. Error state banners
