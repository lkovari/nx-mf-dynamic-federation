# nx-mf-dynamic-federation
Advanced Angular Micro Frontends with Dynamic Module Federation.

## Based on the below websites
https://nx.dev/docs/technologies/angular/guides/dynamic-module-federation-with-angular  
https://www.angulararchitects.io/en/blog/dynamic-module-federation-with-angular/  
https://dev.to/mayur_kulkarni_126/step-by-step-guide-to-angular-microfrontends-with-nx-and-dynamic-module-federation-2e04  
https://www.youtube.com/watch?app=desktop&v=TLiL6EpeWJ4  

## Architectural Best Practices References
https://onehorizon.ai/blog/angular-best-practices-2026-the-architects-playbook
https://wirefuture.com/post/angular-best-practices-building-scalable-applications-in-2026
https://nx.dev/blog/architecting-angular-applications
https://dev-academy.com/angular-architecture-best-practices/

## How it works (Dynamic Federation)

The host loads all remotes at **runtime** from a manifest. No remote URLs are baked into the host build.

### 1. Runtime remote definitions (manifest)

| What | Where |
|------|--------|
| File | `nx-mf-df/apps/main-host/public/module-federation.manifest.json` |
| Content | Maps remote names to `remoteEntry.mjs` URLs (single line in repo): `mf_remote_a` → `http://localhost:4201/remoteEntry.mjs`, `mf_remote_b` → `http://localhost:4202/remoteEntry.mjs`, `mf_remote_home` → `http://localhost:4203/remoteEntry.mjs` |

The host does not know these URLs at build time; they are read from this file at runtime.

### 2. Bootstrap: fetch manifest → register remotes → start app

| What | Where |
|------|--------|
| File | `nx-mf-df/apps/main-host/src/main.ts` |
| Flow | Line 3: `fetch('/module-federation.manifest.json')` → Line 4: `res.json()` → `definitions: Record<string, string>` → Lines 5–6: `setRemoteDefinitions(definitions)` from `@nx/angular/mf` → Lines 7–8: `import('./bootstrap')` to start Angular → Line 9: `.catch()` for errors |
| Import | Line 1: `setRemoteDefinitions` from `@nx/angular/mf` |

Remotes are defined only from the manifest at runtime, not from webpack config.

### 3. Host module federation config – no static remotes

| What | Where |
|------|--------|
| File | `nx-mf-df/apps/main-host/module-federation.config.ts` |
| Relevant | Line 5: `remotes: []` (empty array) |

The host bundle has no static remote URLs; everything is dynamic.

### 4. Host webpack – no remote overrides

| What | Where |
|------|--------|
| Files | `nx-mf-df/apps/main-host/webpack.config.ts`, `nx-mf-df/apps/main-host/webpack.prod.config.ts` |
| Relevant | In both: Line 4: `export default withModuleFederation(config, { dts: false });` — no `remotes` override passed to `withModuleFederation` |

No remote URLs are embedded in the build.

### 5. Routes: load remotes at runtime

| What | Where |
|------|--------|
| File | `nx-mf-df/apps/main-host/src/app/app.routes.ts` |
| Import | Line 1: `loadRemoteModule` from `@nx/angular/mf` (no static `import('mf_remote_*/Routes')`) |
| Helper | Lines 4–20: `getRemoteRoutes(m)` — reads `remoteRoutes` from the loaded module (direct, `default.remoteRoutes`, or via `Object.entries`) |
| Loader | Lines 21–29: `remoteRoutes(remoteName)` returns a function that calls `loadRemoteModule(remoteName, './Routes')` (line 23), then `getRemoteRoutes(m)` (line 24), with `.catch()` for errors (lines 25–28) |
| Route entries | Lines 31–48: `appRoutes` — each of `mf_remote_home`, `mf_remote_a`, `mf_remote_b` uses `loadChildren: remoteRoutes('...')` (lines 34, 38, 42); default redirect at lines 44–48 |

