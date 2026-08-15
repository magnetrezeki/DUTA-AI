export const malaysiaMissions = {
  "KBRI-KUL": { name: "KBRI Kuala Lumpur", sourceId: "71000000-0000-0000-0000-000000000001" },
  "KJRI-JHB": { name: "KJRI Johor Bahru", sourceId: "71000000-0000-0000-0000-000000000006" },
  "KJRI-PEN": { name: "KJRI Penang", sourceId: "71000000-0000-0000-0000-000000000009" },
  "KJRI-BKI": { name: "KJRI Kota Kinabalu", sourceId: "71000000-0000-0000-0000-000000000014" },
  "KJRI-KCH": { name: "KJRI Kuching", sourceId: "71000000-0000-0000-0000-000000000016" },
  "KRI-TWU": { name: "Konsulat Republik Indonesia Tawau", sourceId: "71000000-0000-0000-0000-000000000019" },
} as const;

export type MalaysiaMissionCode = keyof typeof malaysiaMissions;

type Jurisdiction = {
  state: string;
  district?: string;
  missionCode: MalaysiaMissionCode;
};

const stateJurisdictions: Jurisdiction[] = [
  ...["Kuala Lumpur", "Putrajaya", "Selangor", "Perak", "Kelantan", "Terengganu"].map((state) => ({ state, missionCode: "KBRI-KUL" as const })),
  ...["Johor", "Melaka", "Negeri Sembilan", "Pahang"].map((state) => ({ state, missionCode: "KJRI-JHB" as const })),
  ...["Pulau Pinang", "Kedah", "Perlis"].map((state) => ({ state, missionCode: "KJRI-PEN" as const })),
  { state: "Sarawak", missionCode: "KJRI-KCH" },
  { state: "WP Labuan", missionCode: "KJRI-BKI" },
];

const tawauDistricts = ["Tawau", "Kunak", "Semporna", "Lahad Datu", "Kalabakan"];
const kotaKinabaluDistricts = [
  "Beluran", "Beaufort", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu",
  "Kota Marudu", "Kuala Penyu", "Kudat", "Nabawan", "Papar", "Penampang", "Pitas",
  "Putatan", "Ranau", "Sandakan", "Sipitang", "Tambunan", "Telupid", "Tenom", "Tongod", "Tuaran",
];

const districtJurisdictions: Jurisdiction[] = [
  ...tawauDistricts.map((district) => ({ state: "Sabah", district, missionCode: "KRI-TWU" as const })),
  ...kotaKinabaluDistricts.map((district) => ({ state: "Sabah", district, missionCode: "KJRI-BKI" as const })),
];

export const malaysiaJurisdictions = [...stateJurisdictions, ...districtJurisdictions] as const;

const aliases = new Map<string, string>([
  ["kl", "kuala lumpur"],
  ["penang", "pulau pinang"],
  ["labuan", "wp labuan"],
  ["wilayah persekutuan labuan", "wp labuan"],
  ["negeri sembilan", "negeri sembilan"],
]);

export function normalizeMalaysiaLocation(value: string | undefined) {
  const normalized = value?.normalize("NFKC").trim().toLocaleLowerCase("ms-MY").replace(/\s+/g, " ") ?? "";
  return aliases.get(normalized) ?? normalized;
}

export type JurisdictionResolution =
  | { status: "resolved"; missionCode: MalaysiaMissionCode; canonicalState: string; canonicalDistrict: string | null }
  | { status: "ambiguous"; reason: "district_required" }
  | { status: "unsupported"; reason: "unknown_location" };

export function resolveMalaysiaJurisdiction(stateInput?: string, districtInput?: string): JurisdictionResolution {
  const state = normalizeMalaysiaLocation(stateInput);
  const district = normalizeMalaysiaLocation(districtInput);

  if (!state) return { status: "unsupported", reason: "unknown_location" };
  if (state === "sabah" && !district) return { status: "ambiguous", reason: "district_required" };

  const match = malaysiaJurisdictions.find((entry) =>
    normalizeMalaysiaLocation(entry.state) === state
      && (entry.state !== "Sabah" || normalizeMalaysiaLocation(entry.district) === district),
  );

  if (!match) return { status: "unsupported", reason: "unknown_location" };
  return {
    status: "resolved",
    missionCode: match.missionCode,
    canonicalState: match.state,
    canonicalDistrict: match.district ?? null,
  };
}

export const malaysiaStateOptions = [...new Set(malaysiaJurisdictions.map((entry) => entry.state))];
export const sabahDistrictOptions = districtJurisdictions.map((entry) => entry.district as string);

