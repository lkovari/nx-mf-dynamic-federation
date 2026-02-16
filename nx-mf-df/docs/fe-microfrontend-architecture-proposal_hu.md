# FE Microfrontend Architecture Proposal
## Modern Angular + Nx Dynamic Federation – Enterprise

Szerző: Kovári László  
Státusz: Proposal  
Cél: Enterprise-grade, production-grade, hosszú távon skálázható, alacsony csatolású (low coupling – laza csatolás) microfrontend architektúra Angular 21 + Nx + Dynamic Module Federation környezetben.

Repository alap: https://github.com/lkovari/nx-mf-dynamic-federation


# 1. Cél és kontextus

Jelenleg egy 3 remote-ból álló Angular 21 + Nx workspace áll rendelkezésre. A cél nem pusztán microfrontendek összedrótozása, hanem egy olyan platform-architektúra kialakítása, amely:

- lazán csatolt (low coupling – laza csatolás),
- minimális technikai adósságú (tech-debt – technikai adósság),
- domain-alapú (DDD),
- vertical sliced (vertikálisan szeletelt),
- hosszú távon karbantartható,
- deploy-független,
- auditálható és megfigyelhető (observability – megfigyelhetőség),
- runtime állítható (pl. log szint, feature flag) újradeploy nélkül, ahol értelmezhető.

A dinamikus Module Federation (Dynamic Module Federation) lehetővé teszi, hogy a host runtime manifestből olvassa ki a remote URL-eket, nem build-time konfigurációból. Ez biztosítja:

- környezetenként eltérő remote URL,
- build once, deploy everywhere működés,
- hibás remote ideiglenes letilthatósága (kill switch – lekapcsoló kapcsoló),
- CDN csere host rebuild nélkül.


# 2. Alapelvek

1. A host (shell) platform szerepet tölt be: routing, layout, runtime-config, auth, observability, cross-app infrastruktúra.
2. Egy remote = egy DDD Bounded Context: üzleti terület, saját fogalmak, saját szabályok.
3. Remote-ok nem importálják egymást. Nincs Remote → Remote path alias.
4. A domain réteg teljesen Angular- és platform-független (framework-agnostic – keretrendszerfüggetlen).
5. Üzleti logika nem kerül komponensbe: UI csak „render + interaction” (megjelenítés + interakció).
6. Cross-cutting (keresztmetszeti) technológiai funkciók dedikált „foundation” (alap) libekben élnek.
7. Verziózás és kompatibilitás explicit (contract versioning – szerződés verziózás): a host nem „vakon” tölt remote-ot.
8. Observability/Logging runtime állítható (log level, sinks, sampling), frontend újraindítás nélkül, ahol a platform engedi.


# 3. Monorepo szerkezet (Nx)

## 3.1 Apps

apps/
  shell/                 (host/platform)
  mf-remote-a/           (RemoteA bounded context)
  mf-remote-b/           (RemoteB bounded context)
  mf-remote-c/           (RemoteC bounded context)

## 3.2 Libs – javasolt enterprise csoportosítás

libs/
  platform/
    contracts/           (közös TypeScript szerződések: intent/event, tokenek, DTO-k)
    messaging/           (typed event bus + csatornák + handler keretrendszer)
    auth/                (auth facade + token kezelés + guardok, auth specifikus interceptorok)
    telemetry/           (error reporting + tracing hookok, global error pipeline)
    runtime-config/      (manifest + feature flag + remote kill switch + env)
    preferences/         (multi-level preference: system/feature/user, merge stratégia)
    logging/             (global logging + audit + runtime log config)
    versioning/          (build info + kompatibilitás + remote/contract verzió modellek)
    foundation/          (technológiai cross-cutting: HTTP interceptors, spinner, correlation, exception pipeline)
  data-access/
    http/                (HTTP kliens alapok, API client scaffolding, shared adapters)
  ui/
    design-system/       (UI komponensek, overlay/spinner UI)
  shared/
    util/                (általános util)
    i18n/                (lokalizáció)

