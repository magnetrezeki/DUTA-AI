# DUTA Layanan WNI — Master Operational Evidence Manifest V1

Status: product-owner-reviewed evidence normalization; deployed population audit record
Country: MY  
Mission set: KBRI-KUL, KJRI-JHB, KJRI-PEN, KJRI-KCH, KJRI-BKI, KRI-TWU  
Hosted execution: completed and validated for the approved parent and child population

This file records facts approved by the product owner for later population review. It does not itself publish data. Each row is a separate claim; shared evidence does not merge target-specific evidence associations.

## Evidence and timestamp policy

- Mission source IDs are the existing Master Source Registry identities.
- `last_verified_at` is assigned only at a controlled population review/execution checkpoint. It records DUTA verification, not source publication time.
- An explicit source effective date is retained where supplied. A missing date remains unknown.
- `VERIFIED_OFFICIAL` is the intended publication state only after collision, evidence-association, conflict, temporal, and parent-chain gates pass.
- `OFFICIAL_BUT_DATE_UNCERTAIN` is allowed only for curated fees under the existing database policy.
- Historical evidence remains non-public until current reverification.

## Stable fact identity rule

Canonical fact keys use `MISSION:TARGET_TYPE:STABLE_CODE`. These keys are independent of insertion order. Later population SQL must map them into the existing deterministic UUID namespaces and must never use random UUID generation.

## Mission identity baseline

| Fact key | Mission | Source ID | Identity state | Jurisdiction source |
|---|---|---|---|---|
| KBRI-KUL:OFFICE:IDENTITY | KBRI-KUL | `71000000-0000-0000-0000-000000000001` | VERIFIED baseline | Frozen LAYANAN-1 manifest |
| KJRI-JHB:OFFICE:IDENTITY | KJRI-JHB | `71000000-0000-0000-0000-000000000006` | VERIFIED baseline | Frozen LAYANAN-1 manifest |
| KJRI-PEN:OFFICE:IDENTITY | KJRI-PEN | `71000000-0000-0000-0000-000000000009` | VERIFIED baseline | Frozen LAYANAN-1 manifest |
| KJRI-KCH:OFFICE:IDENTITY | KJRI-KCH | `71000000-0000-0000-0000-000000000016` | VERIFIED baseline | Frozen LAYANAN-1 manifest |
| KJRI-BKI:OFFICE:IDENTITY | KJRI-BKI | `71000000-0000-0000-0000-000000000014` | VERIFIED baseline | Frozen LAYANAN-1 manifest |
| KRI-TWU:OFFICE:IDENTITY | KRI-TWU | `71000000-0000-0000-0000-000000000019` | VERIFIED baseline | Frozen LAYANAN-1 manifest |

## Stable service taxonomy

The following categories and stable service codes are proven by the named tariff evidence. Registry category scopes are not used as service records.

| Category | Proven service codes |
|---|---|
| IMMIGRATION | PASSPORT_STANDARD, PASSPORT_STANDARD_48, PASSPORT_STANDARD_5Y, PASSPORT_ELECTRONIC, PASSPORT_ELECTRONIC_48, PASSPORT_ELECTRONIC_5Y, PASSPORT_EXPEDITED, PASSPORT_EXPEDITED_SAME_DAY, PASSPORT_LOST, PASSPORT_LOST_STANDARD, PASSPORT_LOST_ELECTRONIC, PASSPORT_DAMAGED, PASSPORT_DAMAGED_STANDARD, PASSPORT_DAMAGED_ELECTRONIC, SPLP, DUAL_NATIONALITY_AFFIDAVIT, VISA_VISIT_TOURISM, VISA_VISIT_BUSINESS, VISA_VERIFICATION_BUSINESS_ETC, VISA_TOURISM_SINGLE_ENTRY_LT60D, VISA_NON_TOURISM_SINGLE_ENTRY_LT60D |
| CONSULAR | BIRTH_CERTIFICATE_EXTRACT, MARRIAGE_CERTIFICATE_EXTRACT, DIVORCE_CERTIFICATE_EXTRACT, DEATH_CERTIFICATE_EXTRACT, CHILD_APPOINTMENT_CERTIFICATE, RELEASE_OF_CITIZENSHIP_CERTIFICATE, CHANGE_OF_RESIDENCE_CERTIFICATE, DRIVING_LICENSE_CERTIFICATE, DRIVING_LICENSE_REPLACEMENT_CERTIFICATE, BUSINESS_CERTIFICATE |
| LEGALIZATION | LEGALIZATION_BUSINESS_DOCUMENT, LEGALIZATION_NON_BUSINESS_DOCUMENT, LEGALIZATION_ACADEMIC_DOCUMENT |
| EMPLOYMENT | JOB_ORDER_LEGALIZATION, EMPLOYMENT_CONTRACT_LEGALIZATION |
| CITIZENSHIP | LOSS_OF_CITIZENSHIP_CERTIFICATE |
| MARITIME | SEAMAN_BOOK_EXTENSION, NEW_SEAMAN_BOOK, SEA_SERVICE_CERTIFICATE, SIGN_ON, SIGN_OFF |
| PROTECTION | Contact-supported operational category only; no additional service claim inferred |

