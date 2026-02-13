# Step-by-Step: Deploy nx-mf-df to Vercel

This guide covers deploying each app separately, build/deploy scripts for apps and libs, and a single "deploy all" flow. Your repo is an Nx monorepo with Module Federation (one host + three remotes).

## Project structure

- **Apps** (each deployed as its own Vercel project):
  - `main-host` — host/shell app
  - `mf_remote_a`, `mf_remote_b`, `mf_remote_home` — remote apps
- **Libs**: `common-ui-lib` — built and consumed by apps; not deployed as a standalone site

Build outputs:

- `dist/apps/main-host`
- `dist/apps/mf_remote_a`
- `dist/apps/mf_remote_b`
- `dist/apps/mf_remote_home`
- `dist/libs/common-ui-lib` (library only)

All commands below assume you are in the **monorepo root** (`nx-mf-df/`, where `package.json` and `nx.json` live).

---

## Part 1: One-time setup

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Log in

```bash
vercel login
```

### 3. Link the repo (optional)

From `nx-mf-df/`:

```bash
vercel link
```

- Choose your Vercel account/team.
- When prompted “Set up and deploy?” choose **No** (we’ll use per-app configs).
- This creates `.vercel/project.json`. For multiple apps you’ll have **one Vercel project per app** and override root/build/output per project.

### 4. Link each app directory (required for `npm run deploy:*`)

Vercel CLI 50 has no `--project` flag; it uses the `.vercel` link in the **current directory**. From `nx-mf-df/`, run once per app: `cd apps/mf_remote_a && vercel link`, choose your team and **link to existing project** (e.g. `mf-remote-a`). Repeat for `apps/mf_remote_b` (project `mf-remote-b`), `apps/mf_remote_home` (`mf-remote-home`), `apps/main-host` (`main-host`). Then `npm run deploy:all` or individual `deploy:*` scripts target the correct Vercel project per app.

---

## Part 2: Deploy each app separately

Each app is a **separate Vercel project** with its own **Root Directory**, **Build Command**, and **Output Directory**.

### Option A: Deploy from CLI (uses per-app `.vercel` link)

Run from **monorepo root** (`nx-mf-df/`). Each deploy runs `vercel` from that app's directory so the correct Vercel project is used.

**Using the npm scripts (recommended):**

```bash
npm run deploy:mf-remote-a
npm run deploy:mf-remote-b
npm run deploy:mf-remote-home
npm run deploy:main-host
```

Or deploy all: `npm run deploy:all`.

**Manual equivalent (e.g. Remote A):**

```bash
npx nx build mf_remote_a --configuration=production && (cd apps/mf_remote_a && vercel deploy ../../dist/apps/mf_remote_a --prod --yes)
```

(Do not use `--prebuilt`: in CLI 50 that flag only works with output from `vercel build` in `.vercel/output`, not with Nx `dist/` output. Deploying the `dist` path directly uploads and serves it.)

You must run `vercel link` in each app directory once (Part 1, step 4 below) so each deploy targets the correct Vercel project.

### Option B: Per-app `vercel.json` (for Git/dashboard deploys)

Create a `vercel.json` in each app folder so Vercel uses the right root and commands. Set the project’s **Root Directory** in the Vercel dashboard to that app folder.

Example for **Remote A** — create `apps/mf_remote_a/vercel.json`:

```json
{
  "buildCommand": "cd ../.. && npx nx build mf_remote_a --configuration=production",
  "outputDirectory": "../../dist/apps/mf_remote_a",
  "framework": null,
  "installCommand": "cd ../.. && npm ci"
}
```

Same idea for **Remote B** and **Remote Home** (replace `mf_remote_a` with `mf_remote_b` / `mf_remote_home`). For **main-host**, use build target `main-host` and output `../../dist/apps/main-host`, and ensure the production manifest is generated before build (Part 3).

---

## Part 3: Production manifest for the host (important)

The host loads remotes from `public/module-federation.manifest.json`. Right now it has localhost URLs; in production it must use your **deployed remote URLs**.

1. Deploy the three remotes first and note their URLs, e.g.:
   - `https://mf-remote-a.vercel.app`
   - `https://mf-remote-b.vercel.app`
   - `https://mf-remote-home.vercel.app`

2. For production, the manifest should look like:

```json
{
  "mf_remote_a": "https://mf-remote-a.vercel.app/remoteEntry.mjs",
  "mf_remote_b": "https://mf-remote-b.vercel.app/remoteEntry.mjs",
  "mf_remote_home": "https://mf-remote-home.vercel.app/remoteEntry.mjs"
}
```

