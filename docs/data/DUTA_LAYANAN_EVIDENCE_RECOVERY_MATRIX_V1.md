# DUTA Layanan WNI — Evidence Recovery Matrix V1

Status: LAYANAN-2D product-owner service decision recorded; hosted population completed and validated
Canonical evidence: `docs/data/DUTA_LAYANAN_OPERATIONAL_EVIDENCE_V1.md`  

## Classification contract

Every row belongs to exactly one class:

- `RESOLVED_PUBLISHABLE`: exact fact, currentness, model mapping, and target-specific evidence locator are sufficient for a publication candidate.
- `RESOLVED_NON_PUBLIC`: exact fact is retained but deliberately excluded from public output.
- `RESOLVED_HISTORICAL`: exact historical fact retained for audit and never treated as current.
- `RESOLVED_MODELING_DEBT`: exact fact exists but the current schema cannot represent it safely without an unsupported mapping.
- `SUPERSEDED`: exact older fact is replaced by a newer approved fact.
- `UNRESOLVED_EXACT_FIELD`: a mandatory exact value or target-specific evidence locator is absent.

## Mission readiness

| Mission | Office | Jurisdiction | Concrete services | Contacts | Fees | Appointment/handoff | Qualifying evidence | Minimum ready |
|---|---|---|---|---|---|---|---|---|
| KBRI-KUL | RESOLVED_PUBLISHABLE candidate | frozen 6/6; evidence association pending | 6 category relationships supported by 29 tariff facts | website is RESOLVED_MODELING_DEBT; exact referenced hotlines missing | 29 values/current date recovered; target evidence locator unresolved | none recovered | tariff decision reference recovered; exact URL/item missing | NO |
| KJRI-JHB | RESOLVED_PUBLISHABLE candidate | frozen 4/4; evidence association pending | CONSULAR, EMPLOYMENT, CITIZENSHIP, MARITIME plus IMMIGRATION/PROTECTION contact evidence | 2 category-mappable publishable candidates; 4 modeling-debt/unresolved | exact tariff rows/date missing | KSATRIA purpose mapping unresolved | exact contact facts recovered; target evidence locators unresolved | NO |
| KJRI-PEN | RESOLVED_PUBLISHABLE candidate | frozen 3/3; evidence association pending | CONSULAR and PROTECTION supported by contacts; 2026 tariff set exists | 2 category-mappable candidates; portal and 4 general facts non-public/modeling debt | exact 2026 rows/effective date missing | portal requires current HTTPS/health evidence | decision references recovered; target evidence URL/item missing | NO |
| KJRI-KCH | RESOLVED_PUBLISHABLE candidate | frozen 1/1; evidence association pending | PROTECTION, EMPLOYMENT, IMMIGRATION | 4 category-mappable candidates; 5 general/APOWAKIM modeling debt | official decision known; exact values/currentness missing | none recovered | decision reference recovered; target evidence URL/item missing | NO |
| KJRI-BKI | RESOLVED_PUBLISHABLE candidate | frozen 23/23; evidence association pending | 5 category relationships supported by 23 tariff facts | appointment/general facts are modeling debt without exact service-category mapping | 23 values/current date recovered; target evidence locator unresolved | appointment communication number recovered, not a general hotline | exact tariff evidence URL/item missing | NO |
| KRI-TWU | RESOLVED_PUBLISHABLE candidate | frozen 5/5; evidence association identities recovered | 6 category relationships supported by 28 tariff facts | 4 general facts are modeling debt | 28 values/current date recovered; target evidence locator unresolved | 2021 domain RESOLVED_HISTORICAL | exact tariff evidence URL/item missing | NO |

No mission is declared minimum-ready solely from an official homepage. The target-specific service/tariff evidence locator required by `official_service_evidence` remains a mandatory gate.

## Recovered inventory

| Record family | Recovered | Candidate classification | Publication blocker |
|---|---:|---|---|
| Mission identities | 6 | RESOLVED_PUBLISHABLE candidates | hosted collision/evidence associations not run |
| Frozen jurisdictions | 42 | RESOLVED_PUBLISHABLE candidates | target-specific evidence associations not materialized |
| Stable service categories | 7 | taxonomy resolved | category IDs/collisions not yet generated and checked |
| Mission-service category relationships | 28 planned from exact facts | UNRESOLVED_EXACT_FIELD | exact target evidence URL/item missing |
| Exact current fee facts | 80 | UNRESOLVED_EXACT_FIELD | exact target evidence URL/item missing |
| Exact contact/endpoint facts | 30 | mixed | 8 category-mappable; general-purpose schema debt; exact target evidence locator missing |
| Exact requirements | 0 | UNRESOLVED_EXACT_FIELD | no evidence supplied |
| Exact hours | 0 | UNRESOLVED_EXACT_FIELD | no evidence supplied |
| Exact historical appointment | 1 | RESOLVED_HISTORICAL | current reverification absent |
| Penang historical tariff family | 1 family | SUPERSEDED | exact older rows not supplied |
| Kuching date-uncertain tariff family | 1 family | UNRESOLVED_EXACT_FIELD | exact amounts and target locator absent |

## Contact reconciliation

Category-mappable contact candidates, subject to target-specific evidence locators:

