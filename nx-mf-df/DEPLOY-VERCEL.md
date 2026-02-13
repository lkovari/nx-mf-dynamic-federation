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

---

## Part 2: Deploy each app separately

Each app is a **separate Vercel project** with its own **Root Directory**, **Build Command**, and **Output Directory**.

### Option A: Deploy from CLI (no `vercel.json`)

Run from **monorepo root** (`nx-mf-df/`).

**Remote A**

```bash
npx nx build mf_remote_a --configuration=production && vercel deploy dist/apps/mf_remote_a --prebuilt
```

**Remote B**

```bash
npx nx build mf_remote_b --configuration=production && vercel deploy dist/apps/mf_remote_b --prebuilt
```

**Remote Home**

```bash
npx nx build mf_remote_home --configuration=production && vercel deploy dist/apps/mf_remote_home --prebuilt
```

**Main host** (ensure production manifest is set first; see Part 3)

```bash
npx nx build main-host --configuration=production && vercel deploy dist/apps/main-host --prebuilt
```

The first time you run `vercel deploy ...` for an app, Vercel will ask to create a new project; give it a name (e.g. `nx-mf-remote-a`, `nx-mf-main-host`). To tie a folder to an existing project, run `vercel link` in that context or use `vercel deploy ... --scope <team> --name <project-name>`.

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

**Deploy a single app** (example: Remote A; repeat for B, Home, Host):

```json
"deploy:mf-remote-a": "npx nx build mf_remote_a --configuration=production && vercel deploy dist/apps/mf_remote_a --prebuilt --yes",
"deploy:mf-remote-b": "npx nx build mf_remote_b --configuration=production && vercel deploy dist/apps/mf_remote_b --prebuilt --yes",
"deploy:mf-remote-home": "npx nx build mf_remote_home --configuration=production && vercel deploy dist/apps/mf_remote_home --prebuilt --yes",
"deploy:main-host": "npx nx build main-host --configuration=production && vercel deploy dist/apps/main-host --prebuilt --yes"
```

Use `--yes` to skip prompts (handy in CI); remove it if you want to confirm the Vercel project each time.

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
- [ ] First run: `npm run deploy:remotes` then fix manifest then `npm run deploy:main-host` (or use `deploy:all` once manifest is automated).