All remote route loading goes through the dynamic API and manifest-defined URLs.

### 6. Serve configuration

| What | Where |
|------|--------|
| File | `nx-mf-df/apps/main-host/project.json` |
| Target | `targets.serve` (executor: `@nx/angular:module-federation-dev-server`) |
| Options | `devRemotes`: `["mf_remote_a", "mf_remote_b", "mf_remote_home"]` — Nx starts these when  run the host; `pathToManifestFile`: `"apps/main-host/public/module-federation.manifest.json"` |

In dev, remotes are started and the same manifest is used.

### 7. Remotes

| What | Where |
|------|--------|
| Apps | `nx-mf-df/apps/mf_remote_a`, `nx-mf-df/apps/mf_remote_b`, `nx-mf-df/apps/mf_remote_home` |
| Expose | Each `module-federation.config.ts`: e.g. `mf_remote_a` lines 5–7 — `exposes: { './Routes': 'apps/mf_remote_a/src/app/remote-entry/entry.routes.ts' }` |
| Routes export | Each `src/app/remote-entry/entry.routes.ts`: e.g. `mf_remote_a` line 4 — `export const remoteRoutes: Route[] = [{ path: '', component: RemoteA }];` |
| Serve | Each `project.json` serve target: `@nx/web:file-server`, ports 4201, 4202, 4203, matching the manifest |

For more detail on the migration from static to dynamic federation, see `nx-mf-df/MS_TO_DF.md`.

### Tailwind CSS

Tailwind CSS v4 is installed and configured for all apps (main-host and remotes). Configuration uses `@tailwindcss/postcss` and `.postcssrc.json`; each app’s `styles.css` imports Tailwind via `@import "tailwindcss";`.