Megjegyzés a névadásról: a „technológiai” gyűjtő lib neve szerintem **platform/foundation** a legjobb, mert azt jelzi, hogy ez nem domain, hanem keresztmetszeti alap-infrastruktúra (foundation – alap, infrastruktúra).


# 4. Exposed rész – egyszerűsítve

A korábbi „exposed” külön almappás struktúra túl lett bonyolítva. A cél itt csak egy *vékony belépési pont* (thin entry point – vékony belépési pont) a host felé.

Javasolt remote belső mappa-szerkezet (zárójelben röviden: mire való):

apps/mf-remote-<context>/src/app/
  remote-entry/                  (host által importált belépési pontok)
    remote-entry.routes.ts       (remote route exportok)
    remote-entry.component.ts    (root komponens / shell outlet)
    remote-meta.ts               (id, verzió, capabilities, minimum host/contract)
  app-shell/                     (remote bootstrap, providers, layout)
  features/                      (vertical slice-ok)
  shared/                        (remote-on belüli megosztott dolgok)
  infra/                         (platform adapterek: messaging/logger/telemetry/storage)

Szabályok a remote-entry-re:
- csak export és „wiring” (összekötés), semmi üzleti logika
- sem state, sem data-access, sem domain logika
- itt szerepel a remote meta + verzió + kompatibilitás (lásd Versioning fejezet)


# 5. Versioning system (verziózás) – egyszerű és működő enterprise megoldás

A verziózás célja nem dísz: enélkül könnyen jön a „kompatibilitási akna” (compatibility trap – kompatibilitási csapda). A legegyszerűbb, mégis hatékony megoldás:

## 5.1 Mit verziózunk?

- **Repo/Release** verzió (pl. 1.4.0)
- **Contract** verzió (pl. 2.1.0) – a host/remote kommunikációs szerződés
- **Remote** verzió (pl. mf-remote-a 0.8.3)
- **Build info**: git SHA, build time, CI build number

## 5.2 Hol legyen?