Ways to do it:

- **A) Env at build time**  
  Add Vercel env vars for the host project (e.g. `REMOTE_A_URL`, `REMOTE_B_URL`, `REMOTE_HOME_URL`) and a small script or step that runs before `nx build main-host` and writes `public/module-federation.manifest.json` from those env vars.

- **B) Separate production manifest**  
  Keep e.g. `public/module-federation.manifest.production.json` with production URLs and copy it to `public/module-federation.manifest.json` before building when deploying to Vercel.

- **C) Manual**  
  Before deploying the host, edit `apps/main-host/public/module-federation.manifest.json` to the production URLs, then build and deploy.

Until the manifest points to the real remote URLs, the host will try to load remotes from localhost in production.

---

## Part 4: Scripts for apps, libs, and “deploy all”

Add these to `package.json` under `"scripts"` (adjust Vercel project names if you use different ones).

**Build libs only** (no deploy; apps depend on them and Nx will build them when building apps):

```json
"build:libs": "npx nx run-many -t build --projects=tag:type:lib"
```

**Build apps only** (builds libs first via Nx):

```json
"build:apps": "npx nx run-many -t build --projects=tag:type:app"
```

**Deploy a single app** (each runs `vercel` from that app dir so the linked project is used; requires Part 1 step 4):

```json
"deploy:mf-remote-a": "npx nx build mf_remote_a --configuration=production && (cd apps/mf_remote_a && vercel deploy ../../dist/apps/mf_remote_a --prod --yes)",
"deploy:mf-remote-b": "npx nx build mf_remote_b --configuration=production && (cd apps/mf_remote_b && vercel deploy ../../dist/apps/mf_remote_b --prod --yes)",
"deploy:mf-remote-home": "npx nx build mf_remote_home --configuration=production && (cd apps/mf_remote_home && vercel deploy ../../dist/apps/mf_remote_home --prod --yes)",
"deploy:main-host": "cp apps/main-host/public/module-federation.manifest.production.json apps/main-host/public/module-federation.manifest.json && npx nx build main-host --configuration=production && (cd apps/main-host && vercel deploy ../../dist/apps/main-host --prod --yes)"
```

**Deploy all remotes then host** (order matters so the host can use real remote URLs):

```json
"deploy:remotes": "npm run deploy:mf-remote-a && npm run deploy:mf-remote-b && npm run deploy:mf-remote-home",
"deploy:all": "npm run build:libs && npm run deploy:remotes && npm run deploy:main-host"
```

If you use env-based manifest (3A), run the step that generates the manifest **before** `deploy:main-host` (e.g. in a `predeploy:host` script that sets the manifest then runs `deploy:main-host`).

**Summary of scripts:**

| Script                 | Purpose                                   |
|------------------------|-------------------------------------------|
| `build:libs`           | Build all libs (e.g. `common-ui-lib`)     |
| `build:apps`           | Build all apps (and their lib deps)       |
| `deploy:mf-remote-a`   | Build + deploy Remote A                  |
| `deploy:mf-remote-b`   | Build + deploy Remote B                  |
| `deploy:mf-remote-home`| Build + deploy Remote Home               |
| `deploy:main-host`     | Build + deploy host (after manifest set) |
| `deploy:remotes`       | Deploy all three remotes                  |
| `deploy:all`           | Build libs → deploy remotes → deploy host |

---

## Part 5: Deploying from the Vercel dashboard (Git)

1. **Import the repo** (if not already): Vercel → Add New → Project → import your Git repo.
2. **Create 4 projects** from the same repo, one per app.
3. For each project, set:
   - **Root Directory**: `nx-mf-df` (or the specific app folder if using per-app `vercel.json` as in Option B).
   - **Framework Preset**: Other (or override the below).
   - **Build Command**:  
     - Remotes: `npx nx build mf_remote_a --configuration=production` (or `mf_remote_b` / `mf_remote_home`).  
     - Host: `npx nx build main-host --configuration=production`.
   - **Output Directory**:  
     - Remotes: `dist/apps/mf_remote_a` (or `mf_remote_b` / `mf_remote_home`).  
     - Host: `dist/apps/main-host`.
   - **Install Command**: `npm ci` (or `npm install`).
4. For the **host** project, add env vars for the remote URLs and implement one of the manifest approaches in Part 3.
5. Deploy. For subsequent deploys, deploy remotes first, then the host so the manifest matches the current remote URLs.

