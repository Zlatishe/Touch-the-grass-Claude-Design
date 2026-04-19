# N6 — Publish: GitHub → Vercel

**Goal:** get `Touch the grass` live at a public URL, with a sane branching workflow you can keep using.
**Audience:** you (new to dev). Concepts explained inline.
**Scope:** publishing + workflow setup. No code changes.
**Repo:** https://github.com/Zlatishe/Touch-the-grass-Claude-Design
**You already have:** a Vercel account.
**Claude has:** Vercel MCP access + `git` + `gh` CLI (GitHub). I drive almost everything from here — you approve at checkpoints.

---

## TL;DR

1. I clean up branches: merge `n3/design-audit` → `main` via a PR (using `gh`).
2. I protect `main` on GitHub so nothing lands without a PR.
3. You click **one** button in Vercel to import the repo (the GitHub↔Vercel OAuth handshake requires your browser, once). After that: hands off.
4. From then on: every feature = new branch → PR (I open it) → auto preview URL on Vercel → squash-merge → auto production deploy.
5. I handle git, PRs, deploys, logs, rollbacks. You review URLs on your phone + approve merges.

---

## The branching model we're adopting

**Trunk-based with short-lived feature branches** — the mainstream modern workflow. Shape:

```
main  ────●────●────●────●────●──────   (always deployable; = production)
           \        \        \
            feat/A   feat/B   fix/C       (short-lived; merged via PR, then deleted)
```

**Rules of the road:**
- `main` is sacred. It's what's live. You never commit to it directly.
- Every change — feature, fix, tweak — starts as a new branch off `main`.
- Branch names are descriptive: `feat/palette-sunset`, `fix/mobile-status-strip`, `chore/update-deps`.
- Open a Pull Request as soon as you start (even draft). Vercel gives that branch its own preview URL — you get a live staging link per PR.
- Merge to `main` only when the preview looks right. Use **squash merge** so `main`'s history stays one-commit-per-feature.
- Delete the branch after merge. Dead branches are clutter.
- Tag releases (`N6`, `N7`, `v1.0`) on `main` after meaningful milestones.

**Why squash merge:** your feature branch may have 15 "wip", "typo", "try again" commits. Squash collapses them into one clean commit on `main`. `git log main` stays readable.

---

## Phase 0 — Pre-flight (5 min)

```bash
cd "/Users/zlataivleva/Downloads/Design/Claude/Touch the Grass"
npm run build
npm run preview     # http://localhost:4173
```

Verify grass renders, Begin works, camera prompts, no console errors. **Why:** Vercel runs the same `npm run build`. Local failures = remote failures.

---

## Phase 1 — Straighten out branches & push to GitHub (I drive, ~5 min)

Right now your work lives on `n3/design-audit`. Before Vercel, I establish `main` as the production trunk.

**I will:**
1. Survey state: `git status`, `git branch -a`, `git remote -v`, `git log --oneline -10`.
2. Verify `.gitignore` includes `node_modules`, `dist`, `.DS_Store`, `.env`, `.env.local`, `*.log`, `.vercel`. Amend if missing.
3. Commit anything outstanding with a clear message.
4. Push `n3/design-audit` to origin (`git push -u origin n3/design-audit`).
5. Open a PR via `gh pr create` from `n3/design-audit` → `main`, titled `N2–N5: design audit, regressions fixed, veil & mobile polish`, body summarizing each N milestone.
6. **Leave the PR open** — we want the Vercel preview URL on it before merging.

**You do:** nothing. I'll paste the PR URL when ready.

---

## Phase 2 — Connect Vercel (you: ~2 min, one-time)

The GitHub↔Vercel link is an OAuth consent — it must happen in your browser, once. After that I take over.

**You do (once):**
1. https://vercel.com/new
2. Pick `Touch-the-grass-Claude-Design` from the list. If it's not there → **"Adjust GitHub App Permissions"** → grant access to that repo → come back.
3. On the import screen, accept defaults:
   - Framework Preset: **Vite** (auto-detected)
   - Build Command: `npm run build` · Output: `dist` · Install: `npm install`
   - **Production Branch: `main`** ← important
   - Environment Variables: none
4. Click **Deploy**. First build runs (~90s).
5. Tell me "imported" — I find it via `list_projects` and take over.

**After that, I handle via MCP:**
- `list_deployments` — status of every build
- `get_deployment_build_logs` — debug failed builds
- `deploy_to_vercel` — trigger redeploys / rollbacks
- `get_access_to_vercel_url` — generate bypass links for protected previews

**Why not fully automated:** Vercel's REST API can create projects, but the GitHub App install/permission grant is a browser-only OAuth flow. Unavoidable — but it's truly one-time.

---

## Phase 3 — First preview, then first production deploy (15 min)

### 3.1 — Preview URL from the open PR

The moment Vercel is connected, it will detect the open PR from Phase 1.5 and build a **preview deployment** for `n3/design-audit`. URL shape: `touch-the-grass-claude-design-git-n3-design-audit-<you>.vercel.app`.

I'll pull the URL and logs via MCP. You open it and run the Phase 3 checklist below.

### 3.2 — Preview QA checklist