Lib: **libs/platform/versioning/**

Tartalom:
- BuildInfo modell + generált build-info.ts
- ContractVersion konstansok
- RemoteMetaVersion mezők (minimum host/contract)
- Kompatibilitás ellenőrzés (compatibility check – kompatibilitás ellenőrzés)

## 5.3 Hogyan generáljuk legegyszerűbben?

Legkevesebb „okoskodás” (lowest ceremony – legalacsonyabb ceremónia):
- egy Node script build előtt generál egy TS fájlt (pl. libs/platform/versioning/src/lib/build-info.generated.ts)
- Nx target-ba bekötjük: `dependsOn: ["^build-info"]` vagy egy dedikált `prebuild` target

A remote meta például tartalmazza:
- remoteId
- remoteVersion
- contractVersion
- minimumHostVersion (optional)
- buildSha
- buildTimeUtc

A host manifest loader pedig (runtime-config lib) ellenőrzi:
- contractVersion kompatibilitás
- minimumHostVersion feltétel (ha használjuk)
- ha nem kompatibilis: remote letiltás + user-friendly fallback (kíméletes degradáció – graceful degradation)


# 6. „Technológiai” cross-cutting lib – név és felelősség

A kérdés: hová tegyük a wait spinner-t, HTTP interceptorokat (auth, correlation), global exception pipeline-t?

Javaslat: **libs/platform/foundation/**

Miért ez a jó név?
- nem keveri össze a domain vagy data-access szereppel
- deklarálja, hogy platform-szintű alap-infrastruktúra
- vállalati környezetben is jól olvasható: „foundation layer”

Mit tartalmazzon (tipikusan):
- HTTP interceptor chain (auth/correlation/loading/exception)
- request ref-count (globális request számláló)
- retry/backoff policy (ha kell)
- global exception „normalizer” (egységesített hibák)
- platform szintű storage adapterek (session/local, encryption ha kell)


# 7. Messaging rendszer – system/feature/user szintek

A messaging nem csak „event bus”. Enterprise környezetben kell a *szintezés* (scoping – hatókör), hogy ne legyen zaj és véletlen coupling.

Lib: **libs/platform/messaging/**

Szintek:
1) **System level** (rendszer): platform események (auth state, connectivity, maintenance, kill switch, global error)
2) **Feature level** (feature): adott bounded context-en belüli intent/event (pl. „order:created”)
3) **User level** (felhasználó): user-specifikus események (preferences changed, user session actions)

Implementációs javaslat (elvben):
- Typed channels (csatornák): `system$`, `feature$(featureId)`, `user$(userId)`
- Policy: mit szabad persistálni (tartósítani) és meddig (TTL – időkorlát)
- Handler registry: host oldalon centralizált handlerek (toast, navigate, modal, telemetry)

Fontos: a „Remote → Remote” kommunikáció továbbra is *közvetett* (indirect – közvetett), contracton és messagingen át, direkt import nélkül.


# 8. Üzleti logika: komponensek nélkül – mi a célszerű megoldás?

A komponens legyen „vékony”:
- template binding
- user input események
- routing paraméterek olvasása
- semmi domain szabály, semmi „összeadás/validálás logika”

Célszerű minta:
UI → Facade → Use Case → Domain → Repository

Hová kerül a logika?
- **Application rétegbe**: use-case, orchestráció, state
- **Domain rétegbe**: invariánsok, validáció, értékobjektumok (value object – értékobjektum)

State management (NgRx Signal Store) javasolt helye:
features/<feature>/application/state/


# 9. Global logging + audit + runtime kapcsolhatóság

Enterprise elvárás: tudjak logolni
- hibát (error),
- kritikus edge case-t (edge case – szélső eset),
- audit eseményt (audit trail – audit nyomvonal),
- működésmetrikát (telemetry – telemetria),
és mindezt úgy, hogy a log szint/szabály (policy) lehetőleg *runtime állítható* legyen „frontend leállítása nélkül” (no restart – újraindítás nélkül).

Lib: **libs/platform/logging/**

Tartalom:
- Logger interface (structured log mezőkkel: correlationId, userId, featureId, severity)
- Sink-ek: Console, Remote collector, In-memory buffer (hibadiagnosztikához)
- Runtime log config: log level, sampling (mintavételezés), kategóriák
- Audit logger (külön csatorna): üzleti jelentőségű műveletek

Honnan jön a runtime config?
- **runtime-config** libből (manifest/feature flags)
- user preferencesből (preferences lib) – ha user szinten engedett
- remote config endpointból (opcionális)

Megjegyzés: „frontend leállítása nélkül” a gyakorlatban azt jelenti, hogy a logolási policy dinamikusan frissül, nem az, hogy a bundle kódja változik. A policy változhat: mi logoljon és milyen részletességgel.


# 10. HTTP Interceptor rendszer – enterprise lánc

A javasolt interceptorok helye:
- technológiai lánc: **platform/foundation**
- auth specifikus: **platform/auth**
- error/telemetry: **platform/telemetry**
- shared HTTP alapok: **data-access/http**

## 10.1 Auth interceptor (access/refresh token)

libs/platform/auth/
- AuthHeaderInterceptor (access token header)
- RefreshTokenInterceptor (401 esetén refresh, deduplikált queue)
- TokenQueueService (single refresh, request retry)

## 10.2 Correlation ID interceptor

libs/platform/foundation/
- CorrelationIdService (generál/tárol)
- CorrelationIdInterceptor (X-Correlation-ID header)

## 10.3 Global exception handler (interceptor + ErrorHandler)

libs/platform/foundation/
- ExceptionMappingInterceptor (HTTP hibák normalizálása)
libs/platform/telemetry/
- GlobalErrorHandler (Angular error pipeline)
- ErrorReporter (telemetry sink)

## 10.4 Global wait spinner – ref-count alapú

libs/platform/foundation/
- LoadingRefCountService
- LoadingInterceptor (ref++/ref--, exclude list: polling, background)

UI megjelenítés:
libs/ui/design-system/
- SpinnerOverlayComponent

Host rendereli:
apps/shell/layout/
- globális overlay, egységes UX


# 11. Continue where you left off (folytatás ott, ahol abbahagyta) – opcionális enterprise feature

Cél:
- felhasználó részleges adatkitöltése (draft – piszkozat) ne vesszen el
- login után a rendszer rákérdezhet: „Folytatod a megkezdett kitöltést?”
- feature szinten konfigurálható (nem mindenhol kell)

Lib javaslat: **libs/platform/drafts/** vagy **libs/platform/continuations/**  
(én a „drafts” nevet szeretem, mert tiszta: form draft, wizard draft)

Mit tartalmazzon:
- DraftStore (storage adapterrel: local/session/IndexedDB)
- DraftPolicy (TTL, encryption, PII szabályok)
- DraftKey strategy (userId + featureId + formId)
- ResumePrompt API (host UI integráció: modal/toast)

Flow:
- feature ment draftot (application réteg)
- login után host felméri, van-e draft
- host kérdez: restore / discard
- restore esetén a feature store beolvassa a draft state-et

Fontos edge case-ek:
- user váltás (draft ne keveredjen)
- verziózás (ha a form schema változott, migráció vagy discard)
- PII/kompliance: mit mentünk kliens oldalon?


# 12. Vertical Slice Feature Standard – kötelező minimum

Minden feature azonos struktúrát követ:

features/<feature>/
  ui/            (page, container, presentational)
  application/   (use-case, facade, orchestration, state)
  domain/        (entity, value object, rules, invariants)
  data-access/   (repositories, api adapters, dto mapping)
  tests/         (unit: domain/application, integration: api adapter)

Rövid szabály:
- UI nem hív HTTP-t és nem tartalmaz domain szabályt
- application koordinál, domain dönt
- data-access csak adatot hoz/visz


# 13. Shell (host) struktúra – enterprise platform

apps/shell/src/app/
  platform/
    providers/        (interceptor chain, messaging, logging, auth wiring)
    runtime-config/   (manifest + flags + kill switch)
    messaging/        (system handlers: toast, navigate, modal)
    auth/             (guards, session lifecycle)
    telemetry/        (global error, tracing)
    logging/          (runtime log policy UI/bridge)
    versioning/       (compat check + fallback)
  layout/             (header/nav/footer + global spinner overlay)
  routes/             (local + remote routes)
  pages/              (home, not-found, maintenance, settings)


# 14. Tiltott minták (non-negotiable)

- Remote → Remote import
- „hoston levő” szolgáltatás direkt használata a domainből
- domain logika komponensben
- közös cross-domain store
- „mindent shared-be” reflex
- hardcoded URL, hardcoded remote mapping
- túl nagy contract (god contract – isten contract)



# 16. Záró gondolatok

A bemutatott architektúra biztosítja, hogy a remote alkalmazások valódi bounded context-ek maradjanak, miközben a host platform stabil, cserélhető és hosszú távon fenntartható marad. A technikai adósság (tech-debt – technikai adósság) tudatosan kontrollált, a platform-komponensek elkülönítettek, és a rendszer skálázható módon képes kiszolgálni a jövőbeli üzleti és technológiai igényeket Angular + Nx + Dynamic Module Federation környezetben.

Gyakorlati tapasztalatok alapján első lépésként jellemzően célszerűbb egy jól strukturált, fegyelmezett monorepo architektúrára építeni, és csak indokolt esetben bevezetni a microfrontend megközelítést. Egy már éles környezetben, aktívan használt microfrontend feature visszaintegrálása a monorepo struktúrába rendkívül költséges, és jellemzően csak részleges vagy teljes újraimplementációval (rewrite – újraírás) valósítható meg.

Ezért stratégiai szempontból ajánlott kezdetben kisebb, jól körülhatárolt funkcionális egységeket („szigeteket”) kialakítani, amelyek önállóan is értelmezhetők és később is rugalmasan átszervezhetők. Ezeknek a komponenseknek és feature-öknek a leválasztását, újrahasznosítását és esetleges microfrontenddé emelését minden esetben előzetes architekturális és üzleti hatáselemzés alapján szükséges megtervezni.
