# Prompt Vault Pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, publish, and deploy the production Prompt Vault Pro MVP described in the approved design.

**Architecture:** A React + Vite + TypeScript single-page application talks directly to Supabase through a typed data layer. Supabase owns authentication, PostgreSQL data, transactional versioning, Row Level Security, full-text search, and private file storage; domain-focused React features own the user experience. Work is performed in an isolated Git worktree so existing uncommitted Lead Atlas changes remain untouched.

**Tech Stack:** React 19, Vite, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Supabase JS, Recharts, Mammoth, Papa Parse, docx, jsPDF, Vitest, Testing Library, Playwright, GitHub, Vercel

---

## Delivery Milestones

1. **Foundation:** scaffold, design system, Supabase schema, authentication, and protected shell.
2. **Core Vault:** prompt CRUD, versions, library search, folders, tags, favorites, ratings, templates, and usage.
3. **Advanced Tools:** imports, exports, attachments, analytics, themes, plan limits, and resilient states.
4. **Release:** security verification, responsive/browser QA, GitHub publication, and Vercel deployment.

## File Structure

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  components/
    ui/
  features/
    analytics/
    auth/
    exports/
    folders/
    imports/
    prompts/
    settings/
    templates/
  lib/
    env.ts
    query-client.ts
    supabase.ts
  styles/
    globals.css
    tokens.css
  test/
    render.tsx
    setup.ts
  types/
    database.ts
supabase/
  config.toml
  migrations/
  seed.sql
tests/
  e2e/
```

Each feature owns its queries, mutations, validation, components, and tests. Shared controls contain no Supabase knowledge.

### Task 1: Isolate Work And Scaffold The Application

**Files:**
- Create: `.worktrees/prompt-vault-pro/`
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/test/setup.ts`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create an isolated worktree**

Run:

```bash
git worktree add .worktrees/prompt-vault-pro -b codex/prompt-vault-pro main
```

Expected: a clean worktree on `codex/prompt-vault-pro`. Do not copy or revert the current uncommitted Lead Atlas files.

- [ ] **Step 2: Remove the historical product surface inside the isolated worktree**

Run:

```bash
git rm -r api assets app.js index.html styles.css verification-screenshot.png README.md
```

Expected: only the old committed product files are removed on `codex/prompt-vault-pro`. The original working directory and its uncommitted Lead Atlas files remain unchanged.

- [ ] **Step 3: Initialize the React toolchain**

Run:

```bash
npm init -y
npm install react react-dom @hookform/resolvers @supabase/supabase-js \
  @tanstack/react-query date-fns diff docx jspdf lucide-react mammoth \
  papaparse react-hook-form react-router-dom recharts zod
npm install -D @eslint/js @playwright/test @testing-library/jest-dom \
  @testing-library/react @testing-library/user-event @types/node \
  @types/papaparse @types/react @types/react-dom @vitejs/plugin-react \
  eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals \
  jsdom typescript typescript-eslint vite vitest
npm pkg set type=module
npm pkg set scripts.dev=vite
npm pkg set scripts.build=\"tsc -b && vite build\"
npm pkg set scripts.lint=eslint
npm pkg set scripts.test=vitest
npm pkg set scripts.preview=\"vite preview\"
```

- [ ] **Step 4: Add a failing application smoke test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders the Prompt Vault product name", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "Prompt Vault Pro" })).toBeVisible();
});
```

- [ ] **Step 5: Configure Vite, TypeScript, and Vitest**

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Create `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true
  },
  "include": ["vite.config.ts"]
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#176b54" />
    <title>Prompt Vault Pro</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Add to `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Run: `npm test -- --run src/app/App.test.tsx`

Expected: FAIL because `App` does not yet render the required heading.

- [ ] **Step 6: Implement the minimal application shell**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main>
      <h1>Prompt Vault Pro</h1>
    </main>
  );
}
```

Create `.env.example`:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- [ ] **Step 7: Verify and commit**

