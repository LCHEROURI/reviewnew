# Prompt Vault Pro Design

## Product Definition

Prompt Vault Pro is a prompt knowledge system for AI power users and non-technical business owners. Its first production release centers on storing, finding, manually refining, versioning, organizing, and reusing prompts. The wider Prompt Operating System roadmap remains future work rather than appearing as incomplete product areas.

The primary users are prompt engineers, no-code builders, marketers, founders, developers, content creators, restaurant consultants, agency owners, and hospitality operators.

## Release Scope

### Included

- Email/password and Google authentication
- User profiles and Free/Pro plan records
- Prompt creation, reading, editing, duplication, archiving, and deletion
- Automatic prompt version history and rollback
- Favorites and one-to-five-star ratings
- Categories, tags, folders, platform labels, and custom values
- Full-text search with category, tag, platform, rating, favorite, status, and date filters
- Grid and list library views with sorting and pagination
- One-click copy with usage tracking and confirmation
- Built-in starter templates
- Private file attachments linked to prompts
- Imports from TXT, Markdown, CSV, and DOCX
- Exports to TXT, Markdown, PDF, and DOCX
- Analytics for prompt usage, ratings, categories, and AI platforms
- Responsive desktop, tablet, and mobile experiences
- Light and dark themes
- Loading, empty, error, offline, and confirmation states
- Free-plan limits of 25 prompts and basic folders
- Pro-ready feature entitlements without payment processing in this release

### Deferred

- AI Projects and project workspaces
- Prompt workflow execution
- A/B/C prompt testing
- Marketplace purchasing and selling
- Team sharing and public libraries
- AI prompt scoring and optimization
- AI agents
- Stripe billing

The schema may reserve stable extension points for these features, but the release will not ship unused tables or visible navigation for unfinished modules.

## Experience Design

### Visual Direction

The chosen interface direction is **Knowledge Library** with an **Editorial Green** theme.

- The prompt library is the product's center.
- A persistent sidebar exposes All Prompts, Favorites, Templates, Analytics, and user folders.
- Warm paper-white surfaces, restrained borders, deep green primary actions, and editorial typography create a premium knowledge-tool character.
- Dark mode preserves the same hierarchy with charcoal surfaces and softened green accents.
- Cards are used for prompt previews where useful; dense results may switch to a compact list.
- Spacing and type remain generous enough for non-technical users while supporting efficient power-user scanning.

### Core Navigation

- Library
- Favorites
- Templates
- Analytics
- Folders
- Settings

On mobile, the sidebar becomes a drawer or compact bottom navigation. Search and New Prompt remain immediately accessible.

### Prompt Library

The default screen contains:

- Global search
- Filter and sort controls
- Grid/list toggle
- Prompt count and active-filter summary
- Prompt cards or rows
- Pagination
- New Prompt action

Each prompt preview shows title, shortened description or content, category, platform, tags, rating, favorite state, updated date, and quick copy.

### Prompt Editor

The editor contains title, description, category, tags, AI platform, prompt content, favorite state, folder assignment, and status. Validation is visible beside the relevant field. Saving an existing prompt creates a new version only when versioned content changes.

### Prompt Detail

The detail screen presents the complete prompt, metadata, rating, usage information, linked files, and version history. Actions include Copy, Edit, Duplicate, Create Version, Export, Move to Folder, Archive, and Delete.

Version comparison presents old and new content side by side on desktop and sequentially on mobile, with additions and removals highlighted. Rollback creates a new current version rather than deleting history.

### Templates And Onboarding

New accounts receive access to starter templates for business analysis, SWOT analysis, restaurant consulting, app planning, product validation, landing pages, marketing strategy, social media, and customer avatars. Templates can be previewed and copied into a user-owned prompt.

### Analytics

Analytics include:

- Total, favorite, active, and archived prompts
- Recently added and recently used prompts
- Most-used and highest-rated prompts
- Category distribution
- AI platform usage
- Copy activity over time

Charts include accessible text summaries and useful empty states.

## Technical Architecture

### Frontend

- React with Vite and TypeScript
- React Router for application routes
- TanStack Query for remote state and cache invalidation
- React Hook Form with Zod validation
- Supabase JavaScript client
- A focused component system using shared tokens and reusable controls
- Vitest and Testing Library for unit and component tests
- Playwright for critical browser workflows

Feature code will be grouped by domain: authentication, prompts, folders, templates, analytics, imports, exports, and settings. Shared UI primitives, Supabase access, validation schemas, and utilities remain separate.

### Supabase

- PostgreSQL for relational application data
- Supabase Auth for email/password and Google login
- Private Supabase Storage bucket for user files
- Row Level Security on every exposed table
- PostgreSQL full-text search for prompt title, description, content, tags, category, and platform
- Database triggers for profile creation, timestamps, and version preservation where transactional guarantees are needed

The browser uses only a Supabase publishable key. Service-role credentials are never exposed to frontend code.

### Deployment

