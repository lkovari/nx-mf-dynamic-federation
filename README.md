# nx-mf-dynamic-federation
Advanced Angular Micro Frontends with Dynamic Module Federation. 

## Based on the below websites. 
https://nx.dev/docs/technologies/angular/guides/dynamic-module-federation-with-angular 
https://www.angulararchitects.io/en/blog/dynamic-module-federation-with-angular/
https://dev.to/mayur_kulkarni_126/step-by-step-guide-to-angular-microfrontends-with-nx-and-dynamic-module-federation-2e04
https://www.youtube.com/watch?app=desktop&v=TLiL6EpeWJ4

## This project is under construction!

### Known bugs and TODOs:
- fix all warnings!
- fix lint errors!
- implement tests
- convert module federation to dynamic federation
- install sass and tailwind, therefore optimize css
- restyle all
- implement global error handling
- implement global wait spinner
- implement to put into HTTP header the corelation id for future use.
- optimize nx usage

## Create workspace:
1. pnpx create-nx-workspace@latest ng-mf --preset=apps
2. cd nx-mf-df
3. pnpx nx add @nx/angular
4. pnpx nx g @nx/angular:host apps/main-host --prefix=nx-mf-df
5. pnpx nx g @nx/angular:remote apps/mf_remote_a --prefix=nx-mf-df --host=main-host
6. pnpx nx g @nx/angular:remote apps/mf_remote_b --prefix=nx-mf-df --host=main-host
7. pnpx nx g @nx/angular:remote apps/mf_remote_home --prefix=nx-mf-df --host=main-host
8. npx nx g @nx/angular:library --name=common-ui-lib --directory=libs/common-ui-lib --standalone --buildable --publishable=false
9. npx nx g @nx/angular:component libs/common-ui-lib/src/lib/nx-version/angular-version.ts --standalone --export --no-interactive
10. npx nx g @nx/angular:component libs/common-ui-lib/src/lib/nx-version/nx-version.ts --standalone --export --no-interactive



<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your remote caching setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/z1u9lnAAlZ)


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

You can also lint individual projects directly:

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

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:
```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