Run:

```bash
npm test -- --run
npm run build
git add .
git commit -m "chore: scaffold Prompt Vault Pro"
```

Expected: tests and production build pass.

### Task 2: Build The Editorial Green Design System

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/globals.css`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/LoadingState.tsx`
- Create: `src/components/ui/ToastProvider.tsx`
- Test: `src/components/ui/Button.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write the failing button accessibility test**

```tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

test("disables actions while loading", () => {
  render(<Button loading>Save prompt</Button>);
  expect(screen.getByRole("button", { name: "Save prompt" })).toBeDisabled();
});
```

Run: `npm test -- --run src/components/ui/Button.test.tsx`

Expected: FAIL because `Button` does not exist.

- [ ] **Step 2: Define the approved visual tokens**

Create `src/styles/tokens.css` with:

```css
:root {
  color-scheme: light;
  --background: #f0eee8;
  --surface: #fbfaf7;
  --surface-strong: #ffffff;
  --text: #282720;
  --muted: #716f66;
  --border: #dedbd2;
  --primary: #176b54;
  --primary-hover: #115743;
  --danger: #b42318;
  --radius-sm: 6px;
  --radius-md: 10px;
  --shadow-sm: 0 8px 24px rgb(48 42 29 / 8%);
}

[data-theme="dark"] {
  color-scheme: dark;
  --background: #191b18;
  --surface: #20231f;
  --surface-strong: #282c27;
  --text: #f2f0e9;
  --muted: #aaa99f;
  --border: #383d37;
  --primary: #62b99c;
  --primary-hover: #79c7ad;
}
```

Use a readable system-serif stack for headings and system sans-serif for controls/body. Define focus rings, reduced motion, mobile breakpoints, and minimum 44px touch targets in `globals.css`.

- [ ] **Step 3: Implement shared controls and states**

Implement `Button`, `Input`, `EmptyState`, `LoadingState`, and a small context-based toast system. `Button` must forward native button props, expose `variant`, and set `disabled={disabled || loading}`.

- [ ] **Step 4: Verify responsive primitives**

Run:

```bash
npm test -- --run src/components/ui
npm run build
```

Expected: PASS with no TypeScript or accessibility errors.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add editorial green design system"
```

### Task 3: Create The Supabase Schema, Search, Versions, And RLS

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/<generated>_prompt_vault_core.sql`
- Create: `supabase/seed.sql`
- Create: `src/types/database.ts`
- Create: `src/lib/env.ts`
- Create: `src/lib/supabase.ts`
- Test: `src/lib/env.test.ts`

- [ ] **Step 1: Verify current Supabase CLI commands**

Run:

```bash
supabase --help
supabase migration --help
supabase db --help
```

If the CLI is absent, install the current project-local CLI with `npm install -D supabase`, then use `npx supabase`.

- [ ] **Step 2: Write the failing environment validation test**

```ts
import { readEnv } from "./env";