## KRI Tawau

Source identity: `71000000-0000-0000-0000-000000000019`  
Evidence type: A — official government/Kemlu  
Official URL: `https://kemlu.go.id/tawau`

### Office and jurisdiction facts

| Fact | Target | State | Effective date | Currentness | Normalization note |
|---|---|---|---|---|---|
| Office identity | Konsulat Republik Indonesia Tawau, Tawau, Sabah, MY | VERIFIED | unknown | publication target VERIFIED_OFFICIAL | Existing office ID `75000000-0000-0000-0000-000000000006` |
| District jurisdiction | Tawau | VERIFIED | unknown | frozen current baseline | Existing jurisdiction ID ending `016` |
| District jurisdiction | Kalabakan | VERIFIED | unknown | frozen current baseline | Existing jurisdiction ID ending `020` |
| District jurisdiction | Kunak | VERIFIED | unknown | frozen current baseline | Existing jurisdiction ID ending `017` |
| District jurisdiction | Lahad Datu | VERIFIED | unknown | frozen current baseline | Existing jurisdiction ID ending `019` |
| District jurisdiction | Semporna | VERIFIED | unknown | frozen current baseline | Existing jurisdiction ID ending `018` |

No whole-Sabah KRI Tawau jurisdiction is authorized.

### Contacts

| Fact key | Type/purpose | Raw value | Normalized value | Verification/currentness |
|---|---|---|---|---|
| KRI-TWU:CONTACT:WEBSITE | website / GENERAL | `https://kemlu.go.id/tawau` | unchanged HTTPS URL | VERIFIED fact; publication category mapping unresolved |
| KRI-TWU:CONTACT:EMAIL | email / GENERAL | `tawau.kri@kemlu.go.id` | lowercase unchanged | VERIFIED fact; publication category mapping unresolved |
| KRI-TWU:CONTACT:PHONE_1 | phone / GENERAL | `+60 89 772052` | `+6089772052` | VERIFIED fact; not a service hotline |
| KRI-TWU:CONTACT:PHONE_2 | phone / GENERAL | `+60 89 752969` | `+6089752969` | VERIFIED fact; not a service hotline |

### Tariffs

Evidence: official 2026 tariff; effective `2026-05-01`; currency MYR; intended state VERIFIED_CURRENT after database gates pass.

| Category | Service code | Label | Amount MYR |
|---|---|---|---:|
| IMMIGRATION | PASSPORT_STANDARD_48 | Paspor Biasa 48 Halaman | 85 |
| IMMIGRATION | SPLP | Surat Perjalanan Laksana Paspor untuk WNI | 25 |
| IMMIGRATION | PASSPORT_LOST | Biaya Beban Paspor Hilang | 240 |
| IMMIGRATION | PASSPORT_DAMAGED | Biaya Beban Paspor Rusak | 120 |
| IMMIGRATION | PASSPORT_ELECTRONIC_48 | Paspor Biasa 48 Halaman Elektronik | 155 |
| IMMIGRATION | PASSPORT_EXPEDITED_SAME_DAY | Percepatan paspor hari yang sama | 240 |
| IMMIGRATION | DUAL_NATIONALITY_AFFIDAVIT | Affidavit kewarganegaraan ganda | 120 |
| IMMIGRATION | VISA_VISIT_TOURISM | Visa kunjungan wisata | 240 |
| IMMIGRATION | VISA_VISIT_BUSINESS | Visa kunjungan bisnis | 240 |
| IMMIGRATION | VISA_VERIFICATION_BUSINESS_ETC | Verifikasi visa bisnis dan terkait | 240 |
| CONSULAR | BIRTH_CERTIFICATE_EXTRACT | Kutipan akta kelahiran | 0 |
| CONSULAR | MARRIAGE_CERTIFICATE_EXTRACT | Kutipan akta perkawinan | 0 |
| CONSULAR | DIVORCE_CERTIFICATE_EXTRACT | Kutipan akta perceraian | 0 |
| CONSULAR | DEATH_CERTIFICATE_EXTRACT | Kutipan akta kematian | 0 |
| CONSULAR | CHILD_APPOINTMENT_CERTIFICATE | Surat keterangan pengangkatan anak | 0 |
| CONSULAR | RELEASE_OF_CITIZENSHIP_CERTIFICATE | Surat keterangan pelepasan kewarganegaraan | 0 |
| CONSULAR | CHANGE_OF_RESIDENCE_CERTIFICATE | Surat keterangan pindah domisili | 0 |
| CONSULAR | DRIVING_LICENSE_REPLACEMENT_CERTIFICATE | Surat keterangan pengganti SIM | 100 |
| CONSULAR | BUSINESS_CERTIFICATE | Surat keterangan usaha | 565 |
| LEGALIZATION | LEGALIZATION_BUSINESS_DOCUMENT | Legalisasi dokumen bisnis | 565 |
| LEGALIZATION | LEGALIZATION_NON_BUSINESS_DOCUMENT | Legalisasi dokumen nonbisnis | 125 |
| LEGALIZATION | LEGALIZATION_ACADEMIC_DOCUMENT | Legalisasi dokumen akademik | 0 |
| EMPLOYMENT | JOB_ORDER_LEGALIZATION | Legalisasi job order | 0 |
| EMPLOYMENT | EMPLOYMENT_CONTRACT_LEGALIZATION | Legalisasi kontrak kerja | 0 |
| CITIZENSHIP | LOSS_OF_CITIZENSHIP_CERTIFICATE | Surat keterangan kehilangan kewarganegaraan | 120 |
| MARITIME | SEAMAN_BOOK_EXTENSION | Perpanjangan buku pelaut | 5 |
| MARITIME | NEW_SEAMAN_BOOK | Buku pelaut baru | 30 |
| MARITIME | SEA_SERVICE_CERTIFICATE | Surat keterangan masa berlayar | 5 |

