
# FE Microfrontend Architecture Proposal
## Modern Angular + Nx Dynamic Federation – Enterprise 

Author: Laszlo Kovari  
Status: Proposal   
Goal: Enterprise-grade, production-ready, long-term scalable, low-coupling microfrontend architecture for Angular 21 + Nx + Dynamic Module Federation.

Base repository: https://github.com/lkovari/nx-mf-dynamic-federation


# 1. Purpose and Context

The current state is a working Angular 21 + Nx workspace consisting of three remotes. The objective is not merely wiring microfrontends together, but designing a platform architecture that is:

- loosely coupled
- controlled in terms of technical debt
- domain-driven (DDD)
- vertically sliced
- maintainable in the long term
- deployment-independent
- observable and auditable
- runtime-configurable (e.g., log levels, feature flags) without redeployment where possible

Dynamic Module Federation allows the host to load remotes via a runtime manifest instead of build-time configuration. This enables:

- environment-specific remote URLs
- build once, deploy everywhere strategy
- temporary disabling of faulty remotes (kill switch)
- CDN replacement without rebuilding the host


# 2. Core Principles

1. The host (shell) acts as a platform: routing, layout, runtime configuration, authentication, observability, cross-app infrastructure.
2. Each remote represents a DDD Bounded Context with its own domain concepts and rules.
3. Remotes must not import each other directly.
4. The domain layer must remain framework-agnostic.
5. Business logic must never reside in components.
6. Cross-cutting technological concerns belong to dedicated platform/foundation libraries.
7. Versioning and compatibility must be explicit.
8. Observability and logging policies should be runtime-configurable.


# 3. Monorepo Structure (Nx)

apps/
  shell/
  mf-remote-a/
  mf-remote-b/
  mf-remote-c/

libs/
  platform/
    contracts/
    messaging/
    auth/
    telemetry/
    runtime-config/
    preferences/
    logging/
    versioning/
    foundation/
  data-access/
    http/
  ui/
    design-system/
  shared/
    util/
    i18n/


# 4. Simplified Remote Entry Structure

The previous exposed structure was overly complicated. The remote entry should be a thin entry point only.

apps/mf-remote-<context>/src/app/
  remote-entry/
    remote-entry.routes.ts      (exported routes)
    remote-entry.component.ts   (root component)
    remote-meta.ts              (id, version, capabilities, compatibility info)
  app-shell/
  features/
  shared/
  infra/

Rules for remote-entry:

- Only export and wiring logic
- No business logic
- No state
- No data-access code
- Contains remote meta and version information


# 5. Versioning System

Enterprise-grade systems require explicit compatibility control.

We version:

- Repository release
- Contract version
- Remote version
- Build metadata (git SHA, build time, CI number)

Library: libs/platform/versioning/

Contains:

- BuildInfo model
- Generated build-info file
- Contract version constants
- Compatibility checks
- Minimum host version handling

The host validates compatibility at runtime and may disable incompatible remotes gracefully.


# 6. Foundation Library (Technological Cross-Cutting Layer)

Name: libs/platform/foundation/

Responsibilities:

- HTTP interceptor chain
- Correlation ID management
- Global request ref-count
- Retry/backoff policy
- Exception normalization
- Storage adapters

This library contains platform-level infrastructure, not domain logic.


# 7. Messaging System (System / Feature / User Levels)

Library: libs/platform/messaging/

Levels:

1. System level – platform-wide events (auth, connectivity, maintenance)
2. Feature level – bounded context specific events
3. User level – user session related events

Implementation:

- Typed channels
- Scoped messaging
- Centralized handler registry in the host

Remotes communicate indirectly via contract-based events.


# 8. Business Logic Placement

Components remain thin.

Pattern:

UI → Facade → Use Case → Domain → Repository

Domain layer contains entities, value objects, invariants, and domain services.

State management (NgRx Signal Store) lives in:
features/<feature>/application/state/


# 9. Global Logging and Audit

Library: libs/platform/logging/

Capabilities:

- Structured logging
- Correlation ID integration
- Runtime-configurable log level
- Audit trail channel
- Multiple sinks (console, remote collector)

Logging policy may change at runtime via runtime-config or preferences.


# 10. HTTP Interceptor Chain

Auth Interceptors:
- Access token header
- Refresh token handling with queue deduplication

Foundation Interceptors:
- Correlation ID
- Loading ref-count
- Exception mapping

Telemetry:
- Angular global ErrorHandler
- Error reporting pipeline

Global spinner overlay rendered by host layout.


# 11. Continue Where You Left Off (Draft/Resume)

Optional enterprise feature.

Library: libs/platform/drafts/

Capabilities:

- Draft storage (local/session/IndexedDB)
- TTL policy
- User/feature scoped keys
- Restore prompt after login

Edge cases handled:

- User switching
- Schema version change
- PII compliance


# 12. Vertical Slice Feature Standard

features/<feature>/
  ui/
  application/
  domain/
  data-access/
  tests/

Rules:

- UI does not contain domain logic
- Application orchestrates
- Domain decides
- Data-access only fetches/persists data


# 13. Host Platform Structure

apps/shell/src/app/
  platform/
    providers/
    runtime-config/
    messaging/
    auth/
    telemetry/
    logging/
    versioning/
  layout/
  routes/
  pages/


# 14. Anti-Patterns

- Remote to Remote imports
- Domain using host services
- Business logic in components
- Shared “god” store
- Hardcoded URLs
- Overgrown contract


# 15. Final Considerations

With this architecture, remotes remain true bounded contexts, while the host platform stays stable, replaceable, and scalable. Technical debt is consciously controlled, platform responsibilities are clearly separated, and the system is prepared for long-term growth in an Angular + Nx + Dynamic Module Federation environment.

In practice, it is often advisable to begin with a well-structured monorepo architecture and introduce microfrontends only when justified by clear organizational or scalability needs. Reintegrating an already deployed microfrontend feature back into a monorepo structure can be costly and may require partial or complete rewrites.

Therefore, it is recommended to initially create smaller, well-defined functional “islands” that can evolve independently. The decision to elevate them into standalone microfrontends should always be supported by architectural and business impact analysis.