test("rejects missing Supabase configuration", () => {
  expect(() => readEnv({})).toThrow("VITE_SUPABASE_URL");
});
```

Run: `npm test -- --run src/lib/env.test.ts`

Expected: FAIL because `readEnv` does not exist.

- [ ] **Step 3: Initialize Supabase and generate the migration name**

Run:

```bash
npx supabase init
npx supabase migration new prompt_vault_core
```

Use the generated migration filename. Do not invent a timestamp.

- [ ] **Step 4: Implement the core schema**

The migration must:

- create enums for `account_plan`, `prompt_status`, and subscription status;
- create `profiles`, `prompts`, `prompt_versions`, `tags`, `prompt_tags`, `folders`, `prompt_folders`, `prompt_usage`, `templates`, `prompt_files`, and `subscriptions`;
- use UUID primary keys and timezone-aware timestamps;
- add unique constraints for `(user_id, lower(tag.name))`, `(user_id, lower(folder_name))`, prompt mappings, and `(prompt_id, version_number)`;
- add indexes for ownership, recency, favorites, status, rating, category, platform, and GIN search;
- enable RLS on every public table;
- grant only required Data API access to `authenticated`;
- create ownership policies based on `(select auth.uid())`;
- allow authenticated users to read system templates while preventing client writes;
- create a private `prompt-files` bucket and user-prefix storage policies.

Use a transactional prompt write function:

```sql
create or replace function public.save_prompt(
  p_id uuid,
  p_title text,
  p_description text,
  p_prompt_text text,
  p_category text,
  p_ai_platform text,
  p_rating smallint,
  p_favorite boolean,
  p_status public.prompt_status,
  p_change_notes text default null
) returns public.prompts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_prompt public.prompts;
  v_existing public.prompts;
  v_next_version integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_id is null then
    insert into public.prompts (
      user_id, title, description, prompt_text, category, ai_platform,
      rating, favorite, status
    ) values (
      auth.uid(), p_title, p_description, p_prompt_text, p_category,
      p_ai_platform, p_rating, p_favorite, p_status
    )
    returning * into v_prompt;

    insert into public.prompt_versions (
      prompt_id, version_number, prompt_text, change_notes, created_by
    ) values (
      v_prompt.id, 1, v_prompt.prompt_text,
      coalesce(nullif(p_change_notes, ''), 'Initial version'), auth.uid()
    );
  else
    select *
    into v_existing
    from public.prompts
    where id = p_id and user_id = auth.uid()
    for update;

    if not found then
      raise exception 'Prompt not found';
    end if;

    update public.prompts
    set title = p_title,
        description = p_description,
        prompt_text = p_prompt_text,
        category = p_category,
        ai_platform = p_ai_platform,
        rating = p_rating,
        favorite = p_favorite,
        status = p_status,
        updated_at = now()
    where id = p_id
    returning * into v_prompt;

    if v_existing.prompt_text is distinct from p_prompt_text then
      select coalesce(max(version_number), 0) + 1
      into v_next_version
      from public.prompt_versions
      where prompt_id = p_id;

      insert into public.prompt_versions (
        prompt_id, version_number, prompt_text, change_notes, created_by
      ) values (
        p_id, v_next_version, p_prompt_text,
        nullif(p_change_notes, ''), auth.uid()
      );
    end if;
  end if;

  return v_prompt;
end;
$$;
```

Add a `search_prompts` security-invoker function with typed keyword, category, platform, minimum rating, favorite, status, date, sort, limit, and offset parameters. Its query must begin with `where p.user_id = auth.uid()`, use `p.search_document @@ websearch_to_tsquery('english', p_query)` when a query is present, apply tag matching through an owned `prompt_tags`/`tags` `exists` clause, use a whitelist `case` expression for sorting, and return `count(*) over () as total_count`.

- [ ] **Step 5: Add deterministic starter templates**

Seed the nine approved templates with `owner_id = null` and `is_system = true`. Use idempotent inserts keyed by stable UUIDs.

- [ ] **Step 6: Start local Supabase and verify security**

Run:

```bash
npx supabase start
npx supabase db reset
npx supabase gen types typescript --local > src/types/database.ts
```

Verify with SQL or integration requests:

- user A can CRUD user A prompts;
- user B cannot select, update, or delete user A prompts;
- editing creates exactly one new version;
- no-op edits create no version;
- rollback creates a new current version;
- system templates are readable and not writable;
- storage paths cannot cross user prefixes.

- [ ] **Step 7: Implement the typed client**

`src/lib/env.ts` validates URL and publishable key with Zod. `src/lib/supabase.ts` creates one `SupabaseClient<Database>`. Never include a service-role key.

- [ ] **Step 8: Run advisors and commit**

Run the locally available advisor command discovered through `--help`, fix all security findings, then:

```bash
npm test -- --run
git add supabase src/types src/lib
git commit -m "feat: add secure Supabase data model"
```

### Task 4: Implement Authentication And The Protected App Shell

**Files:**
- Create: `src/app/providers.tsx`
- Create: `src/app/router.tsx`
- Create: `src/features/auth/AuthProvider.tsx`
- Create: `src/features/auth/AuthPage.tsx`
- Create: `src/features/auth/ProtectedRoute.tsx`
- Create: `src/features/auth/auth-schema.ts`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/MobileNavigation.tsx`
- Test: `src/features/auth/AuthPage.test.tsx`

