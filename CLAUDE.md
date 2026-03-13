# CLAUDE.md — Claude Code Configuration for Reviso

## Project Context
**App:** Reviso — Document Restoration QA & Review Tool (embeddable React component)
**Package:** `react-reviso` on npm
**Stack:** React 18 + TypeScript + Vite + MUI 6 + Zustand + Framer Motion
**Stage:** Published PoC, iterating on UX
**User Level:** Developer

## Directives
1. **Master Plan:** Always read `AGENTS.md` first. It contains the current phase and tasks.
2. **Documentation:** Refer to `agent_docs/` for tech stack details, code patterns, and testing guides. Load only when needed.
3. **Plan-First:** Propose a brief plan and wait for approval before coding.
4. **Incremental Build:** Build one component/feature at a time. Verify visually after each change.
5. **No Linting:** Do not act as a linter. Use `npm run lint` if needed.
6. **Communication:** Be concise. Ask clarifying questions when needed.
7. **UX Priority:** This project prioritises UX quality. Every interaction should feel smooth and require minimal clicks.

## Commands
- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run build:lib` — Build library for publishing (ESM + CJS)
- `npm run lint` — ESLint check
- `npm run type-check` — TypeScript type checking (`tsc --noEmit`)
- `npm run preview` — Preview production build

## Key Conventions
- **TypeScript strict mode** — no `any` types, ever
- **MUI theme tokens only** — no raw hex in components
- **Zustand with immer** — for documentStore (nested state updates)
- **Framer Motion** — for page transitions and layout animations
- **SVG overlays** — for text region rendering on document images
- **Preview-first UX** — default view is preview/review mode, editing entered explicitly
- **Component structure** — embeddable component under `src/reviso/`, legacy demo under `src/legacy/`

## Current Phase
Check `AGENTS.md` → "Current State" section for what to work on next.