**Reference:** [Install Tailwind CSS with Angular](https://tailwindcss.com/docs/installation/framework-guides/angular)

## Responsiveness

Modern CSS for responsive layouts relies on a few key features. Use them so layouts and typography scale with viewport and container size without an explosion of media queries.

### Main features

| Feature | Purpose | Example |
|--------|--------|--------|
| **`clamp(min, preferred, max)`** | Constrains a value between a minimum and maximum; the middle value is the “preferred” size that grows/shrinks with context (e.g. viewport). Ideal for fluid typography, spacing, and widths. | `font-size: clamp(1rem, 2vw + 1rem, 2rem);` — text scales between 1rem and 2rem based on viewport. |
| **`@container`** | Container queries let  style based on the **container’s** size, not the viewport. Components can adapt when their wrapper is narrow or wide, so the same component works in sidebars, main content, or full width. | `@container (min-width: 400px) { .card { grid-template-columns: 1fr 1fr; } }` — card switches to two columns when its container is wide enough. |
| **`minmax(min, max)`** | In Grid, defines a track that is at least `min` and at most `max`. Makes columns/rows flexible: they don’t collapse below `min` and don’t grow beyond `max`. | `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));` — as many columns as fit, each between 200px and 1fr. |
| **`repeat()`** | Defines repeated grid tracks. Use a number (`repeat(3, 1fr)`) or auto patterns (`repeat(auto-fill, minmax(150px, 1fr))`) to avoid writing the same track many times and to get responsive grids. | `repeat(auto-fill, minmax(12rem, 1fr))` — auto-fill creates as many columns as fit with a minimum of 12rem. |

Use **`container-type: inline-size`** (or `size`) on a parent when using `@container` so that queries resolve against that element.

### Preferred units for responsiveness

| Unit | Best for | Why |
|------|-----------|-----|
| **`rem`** | Font sizes, spacing, padding, margins | Respects user font-size preferences (accessibility); scales consistently across the app. |
| **`%`** | Widths and sometimes heights relative to container | Directly tied to parent size; good for fluid layouts. |
| **`fr`** | Grid column/row sizes | Fraction of free space; combines well with `minmax()` for flexible grids. |
| **`ch`** | Max-width of text blocks | Roughly one character width; keeps line length readable (e.g. `max-width: 65ch`). |
| **`vw` / `vh`** | Used **inside** `clamp()` or `min()`/`max()` for viewport-based scaling | Raw viewport units can be too extreme; clamping keeps values in a safe range. |

Avoid using fixed `px` for typography and key layout dimensions; prefer `rem` (and `clamp()` for fluid scaling) so the layout stays responsive and accessible.

## This project is under construction!

### Known bugs and TODOs:
- fix all warnings!
- fix lint errors!
- implement tests (Vitest installed)
- ~~convert module federation to dynamic federation~~ (done)
- ~~install Tailwind~~ (done); maybe install Sass too.
- restyle all
- implement global error handling
- implement global wait spinner
- implement to put into HTTP header the corelation id for future use.- install Angular Material UI component libs
- optimize nx usage
- create correct separated structure below styles I mean _variables.css, _colors.css etc.
- get rid of the all nx-welcome.ts it not in use
- create vertical sliced DDD style folder structure

## Create workspace:
1. pnpx create-nx-workspace@latest nx-mf-df --preset=apps
2. cd nx-mf-df
3. pnpx nx add @nx/angular
4. pnpx nx g @nx/angular:host apps/main-host --prefix=nx-mf-df
5. pnpx nx g @nx/angular:remote apps/mf_remote_a --prefix=nx-mf-df --host=main-host
6. pnpx nx g @nx/angular:remote apps/mf_remote_b --prefix=nx-mf-df --host=main-host
7. pnpx nx g @nx/angular:remote apps/mf_remote_home --prefix=nx-mf-df --host=main-host
8. npx nx g @nx/angular:library --name=common-ui-lib --directory=libs/common-ui-lib --standalone --buildable --publishable=false
9. npx nx g @nx/angular:component libs/common-ui-lib/src/lib/nx-version/angular-version.ts --standalone --export --no-interactive
10. npx nx g @nx/angular:component libs/common-ui-lib/src/lib/nx-version/nx-version.ts --standalone --export --no-interactive
11. replace module federation with dynamic federation based on the abowe URLx


[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. 


These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Build Applications

### Build all applications

To build all applications (automatically includes all projects tagged with `type:app`):

```sh
pnpm build:apps
# or equivalent Nx command:
npx nx run-many -t build --projects=tag:type:app
```

### Build individual applications

To build a specific application:

```sh
# Build main host
pnpm build:main-host
# or
pnpm nx build main-host

# Build remote A
pnpm build:mf-remote-a
# or
pnpm nx build mf_remote_a

# Build remote B
pnpm build:mf-remote-b
# or
pnpm nx build mf_remote_b

# Build remote home
pnpm build:mf-remote-home
# or
pnpm nx build mf_remote_home
```

### Build libraries

To build all libraries (automatically includes all projects tagged with `type:lib`):

```sh
pnpm build:libs
# or equivalent Nx command:
npx nx run-many -t build --projects=tag:type:lib
```

To build a specific library:

```sh
# Build common UI library
pnpm build:common-ui-lib
# or
pnpm nx build common-ui-lib
```

### Build everything

To build everything (apps and libraries):

```sh
pnpm build:all
# or equivalent Nx command:
npx nx run-many -t build
```

## Run in Docker

The project can be run fully in Docker: the host and all remotes are started as separate services with health checks. Run from the repository root (where `docker-compose.yml` lives).

| Command | Purpose |
|--------|--------|
| `docker-compose up --build` | Build images (if needed) and start all services (main-host on 4200, remotes on 4201, 4202, 4203). Use `--build` to force a rebuild after code or Dockerfile changes. |
| `docker-compose up -d --build` | Same as above but run in the background (detached). |
| `docker-compose down` | Stop and remove the containers. Leaves images and volumes. |
| `docker-compose down -v` | Stop and remove the containers **and** remove named volumes (`-v`). Use when  want a clean state (e.g. to clear volume-backed data). |
| `docker-compose ps` | List running services and their status. |
| `docker-compose logs -f` | Stream logs from all services. Add a service name (e.g. `main-host`) to follow only that service. |
| `docker-compose restart <service>` | Restart a single service (e.g. `main-host`, `mf-remote-a`). |

The main host depends on the three remotes being healthy, so remotes start first; once they pass their health checks, the host is started.

## Scripts

All scripts are defined in `nx-mf-df/package.json` and should be run from the `nx-mf-df` directory (e.g. `pnpm <script>` or `npm run <script>`).

| Script | Purpose |
|--------|--------|
| `start` | Serve the main host app in development (Nx serve main-host); starts remotes automatically when configured. |
| `serve` | Alias for `start`; serves the main host. |
| `build:main-host` | Build the main host application (development config). |
| `build:main-host:prod` | Build the main host with production configuration. |
| `build:mf-remote-a` | Build the `mf_remote_a` remote app (dev). |
| `build:mf-remote-a:prod` | Build `mf_remote_a` with production config. |
| `build:mf-remote-b` | Build the `mf_remote_b` remote app (dev). |
| `build:mf-remote-b:prod` | Build `mf_remote_b` with production config. |
| `build:mf-remote-home` | Build the `mf_remote_home` remote app (dev). |
| `build:mf-remote-home:prod` | Build `mf_remote_home` with production config. |
| `build:common-ui-lib` | Build the shared `common-ui-lib` library (dev). |
| `build:common-ui-lib:prod` | Build `common-ui-lib` with production config. |
| `build:libs` | Build all projects tagged as libraries (`tag:type:lib`). |
| `build:libs:prod` | Build all libraries with production config. |
| `build:apps` | Build all projects tagged as applications (`tag:type:app`). |
| `build:apps:prod` | Build all apps with production config. |
| `build:all` | Build every project in the workspace. |
| `build:all:prod` | Build every project with production config. |
| `lint:common-ui-lib` | Lint the `common-ui-lib` library. |
| `lint:libs` | Lint all projects tagged as libraries. |
| `lint:apps` | Lint all application projects. |
| `lint:all` | Lint the entire workspace. |
| `show-ignored-build-scripts` | Run the helper script that lists build scripts ignored by Nx (for debugging/audit). |

## Available Scripts

All scripts are available via `pnpm`:

### Development

```sh
# Start the main host application
pnpm start
# or
pnpm serve
```

### Build Scripts

#### Build all projects by type

```sh
# Build all libraries (uses tag:type:lib)
pnpm build:libs
# or equivalent Nx command:
npx nx run-many -t build --projects=tag:type:lib

# Build all applications (uses tag:type:app)
pnpm build:apps
# or equivalent Nx command:
npx nx run-many -t build --projects=tag:type:app

# Build everything (apps and libraries)
pnpm build:all
# or equivalent Nx command:
npx nx run-many -t build
```

#### Build individual projects

```sh
# Build individual applications
pnpm build:main-host
pnpm build:mf-remote-a
pnpm build:mf-remote-b
pnpm build:mf-remote-home

# Build individual library
pnpm build:common-ui-lib
```

### Lint Commands

```sh
# Lint a specific library
pnpm lint:common-ui-lib

# Lint all libraries
pnpm lint:libs

# Lint all applications
pnpm lint:apps

# Lint everything (apps and libraries)
pnpm lint:all
```

### Individual Project Linting

 can also lint individual projects directly:

```sh
# Lint main host
pnpm nx lint main-host

# Lint remote A
pnpm nx lint mf_remote_a

# Lint remote B
pnpm nx lint mf_remote_b

# Lint remote home
pnpm nx lint mf_remote_home

# Lint common UI library
pnpm nx lint common-ui-lib
```

## Add new projects

While  could add new projects to workspace manually, might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin  can use the `nx add` command. Here's an example of adding the Angular plugin:
```sh
npx nx add @nx/angular
```

Use the plugin's generator to create new projects. For example, to create a new Angular app or library:

```sh
# Generate an application
npx nx g @nx/angular:application demo

# Generate a library
npx nx g @nx/angular:library some-lib --directory=libs/some-lib --standalone --buildable --publishable=false
```

Can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in the IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches the developer experience. It lets run tasks, generate code, and improves code autocompletion in the IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Install Tailwind CSS with Angular](https://tailwindcss.com/docs/installation/framework-guides/angular)
- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## How Dynamic Module Federation works

# Static Module Federation
Remote list is fixed in the host’s build config (e.g. in webpack / module-federation.config.ts).
Remotes are declared at build time; the host bundle “knows” remote names and often their URLs.
To add/change a remote or its URL,  typically change config and rebuild the host.
# Dynamic Module Federation
The host does not declare remotes in its build config.
The host gets the remote list at runtime (e.g. from a manifest or API).
The same host build can load different remotes in different environments (dev, staging, prod) by changing only the manifest/API—no host rebuild.
So “dynamic” = remotes are resolved at runtime, not baked in at build time.
How it works (step by step)
# 1. Build time: host is “remote-agnostic”
The host’s webpack/module-federation config has no remotes (or only an empty list).
The host does not bundle or hardcode remote URLs.
The host only contains the mechanism: “fetch a mapping, register it, then load remotes by name.”
So the host build is independent of which remotes exist and where they are.
# 2. Runtime: bootstrap loads the mapping
In main.ts it have something like:
fetch('/module-federation.manifest.json')
  .then((res) => res.json())
  .then((definitions: Record<string, string>) => setRemoteDefinitions(definitions))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
fetch('/module-federation.manifest.json')  .then((res) => res.json())  .then((definitions: Record<string, string>) => setRemoteDefinitions(definitions))  .then(() => import('./bootstrap'))  .catch((err) => console.error(err));
What this does:
Fetch the manifest (e.g. from /module-federation.manifest.json or an API).
Register the mapping with Module Federation via setRemoteDefinitions(definitions) (e.g. mf_remote_a → http://.../remoteEntry.mjs).
Then bootstrap the Angular app.
So the first thing that runs is “get the remote list and tell the runtime where each remote lives.” That’s the “dynamic” part: the mapping is decided when the app runs, not when it’s built.
3. Runtime: routes load remotes by name
In app.routes.ts:
loadRemoteModule(remoteName, './Routes')
loadRemoteModule(remoteName, './Routes')
The host only uses remote name (mf_remote_a, mf_remote_b, etc.) and exposed module (./Routes). It does not use URLs here—Module Federation resolves the URL from the definitions. So:
When the user navigates to a route that uses a remote, the router calls loadRemoteModule(remoteName, './Routes').
Module Federation looks up remoteName in the definitions it got at startup, fetches the remote entry from that URL, and then loads ./Routes.
So “dynamic” again: which URL is used for each remote is determined at runtime from the manifest, not from the host’s build.
Why it’s called “dynamic”
Aspect	What’s dynamic
When remotes are known	At runtime (when the app starts), not at build time.
Where the list comes from	A runtime resource (manifest file or API), not the host’s webpack config.
Same build, different environments	The same host build can load different remotes (or different URLs) in dev vs staging vs prod by changing only the manifest/API.
Adding/removing remotes	Change the manifest (or API response); no host rebuild.
So “Dynamic Module Federation” = remote discovery and URL resolution happen at runtime (via manifest/API + setRemoteDefinitions + loadRemoteModule), instead of being fixed in the host’s build configuration. That’s the core of how it works and why it’s dynamic.