- [ ] **Step 1: Write failing authentication form tests**

Test that:

- invalid email is rejected;
- password shorter than 8 characters is rejected;
- submit calls email sign-in;
- Google button calls `signInWithOAuth({ provider: "google" })`;
- protected content redirects unauthenticated users.

Run: `npm test -- --run src/features/auth`

Expected: FAIL because authentication components do not exist.

- [ ] **Step 2: Implement session ownership**

`AuthProvider` must subscribe to `onAuthStateChange`, expose `session`, `user`, `loading`, and `signOut`, and unsubscribe on unmount. Do not use editable user metadata for authorization.

- [ ] **Step 3: Implement login and registration**

Use one accessible page with email/password modes and Google login. Display Supabase errors inline and preserve the entered email. OAuth redirect target comes from `window.location.origin`.

- [ ] **Step 4: Implement the protected Knowledge Library shell**

Desktop sidebar navigation:

```text
Library
Favorites
Templates
Analytics
Folders
Settings
```

Mobile uses a compact header and drawer/bottom navigation. Include search and New Prompt affordances without rendering unfinished Projects, Workflows, or Marketplace links.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- --run
npm run build
git add src
git commit -m "feat: add authentication and app shell"
```

### Task 5: Implement Prompt CRUD, Validation, And Local Draft Recovery

**Files:**
- Create: `src/features/prompts/prompt-schema.ts`
- Create: `src/features/prompts/prompt-api.ts`
- Create: `src/features/prompts/prompt-keys.ts`
- Create: `src/features/prompts/PromptEditor.tsx`
- Create: `src/features/prompts/PromptDetail.tsx`
- Create: `src/features/prompts/PromptActions.tsx`
- Create: `src/features/prompts/usePromptDraft.ts`
- Test: `src/features/prompts/PromptEditor.test.tsx`
- Test: `src/features/prompts/prompt-api.test.ts`

- [ ] **Step 1: Write failing prompt-domain tests**

Cover:

- title and prompt text are required;
- rating is 1-5 or null;
- create invokes `save_prompt` with `p_id = null`;
- edit invokes `save_prompt` with the current id and notes;
- duplicate clears id, versions, and usage;
- draft text survives remount until successful save.

- [ ] **Step 2: Implement the validation schema**

```ts
export const promptSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).default(""),
  promptText: z.string().trim().min(1).max(100_000),
  category: z.string().trim().min(1).max(80),
  aiPlatform: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5).nullable(),
  favorite: z.boolean(),
  status: z.enum(["active", "archived"]),
  tagIds: z.array(z.string().uuid()),
  folderIds: z.array(z.string().uuid()),
  changeNotes: z.string().trim().max(500).default(""),
});
```

- [ ] **Step 3: Implement the query and mutation layer**

All data access stays in `prompt-api.ts`. Mutations invalidate prompt detail, library, folders, and analytics query keys. Archive is reversible. Delete requires explicit confirmation and removes private files before deleting metadata.

- [ ] **Step 4: Implement the editor and detail experience**

Include every approved field, inline errors, loading states, cancel confirmation for dirty forms, successful-save toast, clipboard copy confirmation, favorite toggle, rating, duplicate, archive, and delete.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm test -- --run src/features/prompts
npm run build
git add src/features/prompts
git commit -m "feat: add prompt creation and management"
```

### Task 6: Implement Library Search, Filters, Views, And Pagination