1. KJRI-JHB IMMIGRATION `+60177716866`
2. KJRI-JHB PROTECTION `+60167700378`
3. KJRI-PEN CONSULAR/service `+601112460970`
4. KJRI-PEN PROTECTION `+60109491859`
5. KJRI-KCH PROTECTION `+60168866734`
6. KJRI-KCH DEATH_OF_WNI/PROTECTION `+60168899734`
7. KJRI-KCH EMPLOYMENT `+60128801288`
8. KJRI-KCH IMMIGRATION `+60105954699`

General office websites, emails, and telephone values remain `RESOLVED_MODELING_DEBT` because `office_contact_channels.service_category_id` is mandatory and no approved general-information category exists. The database constraint is not weakened.

KJRI-BKI TEMAN BAIK remains appointment-only and is not remapped to a service category without evidence. KJRI-JHB KSATRIA and KJRI-KCH APOWAKIM retain their exact purpose labels but remain non-public until their category semantics are established.

## Evidence locator reconciliation

| Evidence family | Source identity | Recovered locator/reference | Classification |
|---|---|---|---|
| Mission homepages | six Registry source IDs | exact official HTTPS homepage per mission | sufficient for source/identity provenance only |
| KBRI-KUL tariff | KBRI-KUL | `SK.070/PK/04/2026/01`, dated 2026-04-15 | UNRESOLVED_EXACT_FIELD: exact publication URL or official_source_item missing |
| KJRI-BKI tariff | KJRI-BKI | effective 2026-05-05; document locator absent | UNRESOLVED_EXACT_FIELD |
| KRI-TWU tariff | KRI-TWU | effective 2026-05-01; document locator absent | UNRESOLVED_EXACT_FIELD |
| KJRI-PEN tariff | KJRI-PEN | `SK 044.1.SK/KU/VII/2025` and `SK 085.SK/KU/XI/2025` | UNRESOLVED_EXACT_FIELD: exact rows and locator missing |
| KJRI-KCH tariff | KJRI-KCH | `SK.00010/KU/11/2024/10/1/KCH`, dated 2024-11-26 | UNRESOLVED_EXACT_FIELD: exact rows/locator/currentness missing |
| KJRI-JHB tariff | KJRI-JHB | service families only | UNRESOLVED_EXACT_FIELD: decision, rows, date, locator missing |
| KRI-TWU appointment | KRI-TWU | `temujanjiantrianpelayanankritawau.org`, evidence date 2021-11-23 | RESOLVED_HISTORICAL |

An official homepage is not substituted for the missing target-specific tariff publication locator.

## Deterministic package gate

Deterministic UUID generation for service categories, mission services, fees, contacts, and evidence associations is intentionally deferred. Generating IDs before the exact evidence target inventory is closed would produce an apparently complete package whose qualifying evidence cannot pass the curated publication contract.

Existing deterministic office/jurisdiction identities from LAYANAN-1 remain authoritative and collision candidates are covered by the existing SELECT-only preflights.

## Hosted execution decision

Phase E status: NOT RUN. A complete deterministic package does not yet exist, so hosted collision results could not prove all required service, fee, contact, and evidence identities.

Phase F status: NOT AUTHORIZED BY GATES. No hosted write was attempted.

Required recovery before a new GO/NO-GO:

1. exact official evidence URL or existing `official_source_items.id` for each tariff/service evidence family;
2. exact Penang, Kuching, and Johor Bahru tariff rows if they are to be populated;
3. exact evidence locators for category-mappable contacts;
4. an approved model for general office contacts, or explicit non-public retention;
5. controlled verification timestamp chosen only when the reviewed transaction is ready to execute.

## Evidence locator recovery outcome

The focused locator pass recovered 16 distinct first-party locator URLs and normalized 45 target-scoped locator associations in the canonical manifest.

Re-evaluation of the requested candidates:

- Mission-service candidates: 17/28 now have exact first-party locators supporting their category relationship.
- Purpose-specific contacts: 6/8 now have exact official locator coverage. Penang’s two numbers remain excluded pending their exact official page.
- Fee candidates: 0/80 resolved. None of the recovered pages is the exact tariff publication for the 80 KUL/BKI/TWU fee rows, and homepages were not substituted.
- Mission core readiness: 6/6. Each mission now has an office source, frozen jurisdiction baseline, and at least one concrete service with a first-party locator. Fees and contacts are optional enrichment under the approved minimum-readiness rule.

The remaining eleven mission-service candidates may be excluded from the first controlled package. The first package must include only the 17 resolved relationships and 6 resolved purpose contacts, and must exclude all 80 fee candidates.

Deterministic IDs may now be finalized for the resolved subset. Population SQL may be prepared but must remain review-only and fail closed around every excluded record.

## LAYANAN-2D product-owner decision

On 2026-08-15, the product owner approved all 28 canonical mission-service relationships as DUTA `verified` operational services. This editorial decision does not manufacture target-specific evidence URLs and does not make the 80 fee facts public.

- 28/28 services are DUTA verified.
- 17/28 have a target-specific locator and may be enabled only after every other existing publication predicate passes.
- 11/28 retain the audit annotation `GRANULAR_EVIDENCE_LOCATOR_PENDING` and remain disabled with `publishability_status = UNVERIFIED` because `private.has_approved_service_evidence('mission_service', service.id)` cannot truthfully pass.
- The deterministic record inventory is frozen in `duta-layanan-2d-product-owner-decision.json`.
- This decision supersedes only the earlier `UNVERIFIED_EXACT_FIELD` classification for service existence; it does not supersede locator, fee, contact, temporal, conflict, or parent-chain gates.