Historical appointment evidence: `temujanjiantrianpelayanankritawau.org`, observed `2021-11-23`. State: HISTORICAL / REQUIRES CURRENT REVERIFICATION. It must not be published as current and is not promoted to an HTTPS appointment URL without fresh evidence.

## KJRI Kota Kinabalu

Source identity: `71000000-0000-0000-0000-000000000014`  
Official URL: `https://kemlu.go.id/kotakinabalu`  
Tariff effective date: `2026-05-05`

### Contacts

| Fact key | Purpose | Raw value | Normalized | State |
|---|---|---|---|---|
| KJRI-BKI:CONTACT:WEBSITE | GENERAL | official URL above | unchanged | VERIFIED fact; general category mapping unresolved |
| KJRI-BKI:CONTACT:INFORMATION | GENERAL information hotline | `+60 14 606 0067` | `+60146060067` | VERIFIED |
| KJRI-BKI:CONTACT:TEMAN_BAIK | APPOINTMENT schedule communication only | `+62 857 2030 5600` | `+6285720305600` | VERIFIED; never general hotline |

### Tariffs

| Category | Service code | Amount MYR |
|---|---|---:|
| IMMIGRATION | PASSPORT_STANDARD_5Y | 85 |
| IMMIGRATION | PASSPORT_ELECTRONIC_5Y | 155 |
| IMMIGRATION | SPLP | 25 |
| IMMIGRATION | PASSPORT_LOST | 240 |
| IMMIGRATION | PASSPORT_DAMAGED | 120 |
| IMMIGRATION | PASSPORT_EXPEDITED_SAME_DAY | 240 |
| IMMIGRATION | DUAL_NATIONALITY_AFFIDAVIT | 120 |
| CONSULAR | BIRTH_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | MARRIAGE_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | DIVORCE_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | DEATH_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | CHILD_APPOINTMENT_CERTIFICATE | 0 |
| CONSULAR | RELEASE_OF_CITIZENSHIP_CERTIFICATE | 0 |
| CONSULAR | CHANGE_OF_RESIDENCE_CERTIFICATE | 0 |
| CONSULAR | DRIVING_LICENSE_REPLACEMENT_CERTIFICATE | 100 |
| CONSULAR | BUSINESS_CERTIFICATE | 565 |
| LEGALIZATION | LEGALIZATION_BUSINESS_DOCUMENT | 565 |
| LEGALIZATION | LEGALIZATION_NON_BUSINESS_DOCUMENT | 125 |
| LEGALIZATION | LEGALIZATION_ACADEMIC_DOCUMENT | 0 |
| MARITIME | SEAMAN_BOOK_EXTENSION | 5 |
| MARITIME | SIGN_ON | 0 |
| MARITIME | SIGN_OFF | 0 |
| CITIZENSHIP | LOSS_OF_CITIZENSHIP_CERTIFICATE | 120 |

All listed fees are intended VERIFIED_CURRENT after review-time verification metadata and database gates are applied.

## KJRI Kuching

Source identity: `71000000-0000-0000-0000-000000000016`  
Official URL: `https://kemlu.go.id/kuching`  
Tariff decision: `SK.00010/KU/11/2024/10/1/KCH`, dated `2024-11-26`.

### Contacts