**Files:**
- Create: `src/features/prompts/library/library-search.ts`
- Create: `src/features/prompts/library/PromptLibraryPage.tsx`
- Create: `src/features/prompts/library/LibraryToolbar.tsx`
- Create: `src/features/prompts/library/PromptGrid.tsx`
- Create: `src/features/prompts/library/PromptList.tsx`
- Create: `src/features/prompts/library/PromptCard.tsx`
- Test: `src/features/prompts/library/library-search.test.ts`
- Test: `src/features/prompts/library/PromptLibraryPage.test.tsx`

- [ ] **Step 1: Write failing URL-state tests**

Given:

```text
?q=menu&category=Restaurants&platform=Claude&rating=4&favorite=true&page=2
```

assert the parser returns typed filters and preserves them when switching grid/list view.

- [ ] **Step 2: Implement stable search state**

Debounce keyword input by 250ms. Store shareable filters in URL parameters and view preference in local storage. Reset page to 1 when filters change.

- [ ] **Step 3: Connect the search RPC**

Use a page size of 24. Render total count, active filters, clear-all, sort options, and accessible previous/next controls. Search title, description, prompt content, category, platform, and tags.

- [ ] **Step 4: Implement complete UI states**

Render distinct loading skeleton, first-use empty state, no-results state, recoverable error state, grid view, and compact list view. Quick copy and favorite controls must not accidentally open detail.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run src/features/prompts/library
npm run build
git add src/features/prompts/library
git commit -m "feat: add searchable prompt library"
```

### Task 7: Implement Versions, Folders, Tags, Favorites, And Usage

**Files:**
- Create: `src/features/prompts/versions/VersionHistory.tsx`
- Create: `src/features/prompts/versions/VersionDiff.tsx`
- Create: `src/features/prompts/versions/version-diff.ts`
- Create: `src/features/folders/folder-api.ts`
- Create: `src/features/folders/FolderManager.tsx`
- Create: `src/features/prompts/TagPicker.tsx`
- Create: `src/features/prompts/useCopyPrompt.ts`
- Test: `src/features/prompts/versions/version-diff.test.ts`
- Test: `src/features/folders/FolderManager.test.tsx`

- [ ] **Step 1: Write failing version-diff and usage tests**

Verify additions/removals are represented, identical text yields no diff, successful clipboard write increments usage, and failed clipboard write does not increment usage.

- [ ] **Step 2: Implement version history and rollback**

Use the `diff` package for word-level comparison. Desktop shows side-by-side panels; mobile shows sequential old/new panels. Rollback calls `save_prompt` with the selected version text and a generated change note.

- [ ] **Step 3: Implement folder and tag management**

Users can create, rename, recolor, and delete folders; deleting a folder removes mappings but not prompts. Tags support creation and reuse with case-insensitive uniqueness. Folder and tag selectors are keyboard accessible.

- [ ] **Step 4: Implement copy and favorites**

Clipboard success displays a toast and increments usage with a database upsert. Favorite toggles may update optimistically but must roll back on failure.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run src/features/folders src/features/prompts
npm run build
git add src/features
git commit -m "feat: add prompt organization and versions"
```

### Task 8: Implement Templates And Free/Pro Entitlements

**Files:**
- Create: `src/features/templates/template-api.ts`
- Create: `src/features/templates/TemplatesPage.tsx`
- Create: `src/features/templates/TemplatePreview.tsx`
- Create: `src/features/settings/entitlements.ts`
- Create: `src/features/settings/useEntitlements.ts`
- Test: `src/features/settings/entitlements.test.ts`
- Test: `src/features/templates/TemplatesPage.test.tsx`

- [ ] **Step 1: Write failing entitlement tests**

```ts
test("free users cannot create prompt 26", () => {
  expect(canCreatePrompt({ plan: "free", promptCount: 25 })).toBe(false);
});

test("system templates do not count toward the limit", () => {
  expect(countUserPrompts([{ isSystem: true }, { isSystem: false }])).toBe(1);
});
```

