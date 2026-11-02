// ─── Actor Tagging — sector & attribution keywords from MITRE descriptions ───
// MITRE group descriptions name targeted sectors in prose ("has targeted
// government, defense, and energy organizations"). These keyword rules turn
// that prose into filterable tags. They are heuristics: the UI labels them as
// derived from the description, not as authoritative attribution.

export interface SectorDef {
  id: string;
  label: string;
  pattern: RegExp;
}

export const SECTORS: SectorDef[] = [
  { id: "government", label: "Government", pattern: /\bgovernment|\bministr(?:y|ies)\b|\bembass|\bdiplomat|\bpublic sector|\bpolitical\b/i },
  { id: "defense", label: "Defense & Aerospace", pattern: /\bdefen[cs]e (?:industr|contractor|sector|organi[sz]ations?|firms?)|\bmilitary\b|\baerospace\b/i },
  { id: "financial", label: "Financial", pattern: /\bfinancial\b|\bbank(?:s|ing)?\b|\bcryptocurrenc|\bfintech\b|\binsurance\b|\bpayment\b|\bcasinos?\b|\bgambling\b/i },
  { id: "healthcare", label: "Healthcare", pattern: /\bhealth ?care\b|\bhospitals?\b|\bpharmaceutical|\bmedical\b/i },
  { id: "energy", label: "Energy & Utilities", pattern: /\benergy\b|\boil and gas\b|\butilit(?:y|ies)\b|\belectric(?:al|ity)?\b|\bnuclear\b|\bpetrochemical/i },
  { id: "telecom", label: "Telecommunications", pattern: /\btelecom/i },
  { id: "technology", label: "Technology", pattern: /\btechnology\b|\bsoftware (?:companies|vendors|developers)|\bIT (?:companies|sector|services|providers)|\bmanaged service providers?\b|\bcloud (?:service )?providers?\b/i },
  { id: "education", label: "Education & Research", pattern: /\beducation|\buniversit(?:y|ies)\b|\bacademi|\bresearch (?:institut|organi[sz]ation|cent)|\bthink tanks?\b/i },
  { id: "manufacturing", label: "Manufacturing & Industrial", pattern: /\bmanufactur|\bindustrial\b|\bengineering\b|\bautomotive\b|\bchemical\b/i },
  { id: "retail", label: "Retail & Hospitality", pattern: /\bretail|\bhospitality\b|\brestaurants?\b|\bpoint[- ]of[- ]sale\b|\be-?commerce\b/i },
  { id: "media", label: "Media & Journalism", pattern: /\bmedia\b|\bjournalis|\bnews\b|\bbroadcast/i },
  { id: "ngo", label: "NGOs & Civil Society", pattern: /\bnon-?governmental|\bNGOs?\b|\bactivists?\b|\bdissidents?\b|\bhuman rights\b|\bcivil society\b/i },
];

export function tagSectors(description: string): string[] {
  if (!description) return [];
  return SECTORS.filter(s => s.pattern.test(description)).map(s => s.id);
}

// Attribution: only strong phrasings ("a Chinese state-sponsored group",
// "attributed to Russia's GRU"). A bare country name usually names a *target*,
// so it is never enough on its own.
const ORIGINS: { country: string; adjective: string; noun: string }[] = [
  { country: "China", adjective: "Chinese", noun: "China" },
  { country: "Russia", adjective: "Russian", noun: "Russia" },
  { country: "Iran", adjective: "Iranian", noun: "Iran" },
  { country: "North Korea", adjective: "North Korean", noun: "(?:North Korea|Democratic People's Republic of Korea \\(DPRK\\)|DPRK)" },
  { country: "Vietnam", adjective: "Vietnamese", noun: "Vietnam" },
  { country: "Pakistan", adjective: "Pakistani", noun: "Pakistan" },
  { country: "India", adjective: "Indian", noun: "India" },
  { country: "Belarus", adjective: "Belarusian", noun: "Belarus" },
  { country: "Lebanon", adjective: "Lebanese", noun: "Lebanon" },
  { country: "Turkey", adjective: "Turkish", noun: "Turkey" },
];
const ACTOR_NOUNS = "(?:state-sponsored|state-backed|nation-state|government|intelligence|military|cyber ?espionage|espionage|threat|APT|hacking|cyber)";

export function tagCountry(description: string): string | undefined {
  if (!description) return undefined;
  for (const o of ORIGINS) {
    const adjective = new RegExp("\\b(?:a|an|is|as|suspected|likely)\\s+(?:\\w+[- ]){0,2}" + o.adjective + "\\s+(?:\\w+[- ]){0,2}" + ACTOR_NOUNS, "i");
    const attributed = new RegExp("\\battributed to (?:the )?(?:\\w+ ){0,3}" + o.noun + "|\\b" + o.noun + "(?:'s|’s) (?:\\w+ ){0,4}(?:Ministry|Intelligence|Army|Bureau|Directorate|General Staff|Unit|Corps)", "i");
    const based = new RegExp("\\bis an? " + o.noun + "-based\\b|\\bbased (?:out of|in) " + o.noun + "\\b", "i");
    if (adjective.test(description) || attributed.test(description) || based.test(description)) return o.country;
  }
  return undefined;
}