---

## Part 6: Checklist

- [ ] Vercel CLI installed and logged in.
- [ ] Remotes deployed and URLs known.
- [ ] Production manifest for the host updated (env script, production file, or manual).
- [ ] `build:libs` / `build:apps` / `deploy:*` / `deploy:all` scripts added to `package.json` as above.
- [ ] Per-app link: run `vercel link` in each of `apps/mf_remote_a`, `apps/mf_remote_b`, `apps/mf_remote_home`, `apps/main-host` and link to the matching Vercel project (Part 1 step 4).
- [ ] First run: `npm run deploy:remotes` then fix manifest then `npm run deploy:main-host` (or use `deploy:all` once manifest is automated).

---

## Part 7: Fix "No Production Deployment" in the Vercel dashboard

If CLI deploys succeed (`vercel deploy ... --prod`) but the dashboard still shows **No Production Deployment**, Vercel is treating "Production" as the deployment from your **Git production branch**. Until a Git-triggered build succeeds, the card stays in that state. Fix it as follows.

### Step 1: Set Root Directory for every project

1. Open [Vercel Dashboard](https://vercel.com) → **Your Favorites** (or **All Projects**).
2. For **each** project (`main-host`, `mf-remote-a`, `mf-remote-b`, `mf-remote-home`; and `nx-mf-df` if you use it):
   - Open the project → **Settings** → **General**.
   - Under **Root Directory**, click **Edit**.
   - Set to **`nx-mf-df`** (your Nx monorepo root; relative to the repo root).
   - Save.

If Root Directory was wrong or empty, Vercel was building from the repo root and the build could fail or output the wrong app, so no production deployment was ever created from Git.

### Step 2: Set Build & Output per project

Still in **Settings** → **General** (or **Build & Development Settings**), for each project set:

| Project         | Build Command                                                                                                                                 | Output Directory        |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------|-------------------------|
| **mf-remote-a** | `npx nx build mf_remote_a --configuration=production`                                                                                         | `dist/apps/mf_remote_a` |
| **mf-remote-b** | `npx nx build mf_remote_b --configuration=production`                                                                                         | `dist/apps/mf_remote_b` |
| **mf-remote-home** | `npx nx build mf_remote_home --configuration=production`                                                                                   | `dist/apps/mf_remote_home` |
| **main-host**  | `cp apps/main-host/public/module-federation.manifest.production.json apps/main-host/public/module-federation.manifest.json && npx nx build main-host --configuration=production` | `dist/apps/main-host`   |

The main-host build must copy the production manifest before building so the host loads remotes from the deployed URLs, not localhost.

### Step 3: Install command

In the same section, set **Install Command** to one of:

- `npm ci`
- `pnpm install`

Use the same package manager as in your repo (e.g. if you use `pnpm run deploy:all`, use `pnpm install`).

### Step 4: Production branch

In **Settings** → **Git**:

- Ensure **Production Branch** is set to your main branch (e.g. `main`).
- Leave **Ignored Build Step** empty unless you intentionally skip builds for some commits.

### Step 5: Trigger a production deployment from Git

1. Commit and push any change to your **production branch** (e.g. `main`):
   ```bash
   git add -A && git commit -m "chore: trigger Vercel production build" && git push origin main
   ```
2. In the Vercel dashboard, open each project and confirm a new deployment started from the push.
3. Wait for all builds to finish. If a build fails, open the deployment log and fix the reported error (usually Root Directory, Build Command, or Output Directory).
4. After each project has at least one **successful** deployment from the production branch, the dashboard will show a **Production Deployment** instead of "No Production Deployment".

### Step 6 (optional): Ignore the duplicate project

If you have both an **nx-mf-df** project and the four app projects (`main-host`, `mf-remote-a`, etc.), you can either:

- Use only the four app projects and **delete** or **ignore** the `nx-mf-df` project, or
- Configure `nx-mf-df` with the same Root Directory and the build/output for the app you want that project to serve (e.g. main-host), so you don’t have two projects building the same app.

### Summary

| Step | Action |
|------|--------|
| 1 | Set **Root Directory** = `nx-mf-df` for every project. |
| 2 | Set **Build Command** and **Output Directory** per project (see table above). |
| 3 | Set **Install Command** to `npm ci` or `pnpm install`. |
| 4 | Set **Production Branch** to `main` (or your main branch). |
| 5 | Push to the production branch and wait for successful builds. |

After that, the dashboard will show Production Deployment for each project.