- [ ] **Step 2: Implement centralized entitlements**

One pure module defines limits and feature access. UI checks improve guidance, but the database also enforces the prompt limit to prevent direct API bypass.

- [ ] **Step 3: Implement template browsing**

Users can filter, preview, and “Use template.” That action creates an editable draft; it does not mutate the system template. Include all nine approved starters.

- [ ] **Step 4: Implement plan guidance**

Free users see current usage and clear locked-feature explanations. Do not add checkout or fake pricing flows. Pro status may be seeded manually for verification.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run src/features/templates src/features/settings
npm run build
git add src/features/templates src/features/settings supabase
git commit -m "feat: add templates and plan entitlements"
```

### Task 9: Implement Imports, Exports, And Private Attachments

**Files:**
- Create: `src/features/imports/import-types.ts`
- Create: `src/features/imports/parse-import.ts`
- Create: `src/features/imports/ImportDialog.tsx`
- Create: `src/features/exports/export-prompt.ts`
- Create: `src/features/exports/ExportMenu.tsx`
- Create: `src/features/prompts/files/file-api.ts`
- Create: `src/features/prompts/files/PromptFiles.tsx`
- Test: `src/features/imports/parse-import.test.ts`
- Test: `src/features/exports/export-prompt.test.ts`

- [ ] **Step 1: Write parser and formatter tests**

Fixtures must cover:

- plain TXT and Markdown become one prompt;
- CSV accepts documented headers and reports invalid rows;
- DOCX extracts text with Mammoth;
- Markdown and TXT escape filenames safely;
- DOCX and PDF exports contain title, metadata, and prompt content.

- [ ] **Step 2: Implement imports**

Parse files client-side, show a review table, validate every candidate with `promptSchema`, and submit valid rows through the normal prompt mutation. Default behavior is atomic: create none if any row is invalid.

- [ ] **Step 3: Implement exports**

TXT and Markdown use Blob downloads, DOCX uses `docx`, and PDF uses `jsPDF`. Filenames follow `<sanitized-title>-<yyyy-mm-dd>.<ext>`.

- [ ] **Step 4: Implement attachments**

Allow PDF, DOCX, TXT, Markdown, CSV, PNG, and JPEG up to 10 MB per file. Upload to `<user-id>/<prompt-id>/<uuid>-<filename>`, then insert metadata. Downloads use signed URLs that expire after 60 seconds.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run src/features/imports src/features/exports src/features/prompts/files
npm run build
git add src/features
git commit -m "feat: add prompt imports exports and files"
```

### Task 10: Implement Analytics, Theme, Offline Drafts, And Resilient States

**Files:**
- Create: `src/features/analytics/analytics-api.ts`
- Create: `src/features/analytics/AnalyticsPage.tsx`
- Create: `src/features/analytics/CategoryChart.tsx`
- Create: `src/features/analytics/PlatformChart.tsx`
- Create: `src/features/settings/ThemeProvider.tsx`
- Create: `src/components/system/NetworkStatus.tsx`
- Test: `src/features/analytics/AnalyticsPage.test.tsx`
- Test: `src/features/settings/ThemeProvider.test.tsx`

- [ ] **Step 1: Write failing analytics and theme tests**

Verify zero-data summaries, most-used ordering, category totals, saved theme restoration, system preference fallback, and offline indicator behavior.

- [ ] **Step 2: Implement analytics queries**

Return totals, favorites, recent prompts, most used, highest rated, category distribution, platform distribution, and usage over time. Keep aggregation user-scoped and indexed.

- [ ] **Step 3: Implement accessible charts**

Use Recharts with visible labels and adjacent text summaries. Never rely on color alone. Empty analytics shows guidance instead of empty axes.

- [ ] **Step 4: Implement themes and recovery**

