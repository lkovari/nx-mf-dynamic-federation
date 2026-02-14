# Docker and containerization

This document describes how the Nx Module Federation app is containerized: the Dockerfile, `docker-compose.yml`, startup order, and how to run and debug it.

---

## Overview

The app is an **Nx monorepo** with **Angular Module Federation**:

- **One host app** (`main-host`) – shell that loads remote apps at runtime.
- **Three remotes** – `mf_remote_a`, `mf_remote_b`, `mf_remote_home` – each served on its own port.

Each of these runs as a separate container so the host can load remotes by URL. Remotes must be up before the host; `docker-compose` enforces that with healthchecks and `depends_on`.

---

## Dockerfile

**Location:** repository root (`Dockerfile`).  
**Build context:** `./nx-mf-df` (set in `docker-compose.yml`), so paths in the Dockerfile are relative to that context.

| Stage | Instruction | Purpose |
|-------|-------------|---------|
| Base image | `FROM node:20-alpine` | Node 20 on Alpine for small image size. |
| Workdir | `WORKDIR /workspace` | All commands and app code run under `/workspace`. |
| pnpm | `RUN corepack enable && corepack prepare pnpm@latest --activate` | Enables Corepack and installs pnpm for the monorepo. |
| Dependencies | `COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./` then `RUN pnpm install --frozen-lockfile` | Copy only dependency manifests first so install is cached unless lockfile/manifests change. |
| App code | `COPY . ./` | Copy the rest of the Nx app (e.g. `nx-mf-df`) into the image. |
| curl | `RUN apk add --no-cache curl` | Required for Docker healthchecks that call `curl` against each service. |
| Ports | `EXPOSE 4200 4201 4202 4203` | Documents host (4200) and remote (4201–4203) ports; actual mapping is in compose. |
| Default command | `CMD ["pnpm", "start"]` | Overridden per service in `docker-compose.yml` with `pnpm nx serve <app>`. |

The same image is used for all four services; only the `command` differs (which app is served).

---

## docker-compose.yml

**Location:** repository root.  
Defines four services and one network.

### Services

| Service | Container name | Port | Command | Role |
|---------|----------------|------|---------|------|
| `main-host` | nx-mf-main-host | 4200:4200 | `pnpm nx serve main-host` | Host app (Module Federation shell). |
| `mf-remote-a` | nx-mf-remote-a | 4201:4201 | `pnpm nx serve mf_remote_a` | Remote A. |
| `mf-remote-b` | nx-mf-remote-b | 4202:4202 | `pnpm nx serve mf_remote_b` | Remote B. |
| `mf-remote-home` | nx-mf-remote-home | 4203:4203 | `pnpm nx serve mf_remote_home` | Remote Home. |

### Build

- **Context:** `./nx-mf-df` (Nx monorepo directory).
- **Dockerfile:** `../Dockerfile` (relative to context, i.e. repo root).
- All four services use the same build, so one image is built and reused.

### Volumes

Each service mounts:

- `./nx-mf-df:/workspace` – live app code for dev; changes on the host are reflected in the container.
- `/workspace/node_modules` – anonymous volume so host `node_modules` don’t override the container’s install.
- `/workspace/.nx` – anonymous volume for Nx cache so it persists and doesn’t conflict with the host.

### Environment

- `NODE_ENV=development` – development mode for Nx/Angular.
- `HOST=0.0.0.0` – dev server binds to all interfaces so it’s reachable from the host and from other containers (and so healthchecks on `localhost` work).

### Startup order (remotes first, then host)

Module Federation loads remotes by URL at runtime. The host must be able to reach the remote dev servers when it starts, so **remotes must be up before the host**.

- **Remotes** (`mf-remote-a`, `mf-remote-b`, `mf-remote-home`): no `depends_on`. They start in parallel.
- **main-host**: has  
  `depends_on: mf-remote-a, mf-remote-b, mf-remote-home` with `condition: service_healthy`.

So Compose starts the three remotes, waits until all three are healthy, then starts the host. This avoids “dependency main-host failed to start” / remotes not starting because they used to wait on the host.

### Healthchecks

Each service has a healthcheck so Compose knows when the dev server is ready:

- **main-host:** `curl -f http://localhost:4200` (fails if non-2xx or unreachable).
- **Remotes:** same pattern on 4201, 4202, 4203.

Common settings for all:

- `interval: 10s` – check every 10 seconds.
- `timeout: 5s` – each check must succeed within 5 seconds.
- `retries: 10` – up to 10 failures before marking unhealthy.
- `start_period: 120s` – first 120 seconds are grace time; failures in that window don’t count toward retries.

The long `start_period` and high `retries` account for the slow first Nx/Angular build so the container isn’t marked unhealthy before the dev server is listening.

### Network and restart

- All services attach to `nx-mf-network` (bridge). They can reach each other by service name (e.g. `http://mf-remote-a:4201`).
- `restart: unless-stopped` – if a container exits, Docker restarts it unless it was explicitly stopped.

---

## How to run

From the repository root:

```bash
docker-compose up
```

Optional: build (or rebuild) first:

```bash
docker-compose up --build
```

- Remotes start and run until healthy (may take a few minutes on first run).
- Then the host starts.
- Host app: **http://localhost:4200**
- Remotes (for debugging): 4201, 4202, 4203.

Stop:

```bash
docker-compose down
```

---

## Summary

| Item | Purpose |
|------|--------|
| **Dockerfile** | Single Node 20 + pnpm image with app deps and curl for healthchecks; one image for all services. |
| **docker-compose.yml** | Four services (one host, three remotes), same image and context, different commands and ports; remotes start first, host starts after remotes are healthy; volumes for live code and isolated node_modules/.nx. |
| **Start order** | Remotes → healthy → then main-host, so Module Federation can load remotes at runtime. |
| **Healthchecks** | curl on each app’s port with long start_period and retries to tolerate slow first build. |