Desktop:
- [ ] Veil with "Touch the grass" + Begin CTA
- [ ] Begin reveals the field; touch/mouse moves grass
- [ ] Camera mode prompts for permission and tracks hand (HTTPS: ✅, Vercel is always HTTPS)
- [ ] Field settings panel opens; sliders + palette work
- [ ] Console is clean

Mobile (open preview URL on your phone):
- [ ] No double brackets on camera panel
- [ ] No wordmark subline
- [ ] No status strip
- [ ] "Field settings" CTA centered at bottom
- [ ] Close × readable

### 3.3 — Merge the PR (I drive)

You say "looks good" → I run:
```bash
gh pr merge <num> --squash --delete-branch
```
Vercel sees the merge → auto-builds `main` → promotes to **production** at `touch-the-grass-claude-design.vercel.app`. I watch the build via MCP and flag issues.

### 3.4 — Tag the release (I drive)

```bash
git checkout main && git pull
git tag N6 && git push origin N6
```

---

## Phase 4 — Lock down `main` (I drive, one-time)

I apply branch protection via `gh api`:

```bash
gh api -X PUT repos/Zlatishe/Touch-the-grass-Claude-Design/branches/main/protection \
  -F required_pull_request_reviews.required_approving_review_count=0 \
  -F enforce_admins=true \
  -F required_status_checks.strict=true \
  -F required_status_checks.contexts[]='Vercel' \
  -F required_conversation_resolution=true \
  -F restrictions=
```

After this, direct pushes to `main` are rejected — everything must flow through a PR. Future-you will thank present-you.

---

## Phase 5 — The ongoing workflow

You say *"add a sunset palette"* — I run:
```bash
git checkout main && git pull
git checkout -b feat/palette-sunset
# ... make changes, commit ...
git push -u origin feat/palette-sunset
gh pr create --title "..." --body "..."
```
Vercel auto-builds a preview. I paste the URL. You check it on your phone. You say "ship it" → I squash-merge and delete the branch. Vercel auto-promotes to production.

**Rollback:** say *"roll back to yesterday's deploy"* — I use `list_deployments` + `deploy_to_vercel` to promote a known-good build. Seconds.

**Hotfix:** same flow, branch prefixed `fix/`.

---

## Phase 6 — (Optional) Custom domain

When you're ready for `touchthegrass.xyz` or similar:
1. Buy at Namecheap / Cloudflare Registrar / Porkbun (~$10–15/yr).
2. Vercel → Project → Settings → Domains → Add.
3. Add the DNS records Vercel shows you at your registrar.
4. Wait 5–30 min. Vercel auto-issues HTTPS.

---

## Troubleshooting cheatsheet

| Symptom | Likely cause | Fix |
|---|---|---|
| Vercel build fails, local passes | Node version mismatch | Vercel → Settings → General → Node Version = your `node -v` |
| Blank white page after deploy | `base` path wrong in `vite.config.js` | Leave `base` unset or `'/'` for Vercel (only change for GH Pages) |
| Camera fails on preview | Browser cached a permission denial | Hard refresh / re-grant in site settings |
| `git push` rejected on `main` | Branch protection (working as intended) | Push a feature branch + open PR instead |
| PR preview didn't build | Vercel GitHub app lost access to repo | Vercel → Integrations → GitHub → Configure → grant repo access |
| "Can't merge, conflicts" on PR | `main` moved since you branched | `git checkout <branch> && git pull origin main && resolve && push` |

I can pull build logs via `get_deployment_build_logs` for any failed deploy — just point me at the URL.

---

## Glossary

- **Trunk-based dev:** workflow where `main` is always deployable; short-lived feature branches merge back frequently.
- **PR (Pull Request):** "please merge my branch into main" + review UI + CI hooks.
- **Squash merge:** collapse a branch's many commits into one on merge.
- **Protected branch:** GitHub rule that blocks direct pushes; forces PR flow.
- **Preview deploy:** a per-branch/PR URL Vercel builds automatically. Staging for free.
- **Production deploy:** the build served at your main URL (`*.vercel.app` or custom domain).
- **Vercel MCP:** the plumbing that lets Claude (me) talk to Vercel's API directly from this chat.

---

## Definition of done

- [ ] `main` contains the merged design work (N2–N5)
- [ ] `main` is protected; direct pushes blocked
- [ ] Vercel project imported; Production branch = `main`
- [ ] Preview URL (from the Phase 1 PR) passed QA checklist
- [ ] Production URL live and passes QA
- [ ] Tag `N6` pushed
- [ ] You've opened one throwaway test PR to confirm the preview-deploy loop works end-to-end
- [ ] URL shared and loads on someone else's phone

---

## What I'll handle vs what you'll handle

| Task | Who |
|---|---|
| All `git` commands (commit, branch, push, tag) | Me (Bash) |
| GitHub PR open / merge / delete branch | Me (`gh` CLI) |
| Branch protection rule on `main` | Me (`gh api`) |
| Vercel initial import (GitHub OAuth handshake) | **You, once** (browser) |
| Triggering deploys / reading logs / rollbacks | Me (Vercel MCP) |
| QA on preview + production URLs | You (your phone + desktop) |
| Approving merges / rollbacks | You ("ship it" / "roll back") |