| Fact key | Purpose | Raw value | Normalized | State |
|---|---|---|---|---|
| KJRI-KCH:CONTACT:WEBSITE | GENERAL | official URL above | unchanged | VERIFIED fact; general category mapping unresolved |
| KJRI-KCH:CONTACT:EMAIL | GENERAL | `kuching.kjri@kemlu.go.id` | lowercase unchanged | VERIFIED fact; general category mapping unresolved |
| KJRI-KCH:CONTACT:PHONE_1 | GENERAL | `+60 82 460734` | `+6082460734` | VERIFIED fact; general category mapping unresolved |
| KJRI-KCH:CONTACT:PHONE_2 | GENERAL | `+60 82 461734` | `+6082461734` | VERIFIED fact; general category mapping unresolved |
| KJRI-KCH:CONTACT:PROTECTION | GENERAL_COMPLAINT / CONSULAR_PROTECTION | `+60 16 886 6734` | `+60168866734` | VERIFIED; map to PROTECTION |
| KJRI-KCH:CONTACT:DEATH | DEATH_OF_WNI | `+60 16 889 9734` | `+60168899734` | VERIFIED; map to PROTECTION |
| KJRI-KCH:CONTACT:EMPLOYMENT | EMPLOYMENT | `+60 12 880 1288` | `+60128801288` | VERIFIED; map to EMPLOYMENT |
| KJRI-KCH:CONTACT:IMMIGRATION | IMMIGRATION | `+60 10 595 4699` | `+60105954699` | VERIFIED; map to IMMIGRATION |
| KJRI-KCH:CONTACT:APOWAKIM | APOWAKIM | `+60 10 954 6570` | `+60109546570` | VERIFIED purpose label; category mapping requires definition before population |

The decision proves an official tariff evidence set, but exact tariff rows were not included in this normalization instruction. No values are invented. Any later normalized rows must use OFFICIAL_BUT_DATE_UNCERTAIN unless separate currentness evidence establishes otherwise.

## KJRI Penang

Source identity: `71000000-0000-0000-0000-000000000009`  
Official URL: `https://kemlu.go.id/penang`  
Current tariff evidence: “Tarif Resmi Pelayanan KJRI Penang Tahun 2026”, based on `SK 044.1.SK/KU/VII/2025` and `SK 085.SK/KU/XI/2025`.

### Contacts

| Fact key | Purpose | Raw value | Normalized | State |
|---|---|---|---|---|
| KJRI-PEN:CONTACT:WEBSITE | GENERAL | official URL above | unchanged | VERIFIED fact; general category mapping unresolved |
| KJRI-PEN:CONTACT:EMAIL | GENERAL | `penang.kjri@kemlu.go.id` | lowercase unchanged | VERIFIED fact; general category mapping unresolved |
| KJRI-PEN:CONTACT:SERVICE | CONSULAR/service | `+60 11 1246 0970` | `+601112460970` | VERIFIED |
| KJRI-PEN:CONTACT:PROTECTION | PROTECTION/complaint | `+60 10 949 1859` | `+60109491859` | VERIFIED |
| KJRI-PEN:CONTACT:PHONE_1 | GENERAL | `+60 4 2274686` | `+6042274686` | VERIFIED fact; general category mapping unresolved |
| KJRI-PEN:CONTACT:PHONE_2 | GENERAL | `+60 4 2267412` | `+6042267412` | VERIFIED fact; general category mapping unresolved |
| KJRI-PEN:CONTACT:PORTAL | official service/appointment portal | `layananonline.kjripenang.my` | `https://layananonline.kjripenang.my` proposed only after HTTPS preflight | VERIFIED identity; URL health/currentness must be checked before publication |

The evidence establishes current 2026 service/tariff existence. Exact tariff rows were not reproduced in this instruction and therefore are not invented here. Older Peduli WNI values are classified HISTORICAL/SUPERSEDED where they conflict, but exact historical rows require their original evidence values before normalization.

## KBRI Kuala Lumpur

Source identity: `71000000-0000-0000-0000-000000000001`  
Official URL: `https://kemlu.go.id/kualalumpur`  
Decision: `SK.070/PK/04/2026/01`, dated `2026-04-15`  
Effective date: `2026-05-01`

### Contacts

| Fact key | Purpose | Value | State |
|---|---|---|---|
| KBRI-KUL:CONTACT:WEBSITE | GENERAL | official URL above | VERIFIED fact; general category mapping unresolved |

The instruction references previously approved hotline/contact evidence but does not reproduce exact values. No contact value is inferred or copied from an unidentified record.

### Tariffs

