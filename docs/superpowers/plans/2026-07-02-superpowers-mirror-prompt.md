# Superpowers Mirror Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a fully capable, portable system prompt that mirrors the Superpowers plugin's working discipline and deliver it as reusable Markdown plus a polished, verified PDF.

**Architecture:** The Markdown file is the canonical prompt source and is organized into explicit behavioral modules for workflow selection, brainstorming, planning, implementation, debugging, collaboration, review, and verification. A styled document renderer converts that source into a PDF; the PDF is then rendered back to page images for visual inspection so the source and presentation can be verified independently.

**Tech Stack:** Markdown, bundled document/PDF tooling, PDF page rendering, visual inspection

---

### Task 1: Author The Portable System Prompt

**Files:**
- Create: `Superpowers-mirror-system-prompt.md`

- [ ] **Step 1: Draft the prompt's identity and authority rules**

Write a system-prompt opening that defines the assistant as a disciplined software collaborator, states that platform safety and system policies remain binding, gives the user's task instructions priority within those bounds, and prohibits claims that unavailable skills or tools were invoked.

- [ ] **Step 2: Add workflow selection rules**

Define a decision protocol that classifies requests as explanation, creative change, implementation, diagnosis, review, or verification. Require the assistant to apply only relevant workflows and to state capability limitations honestly.

- [ ] **Step 3: Add the creative design gate**

Require context exploration, one-at-a-time clarification when necessary, comparison of two or three approaches, a concise design covering architecture, data flow, errors, and validation, and explicit approval before implementation.

- [ ] **Step 4: Add planning and execution protocols**

Require concrete plans for multi-step work, small independently verifiable tasks, test-first feature and fix development, preservation of unrelated changes, safe tool use, and proportionate progress updates.

- [ ] **Step 5: Add debugging, review, and verification protocols**

Require reproduction and evidence gathering before fixes, root-cause analysis, regression tests, prioritized code-review findings, and fresh command output before any completion claim.

- [ ] **Step 6: Add compact operating checklists**

End the prompt with before-action, before-change, and before-completion checklists that reinforce the detailed rules without adding new requirements.

- [ ] **Step 7: Inspect the prompt for unsupported claims and placeholders**

Run:

```bash
rg -n "T[B]D|T[O]DO|F[I]XME|I invoked|skill tool reported" Superpowers-mirror-system-prompt.md
```

Expected: no matches.

### Task 2: Generate The PDF

**Files:**
- Create: `Superpowers-mirror-system-prompt.pdf`
- Create temporarily: PDF rendering artifacts under `/tmp`

- [ ] **Step 1: Load the bundled document and PDF runtime**

Use the workspace dependency loader and read the PDF skill instructions before selecting the supported renderer.

- [ ] **Step 2: Render the canonical Markdown source**

Create a professional PDF with a restrained green-and-charcoal palette, readable typography, clear heading hierarchy, page numbers, sensible code/checklist wrapping, and no clipped content.

- [ ] **Step 3: Verify PDF structure**

Use the PDF inspection tools to confirm the document opens, has at least one page, contains the title `Superpowers Mirror System Prompt`, and includes the final completion checklist.

- [ ] **Step 4: Render every PDF page to an image**

Render all pages at inspection resolution into a temporary directory.

- [ ] **Step 5: Visually inspect every rendered page**

Confirm there are no blank pages, overlaps, clipped lines, orphaned headings, unreadable text, or broken list indentation. If any issue appears, revise the source or rendering styles and repeat Steps 2–5.

### Task 3: Final Verification And Commit

**Files:**
- Verify: `Superpowers-mirror-system-prompt.md`
- Verify: `Superpowers-mirror-system-prompt.pdf`

- [ ] **Step 1: Verify repository changes are scoped**

Run:

```bash
git status --short
git diff --check -- Superpowers-mirror-system-prompt.md
```

Expected: the new prompt artifacts are present, the Markdown has no whitespace errors, and unrelated user changes remain unmodified.

- [ ] **Step 2: Re-run final PDF inspection**

Run the structural and visual verification from Task 2 against the final PDF bytes.

- [ ] **Step 3: Commit only the prompt artifacts**

```bash
git add Superpowers-mirror-system-prompt.md Superpowers-mirror-system-prompt.pdf
git commit -m "docs: add portable Superpowers mirror prompt"
```

- [ ] **Step 4: Report the deliverables**

Provide clickable links to both files, summarize the verification evidence, and explicitly note that the prompt mirrors behavior without bundling or claiming access to the plugin.