- Source is published to GitHub
- Vercel builds and serves the Vite application
- Production Supabase URL and publishable key are configured as Vercel environment variables
- Supabase redirect URLs include local development and the final Vercel domain
- Database migrations are versioned in the repository

## Data Model

### Core Tables

`profiles`
- `id` references `auth.users`
- `email`
- `name`
- `plan`
- `created_at`
- `updated_at`

`prompts`
- `id`
- `user_id`
- `title`
- `description`
- `prompt_text`
- `category`
- `ai_platform`
- `rating`
- `favorite`
- `status`
- `search_document`
- `created_at`
- `updated_at`

`prompt_versions`
- `id`
- `prompt_id`
- `version_number`
- `prompt_text`
- `change_notes`
- `created_by`
- `created_at`

`tags`
- `id`
- `user_id`
- `name`
- `created_at`

`prompt_tags`
- `prompt_id`
- `tag_id`

`folders`
- `id`
- `user_id`
- `folder_name`
- `color`
- `created_at`
- `updated_at`

`prompt_folders`
- `prompt_id`
- `folder_id`

`prompt_usage`
- `prompt_id`
- `user_id`
- `last_used`
- `use_count`
- `updated_at`

`templates`
- `id`
- `owner_id` nullable for system templates
- prompt fields
- `is_system`
- `created_at`
- `updated_at`

`prompt_files`
- `id`
- `user_id`
- `prompt_id`
- `storage_path`
- `file_name`
- `mime_type`
- `size_bytes`
- `created_at`

`subscriptions`
- `user_id`
- `plan`
- `status`
- `provider_customer_id` nullable
- `provider_subscription_id` nullable
- `current_period_end` nullable
- `created_at`
- `updated_at`

Categories and AI platforms use validated text values so users can create custom entries without schema changes. Built-in values are supplied by the application.

## Data Flow

1. Authentication establishes the Supabase session and loads the profile.
2. Library queries request only the signed-in user's prompts under RLS.
3. Search and filters are translated into one paginated database query.
4. Prompt creation inserts the prompt and its initial version transactionally.
5. Prompt editing preserves the previous content as a version and updates the current prompt.
6. Copying a prompt writes to the clipboard, then increments usage after successful copy.
7. File uploads use a private user-scoped storage path and create a metadata record.
8. Analytics aggregate user-owned prompt and usage records.

## Security

- RLS is enabled on all public tables.
- Policies derive ownership from `auth.uid()`, never editable user metadata.
- Mapping rows are accessible only when the related prompt and folder or tag belong to the user.
- System templates are readable by authenticated users but writable only through privileged administration.
- Storage policies restrict files to a user-specific path.
- Update policies include the required select access.
- Destructive operations require explicit confirmation.
- Imports validate type, size, structure, and record limits before insertion.
- Rendered prompt content is treated as plain text unless explicitly sanitized.

## Plans And Limits

Free accounts may store up to 25 active or archived user prompts and use basic folders and search. System templates do not count toward the limit.

Pro entitlements include unlimited prompts and folders, complete version history, advanced search, exports, attachments, and analytics. The application will centralize entitlement checks so Stripe can replace manual or seeded Pro status later.

## Error Handling

- Authentication errors remain on the relevant form.
- Network failures show retry controls without discarding user-entered text.
- Prompt mutations use disabled/loading button states and success confirmation.
- Optimistic updates are limited to reversible interactions such as favorites.
- Failed imports report row-level issues and do not silently create partial data.
- Export errors identify the failed format.
- Offline detection preserves draft editor content locally until reconnection.

## Testing

- Unit tests cover validation, entitlement limits, search parameter construction, import parsing, export formatting, and version comparisons.
- Component tests cover library states, editor validation, filtering, copying, favorites, and confirmations.
- Supabase integration tests verify CRUD behavior, version creation, RLS isolation, usage increments, and storage access.
- Browser tests cover sign-up/login, prompt creation, search, editing/version rollback, copy, import/export, responsive navigation, and logout.
- Verification includes production build, accessibility checks, desktop/tablet/mobile viewports, and browser console review.

## Release Sequence

1. Scaffold the React application and design system.
2. Add Supabase migrations, RLS, seed templates, and typed client setup.
3. Build authentication and protected application layout.
4. Build prompt CRUD, versions, favorites, ratings, folders, tags, and usage tracking.
5. Add search, filtering, sorting, pagination, and templates.
6. Add imports, exports, attachments, analytics, themes, and plan limits.
7. Complete automated and visual verification.
8. Publish to GitHub and deploy through Vercel.

## Success Criteria

- A new user can authenticate, create a prompt, find it, copy it, edit it, inspect prior versions, roll back, organize it, and export it.
- One user's data is inaccessible to another user through both UI and direct Supabase requests.
- The core workflows function at mobile and desktop sizes.
- The production build passes automated tests and has no blocking browser errors.
- The GitHub repository deploys successfully to Vercel with documented environment configuration.