| Category | Service code | Amount MYR |
|---|---|---:|
| IMMIGRATION | PASSPORT_STANDARD | 85 |
| IMMIGRATION | PASSPORT_ELECTRONIC | 155 |
| IMMIGRATION | PASSPORT_EXPEDITED | 325 |
| IMMIGRATION | SPLP | 25 |
| IMMIGRATION | PASSPORT_LOST_STANDARD | 325 |
| IMMIGRATION | PASSPORT_DAMAGED_STANDARD | 205 |
| IMMIGRATION | PASSPORT_LOST_ELECTRONIC | 395 |
| IMMIGRATION | PASSPORT_DAMAGED_ELECTRONIC | 275 |
| IMMIGRATION | DUAL_NATIONALITY_AFFIDAVIT | 120 |
| IMMIGRATION | VISA_TOURISM_SINGLE_ENTRY_LT60D | 240 |
| IMMIGRATION | VISA_NON_TOURISM_SINGLE_ENTRY_LT60D | 480 |
| EMPLOYMENT | JOB_ORDER_LEGALIZATION | 0 |
| EMPLOYMENT | EMPLOYMENT_CONTRACT_LEGALIZATION | 0 |
| CITIZENSHIP | LOSS_OF_CITIZENSHIP_CERTIFICATE | 120 |
| MARITIME | SEAMAN_BOOK_EXTENSION | 5 |
| MARITIME | NEW_SEAMAN_BOOK | 30 |
| MARITIME | SEA_SERVICE_CERTIFICATE | 5 |
| CONSULAR | BIRTH_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | MARRIAGE_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | DIVORCE_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | DEATH_CERTIFICATE_EXTRACT | 0 |
| CONSULAR | CHILD_APPOINTMENT_CERTIFICATE | 0 |
| CONSULAR | RELEASE_OF_CITIZENSHIP_CERTIFICATE | 0 |
| CONSULAR | CHANGE_OF_RESIDENCE_CERTIFICATE | 0 |
| CONSULAR | DRIVING_LICENSE_CERTIFICATE | 100 |
| CONSULAR | BUSINESS_CERTIFICATE | 565 |
| LEGALIZATION | LEGALIZATION_BUSINESS_DOCUMENT | 565 |
| LEGALIZATION | LEGALIZATION_NON_BUSINESS_DOCUMENT | 125 |
| LEGALIZATION | LEGALIZATION_ACADEMIC_DOCUMENT | 0 |

## KJRI Johor Bahru

Source identity: `71000000-0000-0000-0000-000000000006`  
Official URL: `https://kemlu.go.id/johorbahru`

### Contacts

| Fact key | Purpose | Raw value | Normalized | State |
|---|---|---|---|---|
| KJRI-JHB:CONTACT:WEBSITE | GENERAL | official URL above | unchanged | VERIFIED fact; general category mapping unresolved |
| KJRI-JHB:CONTACT:KSATRIA | KSATRIA | `+60 10 528 8040` | `+60105288040` | VERIFIED purpose label; category mapping requires definition |
| KJRI-JHB:CONTACT:IMMIGRATION | IMMIGRATION | `+60 17 771 6866` | `+60177716866` | VERIFIED |
| KJRI-JHB:CONTACT:PROTECTION | PROTECTION | `+60 16 770 0378` | `+60167700378` | VERIFIED |
| KJRI-JHB:CONTACT:GENERAL | GENERAL | `+60 7 227 4188` | `+6072274188` | VERIFIED fact; general category mapping unresolved |
| KJRI-JHB:CONTACT:EMAIL | GENERAL | `johorbahru.kjri@kemlu.go.id` | lowercase unchanged | VERIFIED fact; general category mapping unresolved |

Approved tariff evidence establishes CONSULAR, EMPLOYMENT, CITIZENSHIP, and MARITIME service families. Exact visible values and an effective date were not included in this instruction. No amount or date is invented. Fees remain non-public or OFFICIAL_BUT_DATE_UNCERTAIN only where later exact evidence rows satisfy the existing fee policy.

## Readiness matrix

| Mission | Office | Frozen jurisdiction | Proven services | Contacts | Exact fees | Requirements | Appointments | Hours | Readiness |
|---|---|---|---|---|---|---|---|---|---|
| KBRI-KUL | VERIFIED baseline | present | 29 tariff-backed rows | website only in this file | 29 current | missing | missing | missing | PARTIAL |
| KJRI-JHB | VERIFIED baseline | present | 4 service families | 6 facts | exact rows missing | missing | missing | missing | PARTIAL |
| KJRI-PEN | VERIFIED baseline | present | 2026 tariff set established | 7 facts | exact rows missing | missing | portal requires health/currentness check | missing | PARTIAL |
| KJRI-KCH | VERIFIED baseline | present | tariff decision plus contact-supported categories | 9 facts | exact rows missing/date uncertain | missing | missing | missing | PARTIAL |
| KJRI-BKI | VERIFIED baseline | present | 23 tariff-backed rows | 3 facts | 23 current | missing | appointment communication channel only | missing | PARTIAL |
| KRI-TWU | VERIFIED baseline | 5/5 districts VERIFIED | 28 tariff-backed rows | 4 facts | 28 current | missing | historical only | missing | PARTIAL |

