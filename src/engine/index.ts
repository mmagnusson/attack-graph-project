// ─── Engine Barrel Export ─────────────────────────────────────────────────────

export {
  assessEnvironment,
  assessmentToModelInputs,
  actorWeightsFor,
  getKBToolsByCategory,
  getKBInfraByCategory,
  ACTOR_OF_CONCERN_WEIGHT,
} from './exposureEngine';
export type { GroupedTool, GroupedInfra, GroupedToolCategory, GroupedInfraCategory } from './exposureEngine';

export { layoutNodes, rollupId, chainByPhase, buildCooccurrenceEdges, chainFanEdges } from './graphModel';
export type { NodePosition, PhaseCenter, LayoutResult } from './graphModel';

export { detectFramework, parseStixBundle, cleanDescription, PARSER_VERSION } from './stixParser';
export type { StixBundle, ParserConfig } from './stixParser';

export {
  compileModel, evaluateModel, simulateAddition, applyAddition, actorBreakdown, viabilityParts,
  techniqueActivity, gateValue, rulesCovered, stackedMitigation, clamp01,
  DEFAULT_MODEL_PARAMS, SENSITIVITY_BOUNDS,
} from './riskModel';
export type { CompileInputs, CompiledModel, CompiledActor, ModelState, Addition } from './riskModel';

export {
  buildCatalog, marginalValues, optimizePortfolio, evaluateItems, withItems, defaultCost, fullCost, additionOf,
  TIER_COSTS, ORG_SIZES,
} from './portfolioOptimizer';
export type { CostModel, OrgSize, OptimizeOptions } from './portfolioOptimizer';

export { rollupMetrics, defenseFootprint, nodeDefenses, findBlindSpots, fmtPct, fmtUsd } from './displayMetrics';
export type { NodeMetrics, NodeDefenses, BlindSpot } from './displayMetrics';

export { buildBoardReport, esc } from './boardReport';
export type { BoardReportInput } from './boardReport';

export { tagSectors, tagCountry, SECTORS } from './actorTags';

export { sanitizeCSVCell, csvRow, downloadFile, today } from './csv';

export { attackVocabulary, d3fendVocabulary, d3fendRole, translateAttackPosture } from './defenseVocabulary';
