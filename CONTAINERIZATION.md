# Containerization

This document describes how the project is run with Docker: the **Dockerfile**, **docker-compose.yml**, and why remotes must start before the main host.

## Dockerfile

Location: repository root (`Dockerfile`). Build context is `./nx-mf-df` (set in docker-compose), so paths in `COPY` are relative to that directory.

| Line / section | Purpose |
|----------------|--------|
| `FROM node:20-alpine` | Base image: Node 20 on Alpine Linux for a small image. |
| `WORKDIR /workspace` | All following commands run with `/workspace` as the current directory. |
| `RUN corepack enable && corepack prepare pnpm@latest --activate` | Enables Corepack (Node’s package manager manager) and installs/activates pnpm so the image uses pnpm. |
| `COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./` | Copies dependency and workspace config from the build context (`nx-mf-df`) so install can run without full source. |
| `RUN pnpm install --frozen-lockfile` | Installs dependencies from the lockfile (no changes to it). Ensures the image has a full `node_modules` when built. |
| `COPY . ./` | Copies the rest of the workspace (apps, libs, config) into `/workspace`. |
| `RUN apk add --no-cache curl` | Adds `curl` for healthchecks in docker-compose. |
| `EXPOSE 4200 4201 4202 4203` | Documents that the app may listen on these ports (main-host 4200, remotes 4201–4203). Does not publish them; that is done in docker-compose. |
| `CMD ["pnpm", "start"]` | Default command if none is given. Overridden per service in docker-compose. |

At runtime, docker-compose **mounts** the host folder `./nx-mf-df` over `/workspace`, so the running container uses the host’s source and (importantly) the host’s **node_modules**. The image’s installed dependencies are only used when that volume is not overridden. Keeping `node_modules` on the host avoids version/OS mismatches and ensures tools like Tailwind/PostCSS are present after `pnpm install` locally.

---

## docker-compose.yml

Compose defines one **network** and four **services**: three remotes and the main host. All use the same image (built from the Dockerfile with context `./nx-mf-df`).

### Build

- **context:** `./nx-mf-df` — Compose builds from the Nx workspace directory.
- **dockerfile:** `../Dockerfile` — Dockerfile is at repo root, one level above the context.

So `COPY` in the Dockerfile is relative to `nx-mf-df`.

### Services overview

| Service      | Container name      | Port  | Command                      |
|-------------|---------------------|-------|------------------------------|
| main-host   | nx-mf-main-host     | 4200  | `pnpm nx serve main-host`    |
| mf-remote-a| nx-mf-remote-a      | 4201  | `pnpm nx serve mf_remote_a`  |
| mf-remote-b| nx-mf-remote-b      | 4202  | `pnpm nx serve mf_remote_b`  |
| mf-remote-home | nx-mf-remote-home | 4203  | `pnpm nx serve mf_remote_home` |

### Common settings per service

- **volumes:** `./nx-mf-df:/workspace` — The host workspace is mounted at `/workspace`. The container sees your local files and **host** `node_modules` (run `pnpm install` in `nx-mf-df` so Tailwind and other deps are available).
- **environment:** `NODE_ENV=development`, `HOST=0.0.0.0` — Development mode and bind to all interfaces so the dev server is reachable from the host.
- **networks:** `nx-mf-network` — All services share a bridge network so they can reach each other by service name (e.g. `http://mf-remote-a:4201`).
- **restart:** `unless-stopped` — Containers restart on failure unless manually stopped.
- **healthcheck:** Each service has a healthcheck that runs `curl -f http://localhost:<port>` (main-host: 4200, remotes: 4201–4203). Intervals and timeouts are set so Compose can wait until the dev server is actually responding.

### main-host specifics

- **depends_on:**  
  `main-host` depends on all three remotes with **condition: service_healthy**. So Compose will:
  1. Start the three remote services.
  2. Wait until each remote’s healthcheck succeeds (dev server up and responding).
  3. Only then start `main-host`.

This guarantees that when the main host starts, the remote URLs in the manifest (e.g. `http://localhost:4201/remoteEntry.mjs`) are already serving.

---

## Why remotes start first, then main-host

1. **Runtime dependency:** The host does **dynamic** module federation. On startup it:
   - Fetches `module-federation.manifest.json` (e.g. from `/module-federation.manifest.json`).
   - Calls `setRemoteDefinitions(definitions)` so each remote name (e.g. `mf_remote_a`) is mapped to a URL like `http://localhost:4201/remoteEntry.mjs`.
   - Boots the Angular app; when the user navigates, it uses `loadRemoteModule(remoteName, './Routes')` and Module Federation fetches those URLs.

2. **URLs must be reachable:** Those URLs point to the dev servers of the remotes (4201, 4202, 4203). If the host starts before the remotes are up, the first load or navigation that fetches a remote can fail (e.g. connection refused or 503).

3. **depends_on + healthcheck:** Using `depends_on` with `condition: service_healthy` ensures:
   - Remotes start first.
   - Compose waits until each remote’s healthcheck passes (server listening and responding).
   - Only then is `main-host` started, so by the time the host fetches the manifest and loads remotes, the remote servers are already running.

So “remotes first, main-host later” is required so that the host’s runtime dependency on the remote URLs is satisfied; the healthchecks make that order reliable instead of best-effort.

---

## Quick reference

- **Run everything:** From repo root, `docker-compose up` (add `-d` for detached).
- **Stop and remove volumes:** `docker-compose down -v`.
- **After adding/changing dependencies:** Run `pnpm install` inside `nx-mf-df` on the host so the bind-mounted `node_modules` is up to date; no need to rebuild the image for dependency-only changes.
- **URLs:** Main host at `http://localhost:4200`; remotes at 4201, 4202, 4203. The host loads remotes using these ports as defined in the manifest.