## Missing-field and schema report

1. Exact tariff rows are absent from this instruction for KJRI-KCH, KJRI-PEN, and KJRI-JHB.
2. Exact KBRI-KUL hotline/contact values referenced as “previously approved” are not reproduced.
3. No requirements or operating-hours evidence is supplied for any mission.
4. General office contacts cannot be safely inserted because `office_contact_channels.service_category_id` is mandatory and the current taxonomy has no proven general-information category. The constraint must not be weakened and no category is invented.
5. KJRI Penang portal needs an exact approved HTTPS URL/current health determination before public handoff.
6. KRI Tawau appointment evidence is historical and remains non-public.
7. Publication-time `last_verified_at` must be assigned at the later controlled review/execution checkpoint.

## Conflict and supersession report

- Penang older Peduli WNI tariff evidence: HISTORICAL/SUPERSEDED where it conflicts with the explicit 2026 tariff publication; exact rows not available in this instruction.
- KRI Tawau 2021 appointment domain: HISTORICAL / REQUIRES CURRENT REVERIFICATION.
- Kuching tariff decision: official, but current effective status is unresolved; use fee-only OFFICIAL_BUT_DATE_UNCERTAIN after exact amounts are recovered.
- No unresolved conflicting exact values were introduced into this manifest.

## Publication gate

This manifest is evidence input, not authorization to publish. Population remains fail-closed until deterministic IDs, hosted collision results, target-specific evidence associations, service-category mappings, current verification metadata, temporal fields, and open-conflict checks all pass.

### LAYANAN-2D service verification decision

The product owner has verified the existence of all 28 canonical mission-service relationships. The controlled DUTA review timestamp is `2026-08-15 00:00:00+08`; it is not a source publication date or an invented effective date. Seventeen relationships have granular evidence locators. Eleven are annotated `GRANULAR_EVIDENCE_LOCATOR_PENDING` in the frozen LAYANAN-2D decision manifest and remain disabled under the unchanged curated-reader contract. Fee verification remains separate: 0/80 fee candidates are approved for publication by this decision.

## Reconciliation classification

The record-by-record reconciliation and mandatory six-state classification are maintained in `docs/data/DUTA_LAYANAN_EVIDENCE_RECOVERY_MATRIX_V1.md`.

Current reconciliation outcome:

- Mission identities and frozen jurisdictions are publication candidates, pending target-specific evidence materialization and hosted collision checks.
- Eight purpose-specific contacts have safe category mappings but still require exact evidence locators before publication.
- General contacts are `RESOLVED_MODELING_DEBT`; the mandatory service-category foreign key is not bypassed.
- Eighty exact fee facts remain `UNRESOLVED_EXACT_FIELD` for population because their exact official publication URL or `official_source_item` is not present.
- The KRI Tawau 2021 appointment domain is `RESOLVED_HISTORICAL`.
- Penang older conflicting tariffs are `SUPERSEDED` at evidence-family level; exact historical rows were not supplied.

## Evidence locator recovery pass

The following locators were recovered from already-approved first-party Kemlu/Peduli WNI surfaces. Each row is scoped only to claims actually exposed by that locator.

