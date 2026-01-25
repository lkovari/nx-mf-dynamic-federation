# NX (LATEST) – MOST COMMONLY USED DAILY COMMANDS

## RUN & DEVELOP
nx serve app
nx build app
nx test app
nx lint app

## RUN MULTIPLE PROJECTS
nx run-many -t build
nx run-many -t test
nx run-many -t lint --all

## AFFECTED (USED DAILY IN CI + LOCAL CHECKS)
nx affected -t build
nx affected -t test
nx affected -t lint
nx affected -t build test lint --parallel
nx affected -t build --base=main --head=HEAD

## PROJECT & DEPENDENCY INSPECTION
nx graph
nx graph --focus=app-name
nx show projects
nx show project my-lib

## GENERATORS (SCAFFOLDING)
nx g @nx/angular:app my-app
nx g @nx/angular:lib my-lib
nx g @nx/angular:component my-comp --project=my-lib
nx g @nx/react:app my-app
nx g @nx/react:lib my-lib

## CODE QUALITY
nx format:write
nx format:check
nx lint app

## CACHE & TROUBLESHOOTING
nx reset
nx build app --skip-nx-cache
nx build app --verbose

## STORYBOOK (COMMON IN UI LIBS)
nx storybook my-lib
nx build-storybook my-lib

## MODULE FEDERATION (WHEN USED)
nx g @nx/angular:host shell
nx g @nx/angular:remote mf-a --host=shell
nx serve shell

## WORKSPACE MAINTENANCE (OCCASIONAL BUT ESSENTIAL)
nx migrate latest
nx migrate --run-migrations
nx report

## DAILY RULE OF THUMB
- Local dev → nx serve / nx test
- Before commit → nx lint + nx test
- CI → nx affected
- Something broken → nx reset
- Dependency confusion → nx graph