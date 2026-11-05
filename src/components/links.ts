// ─── External reference URLs ─────────────────────────────────────────────────

export const mitigationUrl = (id: string) => "https://attack.mitre.org/mitigations/" + id + "/";
export const techniqueUrl = (id: string) => "https://attack.mitre.org/techniques/" + id.replace('.', '/') + "/";
export const detectionStrategyUrl = (id: string) => "https://attack.mitre.org/detectionstrategies/" + id + "/";
export const d3fendUrl = (iri: string) => "https://d3fend.mitre.org/technique/d3f:" + iri + "/";