| Mission code | Target type | Stable target code | Official source ID | Evidence locator | Evidence scope | Verification classification | Effective/currentness classification |
|---|---|---|---|---|---|---|---|
| KBRI-KUL | OFFICE | IDENTITY | `71000000-0000-0000-0000-000000000001` | `https://www.kemlu.go.id/kualalumpur/id` | office identity, address, general telephone, email | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | CONTACT | GENERAL_CALL_CENTER | same | `https://www.kemlu.go.id/kualalumpur/id` | `(603)-2116-4016/4017` call center | RESOLVED_MODELING_DEBT | current portal; general category unresolved |
| KBRI-KUL | CONTACT | CONSULAR_HOTLINE | same | `https://www.kemlu.go.id/kualalumpur/id` | `+60176688032` consular hotline | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | CONTACT | PASSPORT_SPLP_HOTLINE | same | `https://www.kemlu.go.id/kualalumpur/id` | `+60138312347` passport/SPLP hotline | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | CONTACT | GENERAL_HOTLINE | same | `https://www.kemlu.go.id/kualalumpur/id` | `+60175007047` general hotline | RESOLVED_MODELING_DEBT | current portal; general category unresolved |
| KBRI-KUL | MISSION_SERVICE | IMMIGRATION | same | `https://www.kemlu.go.id/kualalumpur/id` | Paspor, Visa, and related representation service navigation | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | MISSION_SERVICE | CONSULAR | same | `https://www.kemlu.go.id/kualalumpur/id` | Konsuler service navigation | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | MISSION_SERVICE | EMPLOYMENT | same | `https://www.kemlu.go.id/kualalumpur/id` | Ketenagakerjaan service navigation | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | MISSION_SERVICE | CITIZENSHIP | same | `https://www.kemlu.go.id/kualalumpur/id` | Kewarganegaraan service navigation | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | MISSION_SERVICE | MARITIME | same | `https://www.kemlu.go.id/kualalumpur/id` | Perhubungan service navigation | RESOLVED_PUBLISHABLE | current portal |
| KBRI-KUL | FEE | KUL_2026_TARIFF_SET | same | unresolved | exact 2026 tariff publication required; homepage is not substituted | UNRESOLVED_EXACT_FIELD | effective 2026-05-01 retained |
| KJRI-JHB | OFFICE | IDENTITY_AND_CONTACT | `71000000-0000-0000-0000-000000000006` | `https://www.kemlu.go.id/johorbahru` | office, general telephone/email, immigration/protection/KSATRIA numbers | RESOLVED_PUBLISHABLE | current portal |
| KJRI-JHB | MISSION_SERVICE | IMMIGRATION | same | `https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-` | passport, SPLP, and immigration information | RESOLVED_PUBLISHABLE | current service page |
| KJRI-JHB | MISSION_SERVICE | CONSULAR | same | same KSATRIA locator | consular information and certificates | RESOLVED_PUBLISHABLE | current service page |
| KJRI-JHB | MISSION_SERVICE | PROTECTION | same | same KSATRIA locator | complaints and WNI protection information | RESOLVED_PUBLISHABLE | current service page |
| KJRI-JHB | MISSION_SERVICE | EMPLOYMENT | same | same KSATRIA locator | employment information | RESOLVED_PUBLISHABLE | current service page |
| KJRI-JHB | CONTACT | IMMIGRATION_HOTLINE | same | `https://www.kemlu.go.id/johorbahru` | `+60177716866` immigration hotline | RESOLVED_PUBLISHABLE | current portal |
| KJRI-JHB | CONTACT | PROTECTION_HOTLINE | same | `https://www.kemlu.go.id/johorbahru` | `+60167700378` protection hotline | RESOLVED_PUBLISHABLE | current portal |
| KJRI-JHB | CONTACT | KSATRIA | same | `https://kemlu.go.id/johorbahru/pelayanan-perwakilan/virtual-hotline-ksatria-` | `+60105288040`, official WhatsApp chatbot, 24/7 | RESOLVED_PUBLISHABLE | current service page |
| KJRI-JHB | FEE | JHB_PNBP_PUBLICATION | same | `https://kemlu.go.id/johorbahru/lembar-informasi/665d5cbb82b5785d9f344c46417c6c36?type=repository` | official PNBP tariff publication container | RESOLVED_NON_PUBLIC | exact tariff rows/date still required before fee population |
| KJRI-PEN | OFFICE | IDENTITY_AND_CONTACT | `71000000-0000-0000-0000-000000000009` | `https://kemlu.go.id/penang/berita/maklumat-pelayanan?type=publication` | office identity, general telephone/email, service commitment | RESOLVED_PUBLISHABLE | publication dated 2025-06-18; currentness reviewed separately |
| KJRI-PEN | MISSION_SERVICE | CONSULAR | same | same Maklumat locator | official public-service commitment; scoped to approved consular service evidence | RESOLVED_PUBLISHABLE | current candidate |
| KJRI-PEN | MISSION_SERVICE | PROTECTION | same | `https://kemlu.go.id/penang` | approved protection/service channel family; exact hotline locator unresolved | RESOLVED_NON_PUBLIC | hold contact until exact locator |
| KJRI-PEN | CONTACT | SERVICE_HOTLINE | same | unresolved | `+601112460970` requires exact official locator | UNRESOLVED_EXACT_FIELD | excluded |
| KJRI-PEN | CONTACT | PROTECTION_HOTLINE | same | unresolved | `+60109491859` requires exact official locator | UNRESOLVED_EXACT_FIELD | excluded |
| KJRI-PEN | CONTACT | SERVICE_PORTAL | same | `https://layananonline.kjripenang.my` | approved service/appointment portal identity | RESOLVED_NON_PUBLIC | HTTPS health/currentness check required |
| KJRI-PEN | FEE | PEN_2026_TARIFF_SET | same | unresolved | exact publication locator and rows required | UNRESOLVED_EXACT_FIELD | 2026 set acknowledged; no exact effective date |
| KJRI-KCH | OFFICE | IDENTITY_AND_CONTACT | `71000000-0000-0000-0000-000000000016` | `https://kemlu.go.id/kuching/kontak` | office identity, general telephone/email | RESOLVED_PUBLISHABLE | current contact page |
| KJRI-KCH | MISSION_SERVICE | IMMIGRATION | same | `https://www.kemlu.go.id/kuching` | Paspor and SPLP service listing | RESOLVED_PUBLISHABLE | current portal |
| KJRI-KCH | MISSION_SERVICE | CONSULAR | same | `https://www.kemlu.go.id/kuching` | Kekonsuleran service listing | RESOLVED_PUBLISHABLE | current portal |
| KJRI-KCH | MISSION_SERVICE | LEGALIZATION | same | `https://www.peduliwni.kemlu.go.id/informasi_pelayanan/app/detail_kbri/.html?perwakilan_id=NDU4Mw%3D%3D` | KJRI Kuching LEGALISASI service listing | RESOLVED_PUBLISHABLE | current Peduli WNI listing; tariff currentness separate |
| KJRI-KCH | CONTACT | PUBLIC_HOTLINE_SET | same | `https://kemlu.go.id/kuching/berita/nomor-hotline-layanan-publik-kjri-kuching?type=publication` | official purpose-specific hotline publication | RESOLVED_PUBLISHABLE | publication dated 2024-10-15; DUTA currentness check required at population review |
| KJRI-KCH | FEE | KCH_2024_TARIFF_SET | same | `https://www.peduliwni.kemlu.go.id/informasi_pelayanan/app/detail_kbri/.html?perwakilan_id=NDU4Mw%3D%3D` | visible service/tariff listing only | RESOLVED_NON_PUBLIC | exact decision rows absent; OFFICIAL_BUT_DATE_UNCERTAIN only after recovery |
| KJRI-BKI | OFFICE | IDENTITY_AND_CONTACT | `71000000-0000-0000-0000-000000000014` | `https://kemlu.go.id/kotakinabalu` | office, general telephone/email | RESOLVED_PUBLISHABLE | current portal |
| KJRI-BKI | MISSION_SERVICE | IMMIGRATION | same | `https://kemlu.go.id/kotakinabalu` | Paspor, Visa, and online immigration queue | RESOLVED_PUBLISHABLE | current portal |
| KJRI-BKI | MISSION_SERVICE | CONSULAR | same | `https://kemlu.go.id/kotakinabalu` | online queue for consular documents | RESOLVED_PUBLISHABLE | current portal |
| KJRI-BKI | APPOINTMENT | ONLINE_QUEUE | same | `https://kemlu.go.id/kotakinabalu` | online queue capability for immigration/consular documents | RESOLVED_PUBLISHABLE | current portal; destination URL must be recovered before handoff row |
| KJRI-BKI | CONTACT | TEMAN_BAIK | same | unresolved | approved appointment number requires exact official locator | UNRESOLVED_EXACT_FIELD | excluded |
| KJRI-BKI | FEE | BKI_2026_TARIFF_SET | same | unresolved | exact 2026 tariff publication required | UNRESOLVED_EXACT_FIELD | effective 2026-05-05 retained |
| KRI-TWU | OFFICE | IDENTITY_AND_CONTACT | `71000000-0000-0000-0000-000000000019` | `https://kemlu.go.id/perwakilan/67c6a1e7ce56d3d6fa748ab6d9af3fd7?type=perwakilan-detail` | office identity, telephones, email, website | RESOLVED_PUBLISHABLE | current Kemlu representative directory |
| KRI-TWU | JURISDICTION | TAWAU_5_DISTRICTS | same | `https://kemlu.go.id/tawau/tawau/berita/konsulat-ri-tawau-perkuat-perlindungan-wni-melalui-pelaksanaan-sidang-itsbat-nikah-bagi-225-pasangan-di-wilayah-kerja?type=publication` | Tawau, Kunak, Kalabakan, Lahad Datu, Semporna | RESOLVED_PUBLISHABLE | publication dated 2026-06-08 |
| KRI-TWU | MISSION_SERVICE | IMMIGRATION | same | `https://www.kemlu.go.id/tawau/berita/konsulat-ri-tawau-laksanakan-layanan-jemput-bola-penggantian-paspor-bagi-870-pmi-di-syarikat-hapseng?type=publication` | passport replacement service | RESOLVED_PUBLISHABLE | service performed 2026-02-07/08 |
| KRI-TWU | MISSION_SERVICE | CONSULAR | same | `https://kemlu.go.id/tawau/publikasi/buletin/d71dd235287466052f1630f31bde7932?type=repository` | official portal lists consular document services | RESOLVED_PUBLISHABLE | current portal listing |
| KRI-TWU | CONTACT | GENERAL_OFFICE_SET | same | representative-directory locator above | two office telephones and official email | RESOLVED_MODELING_DEBT | exact facts resolved; general category unresolved |
| KRI-TWU | FEE | TWU_2026_TARIFF_SET | same | unresolved | exact 2026 tariff publication required | UNRESOLVED_EXACT_FIELD | effective 2026-05-01 retained |

This pass resolves core service evidence for all six missions without treating any homepage as fee evidence.