Persist light/dark/system choice. Preserve unsaved editor drafts locally. Show network status and retry actions; do not claim offline server mutations succeeded.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- --run
npm run build
git add src
git commit -m "feat: add analytics themes and recovery states"
```

### Task 11: Complete Browser, Accessibility, And Security Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/prompt-lifecycle.spec.ts`
- Create: `tests/e2e/library.spec.ts`
- Create: `tests/e2e/import-export.spec.ts`
- Create: `tests/e2e/mobile.spec.ts`
- Create: `tests/e2e/rls.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: Write critical end-to-end tests**

Cover:

1. register/login/logout;
2. create prompt;
3. search and filter;
4. copy and usage increment;
5. edit and inspect version;
6. rollback;
7. folder/tag organization;
8. import and export;
9. attachment upload/download;
10. free-plan limit;
11. mobile navigation;
12. user B cannot access user A data.

- [ ] **Step 2: Run the full automated suite**

```bash
npm run lint
npm test -- --run
npm run build
npx playwright test
```

Expected: all commands pass with no unhandled console errors.

- [ ] **Step 3: Perform visual fidelity QA**

Generate the final approved full-screen concept before frontend implementation if it has not yet been generated. Compare that concept with browser screenshots at:

- 1440x900 desktop;
- 1024x768 tablet;
- 390x844 mobile.

Use the Browser plugin first and inspect both concept and implementation with `view_image`. Record and fix mismatches in copy, hierarchy, palette, typography, spacing, icons, mobile behavior, and container model.

- [ ] **Step 4: Run Supabase security checks**

Run the available database advisors and verify all RLS/storage tests against a reset database. Confirm the frontend bundle contains no secret/service-role key.

- [ ] **Step 5: Finish production documentation**

README must document:

- local prerequisites and commands;
- Supabase project setup and migrations;
- email and Google auth setup;
- storage bucket behavior;
- environment variables;
- test commands;
- GitHub and Vercel deployment;
- known deferred roadmap items.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "test: verify Prompt Vault Pro production flows"
```

### Task 12: Publish To GitHub And Deploy With Vercel

**Files:**
- Create or modify: `vercel.json` only if SPA rewrites are not handled by platform configuration
- Modify: `README.md`

- [ ] **Step 1: Use the GitHub publication workflow**

Load and follow `github:yeet`. Confirm the branch is clean, run final checks, create or select the GitHub repository, and push `codex/prompt-vault-pro`.

Expected: remote branch exists and contains no `.env`, Supabase secrets, test artifacts, or temporary visual-companion files.

- [ ] **Step 2: Create the pull request**

Open a PR describing:

- product scope;
- data security and RLS;
- test evidence;
- deferred roadmap;
- deployment configuration.

Merge only after required checks pass.

- [ ] **Step 3: Use the Vercel deployment workflow**

Load and follow `app-deploy-vercel`. Connect the GitHub repository, use the Vite build preset, and configure:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Never configure a service-role key in Vercel frontend variables.

- [ ] **Step 4: Configure Supabase production redirects**

Add the final Vercel production URL and approved preview URL pattern to Supabase Auth redirect settings. Confirm Google OAuth redirect configuration matches Supabase's callback URL.

- [ ] **Step 5: Verify the deployed application**

In the deployed site:

- authenticate with email and Google;
- create, search, copy, edit, version, organize, export, and delete a test prompt;
- verify mobile layout;
- inspect browser console and network failures;
- verify user isolation with two test users.

- [ ] **Step 6: Record release evidence**

Add the production URL and setup notes to README, then:

```bash
git add README.md
git commit -m "docs: record production deployment"
git push
```

Expected: GitHub default branch and Vercel production deployment both reflect the verified release.

## Completion Gate

The implementation is complete only when:

- all unit, component, integration, and browser tests pass;
- Supabase advisors have no unresolved security findings;
- RLS and storage isolation are verified with two users;
- desktop, tablet, and mobile visual comparison passes;
- the production build contains no secrets or blocking console errors;
- the GitHub repository is current;
- the Vercel production URL passes the core prompt lifecycle.
