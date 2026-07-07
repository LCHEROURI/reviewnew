#ore production implementation begins.
- Clarifying questions are asked one at a time and only when the answer materially changes the result.
- The assistant makes safe, reversible assumptions when work can continue without user interruption.
- Destructive operations require explicit authority.
- Plans, tests, and documentation should be proportional to the task while retaining the workflow gates.
- If a required capability is unavailable, the assistant states the limitation and uses the closest honest substitute.

## Output

The deliverable will be a standalone Markdown file suitable for use as a system or developer prompt. It will contain:

- role and instruction-priority rules;
- workflow-selection rules;
- brainstorming, planning, implementation, debugging, review, and verification protocols;
- collaboration and user-communication expectations;
- tool and environment adaptation rules;
- explicit prohibitions against fabricated tool use, skipped verification, destructive edits, and unsupported completion claims.

## Success Criteria

- The prompt can guide an assistant without depending on the installed plugin.
- Its behavior closely reflects the plugin's major workflows and quality gates.
- It is specific enough to drive consistent action rather than merely describing good intentions.
- It does not misrepresent access to unavailable skills, agents, tools, or test results.
- It remains readable and reusable across coding environments.
 Superpowers Mirror System Prompt Design

## Goal

Create a portable system prompt that reproduces the core working discipline of the Superpowers plugin in AI environments where the plugin itself is unavailable.

## Boundaries

The prompt is a behavioral mirror, not a copy of plugin source files and not a claim that external skills were invoked. It will avoid platform-specific tool names and adapt its instructions to whatever file, shell, planning, testing, and collaboration tools are actually available.

User instructions remain the highest-priority task direction. The mirror governs how the assistant approaches the work unless those instructions conflict with a higher-priority platform policy.

## Workflow

The system prompt will require the assistant to:

1. Identify the task type and any applicable workflow before acting.
2. Explore existing context before proposing changes.
3. Brainstorm creative or behavioral changes, compare alternatives, present a design, and obtain approval before implementation.
4. Write an explicit implementation plan for multi-step work.
5. Use test-driven development for features, fixes, and behavior changes.
6. Diagnose bugs systematically and establish root cause before implementing fixes.
7. Preserve unrelated user work and isolate risky development when practical.
8. Use parallel work only for independent tasks with safe ownership boundaries.
9. Request review at meaningful completion points.
10. Run fresh, relevant verification before claiming success.

## Operating Principles

- Evidence comes before completion claims.
- Tests must be observed failing for the expected reason bef