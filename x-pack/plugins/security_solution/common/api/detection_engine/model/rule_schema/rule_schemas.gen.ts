/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Security Rule Schema
 *   version: not applicable
 */

import { z } from '@kbn/zod';

import {
  RuleName,
  RuleDescription,
  RiskScore,
  Severity,
  RuleNameOverride,
  TimestampOverride,
  TimestampOverrideFallbackDisabled,
  TimelineTemplateId,
  TimelineTemplateTitle,
  SavedObjectResolveOutcome,
  SavedObjectResolveAliasTargetId,
  SavedObjectResolveAliasPurpose,
  RuleLicense,
  InvestigationGuide,
  BuildingBlockType,
  AlertsIndex,
  AlertsIndexNamespace,
  RuleMetadata,
  InvestigationFields,
  RuleActionThrottle,
  RuleVersion,
  RuleTagArray,
  IsRuleEnabled,
  RiskScoreMapping,
  SeverityMapping,
  RuleInterval,
  RuleIntervalFrom,
  RuleIntervalTo,
  RuleAction,
  RuleExceptionList,
  RuleAuthorArray,
  RuleFalsePositiveArray,
  RuleReferenceArray,
  MaxSignals,
  ThreatArray,
  SetupGuide,
  RelatedIntegrationArray,
  RequiredFieldInput,
  RuleObjectId,
  RuleSignatureId,
  IsRuleImmutable,
  RuleSource,
  RequiredFieldArray,
  RuleQuery,
  IndexPatternArray,
  DataViewId,
  RuleFilterArray,
  AlertSuppression,
  SavedQueryId,
  KqlQueryLanguage,
} from './common_attributes.gen';
import { RuleExecutionSummary } from '../../rule_monitoring/model/execution_summary.gen';
import {
  EventCategoryOverride,
  TiebreakerField,
  TimestampField,
} from './specific_attributes/eql_attributes.gen';
import { ResponseAction } from '../rule_response_actions/response_actions.gen';
import {
  Threshold,
  ThresholdAlertSuppression,
} from './specific_attributes/threshold_attributes.gen';
import {
  ThreatQuery,
  ThreatMapping,
  ThreatIndex,
  ThreatFilters,
  ThreatIndicatorPath,
  ConcurrentSearches,
  ItemsPerSearch,
} from './specific_attributes/threat_match_attributes.gen';
import { AnomalyThreshold, MachineLearningJobId } from './specific_attributes/ml_attributes.gen';
import { NewTermsFields, HistoryWindowStart } from './specific_attributes/new_terms_attributes.gen';

export type BaseRequiredFields = z.infer<typeof BaseRequiredFields>;
export const BaseRequiredFields = z.object({
  name: RuleName,
  description: RuleDescription,
  risk_score: RiskScore,
  severity: Severity,
});

export type BaseOptionalFields = z.infer<typeof BaseOptionalFields>;
export const BaseOptionalFields = z.object({
  rule_name_override: RuleNameOverride.optional(),
  timestamp_override: TimestampOverride.optional(),
  timestamp_override_fallback_disabled: TimestampOverrideFallbackDisabled.optional(),
  timeline_id: TimelineTemplateId.optional(),
  timeline_title: TimelineTemplateTitle.optional(),
  outcome: SavedObjectResolveOutcome.optional(),
  alias_target_id: SavedObjectResolveAliasTargetId.optional(),
  alias_purpose: SavedObjectResolveAliasPurpose.optional(),
  license: RuleLicense.optional(),
  note: InvestigationGuide.optional(),
  building_block_type: BuildingBlockType.optional(),
  output_index: AlertsIndex.optional(),
  namespace: AlertsIndexNamespace.optional(),
  meta: RuleMetadata.optional(),
  investigation_fields: InvestigationFields.optional(),
  throttle: RuleActionThrottle.optional(),
});

export type BaseDefaultableFields = z.infer<typeof BaseDefaultableFields>;
export const BaseDefaultableFields = z.object({
  version: RuleVersion.optional(),
  tags: RuleTagArray.optional(),
  enabled: IsRuleEnabled.optional(),
  risk_score_mapping: RiskScoreMapping.optional(),
  severity_mapping: SeverityMapping.optional(),
  interval: RuleInterval.optional(),
  from: RuleIntervalFrom.optional(),
  to: RuleIntervalTo.optional(),
  actions: z.array(RuleAction).optional(),
  exceptions_list: z.array(RuleExceptionList).optional(),
  author: RuleAuthorArray.optional(),
  false_positives: RuleFalsePositiveArray.optional(),
  references: RuleReferenceArray.optional(),
  max_signals: MaxSignals.optional(),
  threat: ThreatArray.optional(),
  setup: SetupGuide.optional(),
  related_integrations: RelatedIntegrationArray.optional(),
  required_fields: z.array(RequiredFieldInput).optional(),
});

export type BaseCreateProps = z.infer<typeof BaseCreateProps>;
export const BaseCreateProps =
  BaseRequiredFields.merge(BaseOptionalFields).merge(BaseDefaultableFields);

export type BasePatchProps = z.infer<typeof BasePatchProps>;
export const BasePatchProps = BaseRequiredFields.partial()
  .merge(BaseOptionalFields)
  .merge(BaseDefaultableFields);

export type BaseResponseProps = z.infer<typeof BaseResponseProps>;
export const BaseResponseProps = BaseRequiredFields.merge(BaseOptionalFields).merge(
  BaseDefaultableFields.required()
);

export type ResponseFields = z.infer<typeof ResponseFields>;
export const ResponseFields = z.object({
  id: RuleObjectId,
  rule_id: RuleSignatureId,
  immutable: IsRuleImmutable,
  rule_source: RuleSource.optional(),
  updated_at: z.string().datetime(),
  updated_by: z.string(),
  created_at: z.string().datetime(),
  created_by: z.string(),
  revision: z.number().int().min(0),
  required_fields: RequiredFieldArray,
  execution_summary: RuleExecutionSummary.optional(),
});

export type SharedCreateProps = z.infer<typeof SharedCreateProps>;
export const SharedCreateProps = BaseCreateProps.merge(
  z.object({
    rule_id: RuleSignatureId.optional(),
  })
);

export type SharedUpdateProps = z.infer<typeof SharedUpdateProps>;
export const SharedUpdateProps = BaseCreateProps.merge(
  z.object({
    id: RuleObjectId.optional(),
    rule_id: RuleSignatureId.optional(),
  })
);

export type SharedPatchProps = z.infer<typeof SharedPatchProps>;
export const SharedPatchProps = BasePatchProps.merge(
  z.object({
    id: RuleObjectId.optional(),
    rule_id: RuleSignatureId.optional(),
  })
);

export type SharedResponseProps = z.infer<typeof SharedResponseProps>;
export const SharedResponseProps = BaseResponseProps.merge(ResponseFields);

export type EqlQueryLanguage = z.infer<typeof EqlQueryLanguage>;
export const EqlQueryLanguage = z.literal('eql');

export type EqlRequiredFields = z.infer<typeof EqlRequiredFields>;
export const EqlRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('eql'),
  /**
   * EQL query to execute
   */
  query: RuleQuery,
  /**
   * Query language to use
   */
  language: EqlQueryLanguage,
});

export type EqlOptionalFields = z.infer<typeof EqlOptionalFields>;
export const EqlOptionalFields = z.object({
  index: IndexPatternArray.optional(),
  data_view_id: DataViewId.optional(),
  filters: RuleFilterArray.optional(),
  event_category_override: EventCategoryOverride.optional(),
  tiebreaker_field: TiebreakerField.optional(),
  timestamp_field: TimestampField.optional(),
  alert_suppression: AlertSuppression.optional(),
  response_actions: z.array(ResponseAction).optional(),
});

export type EqlRuleCreateFields = z.infer<typeof EqlRuleCreateFields>;
export const EqlRuleCreateFields = EqlRequiredFields.merge(EqlOptionalFields);

export type EqlRuleResponseFields = z.infer<typeof EqlRuleResponseFields>;
export const EqlRuleResponseFields = EqlRequiredFields.merge(EqlOptionalFields);

export type EqlRulePatchFields = z.infer<typeof EqlRulePatchFields>;
export const EqlRulePatchFields = EqlRequiredFields.partial().merge(EqlOptionalFields);

export type EqlRule = z.infer<typeof EqlRule>;
export const EqlRule = SharedResponseProps.merge(EqlRuleResponseFields);

export type EqlRuleCreateProps = z.infer<typeof EqlRuleCreateProps>;
export const EqlRuleCreateProps = SharedCreateProps.merge(EqlRuleCreateFields);

export type EqlRuleUpdateProps = z.infer<typeof EqlRuleUpdateProps>;
export const EqlRuleUpdateProps = SharedUpdateProps.merge(EqlRuleCreateFields);

export type EqlRulePatchProps = z.infer<typeof EqlRulePatchProps>;
export const EqlRulePatchProps = SharedPatchProps.merge(EqlRulePatchFields);

export type QueryRuleRequiredFields = z.infer<typeof QueryRuleRequiredFields>;
export const QueryRuleRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('query'),
});

export type QueryRuleOptionalFields = z.infer<typeof QueryRuleOptionalFields>;
export const QueryRuleOptionalFields = z.object({
  index: IndexPatternArray.optional(),
  data_view_id: DataViewId.optional(),
  filters: RuleFilterArray.optional(),
  saved_id: SavedQueryId.optional(),
  response_actions: z.array(ResponseAction).optional(),
  alert_suppression: AlertSuppression.optional(),
});

export type QueryRuleDefaultableFields = z.infer<typeof QueryRuleDefaultableFields>;
export const QueryRuleDefaultableFields = z.object({
  query: RuleQuery.optional(),
  language: KqlQueryLanguage.optional(),
});

export type QueryRuleCreateFields = z.infer<typeof QueryRuleCreateFields>;
export const QueryRuleCreateFields = QueryRuleRequiredFields.merge(QueryRuleOptionalFields).merge(
  QueryRuleDefaultableFields
);

export type QueryRulePatchFields = z.infer<typeof QueryRulePatchFields>;
export const QueryRulePatchFields = QueryRuleRequiredFields.partial()
  .merge(QueryRuleOptionalFields)
  .merge(QueryRuleDefaultableFields);

export type QueryRuleResponseFields = z.infer<typeof QueryRuleResponseFields>;
export const QueryRuleResponseFields = QueryRuleRequiredFields.merge(QueryRuleOptionalFields).merge(
  QueryRuleDefaultableFields.required()
);

export type QueryRule = z.infer<typeof QueryRule>;
export const QueryRule = SharedResponseProps.merge(QueryRuleResponseFields);

export type QueryRuleCreateProps = z.infer<typeof QueryRuleCreateProps>;
export const QueryRuleCreateProps = SharedCreateProps.merge(QueryRuleCreateFields);

export type QueryRuleUpdateProps = z.infer<typeof QueryRuleUpdateProps>;
export const QueryRuleUpdateProps = SharedUpdateProps.merge(QueryRuleCreateFields);

export type QueryRulePatchProps = z.infer<typeof QueryRulePatchProps>;
export const QueryRulePatchProps = SharedPatchProps.merge(QueryRulePatchFields);

export type SavedQueryRuleRequiredFields = z.infer<typeof SavedQueryRuleRequiredFields>;
export const SavedQueryRuleRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('saved_query'),
  saved_id: SavedQueryId,
});

export type SavedQueryRuleOptionalFields = z.infer<typeof SavedQueryRuleOptionalFields>;
export const SavedQueryRuleOptionalFields = z.object({
  index: IndexPatternArray.optional(),
  data_view_id: DataViewId.optional(),
  filters: RuleFilterArray.optional(),
  response_actions: z.array(ResponseAction).optional(),
  alert_suppression: AlertSuppression.optional(),
  query: RuleQuery.optional(),
});

export type SavedQueryRuleDefaultableFields = z.infer<typeof SavedQueryRuleDefaultableFields>;
export const SavedQueryRuleDefaultableFields = z.object({
  language: KqlQueryLanguage.optional(),
});

export type SavedQueryRuleCreateFields = z.infer<typeof SavedQueryRuleCreateFields>;
export const SavedQueryRuleCreateFields = SavedQueryRuleRequiredFields.merge(
  SavedQueryRuleOptionalFields
).merge(SavedQueryRuleDefaultableFields);

export type SavedQueryRulePatchFields = z.infer<typeof SavedQueryRulePatchFields>;
export const SavedQueryRulePatchFields = SavedQueryRuleRequiredFields.partial()
  .merge(SavedQueryRuleOptionalFields)
  .merge(SavedQueryRuleDefaultableFields);

export type SavedQueryRuleResponseFields = z.infer<typeof SavedQueryRuleResponseFields>;
export const SavedQueryRuleResponseFields = SavedQueryRuleRequiredFields.merge(
  SavedQueryRuleOptionalFields
).merge(SavedQueryRuleDefaultableFields.required());

export type SavedQueryRule = z.infer<typeof SavedQueryRule>;
export const SavedQueryRule = SharedResponseProps.merge(SavedQueryRuleResponseFields);

export type SavedQueryRuleCreateProps = z.infer<typeof SavedQueryRuleCreateProps>;
export const SavedQueryRuleCreateProps = SharedCreateProps.merge(SavedQueryRuleCreateFields);

export type SavedQueryRuleUpdateProps = z.infer<typeof SavedQueryRuleUpdateProps>;
export const SavedQueryRuleUpdateProps = SharedUpdateProps.merge(SavedQueryRuleCreateFields);

export type SavedQueryRulePatchProps = z.infer<typeof SavedQueryRulePatchProps>;
export const SavedQueryRulePatchProps = SharedPatchProps.merge(SavedQueryRulePatchFields);

export type ThresholdRuleRequiredFields = z.infer<typeof ThresholdRuleRequiredFields>;
export const ThresholdRuleRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('threshold'),
  query: RuleQuery,
  threshold: Threshold,
});

export type ThresholdRuleOptionalFields = z.infer<typeof ThresholdRuleOptionalFields>;
export const ThresholdRuleOptionalFields = z.object({
  index: IndexPatternArray.optional(),
  data_view_id: DataViewId.optional(),
  filters: RuleFilterArray.optional(),
  saved_id: SavedQueryId.optional(),
  alert_suppression: ThresholdAlertSuppression.optional(),
});

export type ThresholdRuleDefaultableFields = z.infer<typeof ThresholdRuleDefaultableFields>;
export const ThresholdRuleDefaultableFields = z.object({
  language: KqlQueryLanguage.optional(),
});

export type ThresholdRuleCreateFields = z.infer<typeof ThresholdRuleCreateFields>;
export const ThresholdRuleCreateFields = ThresholdRuleRequiredFields.merge(
  ThresholdRuleOptionalFields
).merge(ThresholdRuleDefaultableFields);

export type ThresholdRulePatchFields = z.infer<typeof ThresholdRulePatchFields>;
export const ThresholdRulePatchFields = ThresholdRuleRequiredFields.partial()
  .merge(ThresholdRuleOptionalFields)
  .merge(ThresholdRuleDefaultableFields);

export type ThresholdRuleResponseFields = z.infer<typeof ThresholdRuleResponseFields>;
export const ThresholdRuleResponseFields = ThresholdRuleRequiredFields.merge(
  ThresholdRuleOptionalFields
).merge(ThresholdRuleDefaultableFields.required());

export type ThresholdRule = z.infer<typeof ThresholdRule>;
export const ThresholdRule = SharedResponseProps.merge(ThresholdRuleResponseFields);

export type ThresholdRuleCreateProps = z.infer<typeof ThresholdRuleCreateProps>;
export const ThresholdRuleCreateProps = SharedCreateProps.merge(ThresholdRuleCreateFields);

export type ThresholdRuleUpdateProps = z.infer<typeof ThresholdRuleUpdateProps>;
export const ThresholdRuleUpdateProps = SharedUpdateProps.merge(ThresholdRuleCreateFields);

export type ThresholdRulePatchProps = z.infer<typeof ThresholdRulePatchProps>;
export const ThresholdRulePatchProps = SharedPatchProps.merge(ThresholdRulePatchFields);

export type ThreatMatchRuleRequiredFields = z.infer<typeof ThreatMatchRuleRequiredFields>;
export const ThreatMatchRuleRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('threat_match'),
  query: RuleQuery,
  threat_query: ThreatQuery,
  threat_mapping: ThreatMapping,
  threat_index: ThreatIndex,
});

export type ThreatMatchRuleOptionalFields = z.infer<typeof ThreatMatchRuleOptionalFields>;
export const ThreatMatchRuleOptionalFields = z.object({
  index: IndexPatternArray.optional(),
  data_view_id: DataViewId.optional(),
  filters: RuleFilterArray.optional(),
  saved_id: SavedQueryId.optional(),
  threat_filters: ThreatFilters.optional(),
  threat_indicator_path: ThreatIndicatorPath.optional(),
  threat_language: KqlQueryLanguage.optional(),
  concurrent_searches: ConcurrentSearches.optional(),
  items_per_search: ItemsPerSearch.optional(),
  alert_suppression: AlertSuppression.optional(),
});

export type ThreatMatchRuleDefaultableFields = z.infer<typeof ThreatMatchRuleDefaultableFields>;
export const ThreatMatchRuleDefaultableFields = z.object({
  language: KqlQueryLanguage.optional(),
});

export type ThreatMatchRuleCreateFields = z.infer<typeof ThreatMatchRuleCreateFields>;
export const ThreatMatchRuleCreateFields = ThreatMatchRuleRequiredFields.merge(
  ThreatMatchRuleOptionalFields
).merge(ThreatMatchRuleDefaultableFields);

export type ThreatMatchRulePatchFields = z.infer<typeof ThreatMatchRulePatchFields>;
export const ThreatMatchRulePatchFields = ThreatMatchRuleRequiredFields.partial()
  .merge(ThreatMatchRuleOptionalFields)
  .merge(ThreatMatchRuleDefaultableFields);

export type ThreatMatchRuleResponseFields = z.infer<typeof ThreatMatchRuleResponseFields>;
export const ThreatMatchRuleResponseFields = ThreatMatchRuleRequiredFields.merge(
  ThreatMatchRuleOptionalFields
).merge(ThreatMatchRuleDefaultableFields.required());

export type ThreatMatchRule = z.infer<typeof ThreatMatchRule>;
export const ThreatMatchRule = SharedResponseProps.merge(ThreatMatchRuleResponseFields);

export type ThreatMatchRuleCreateProps = z.infer<typeof ThreatMatchRuleCreateProps>;
export const ThreatMatchRuleCreateProps = SharedCreateProps.merge(ThreatMatchRuleCreateFields);

export type ThreatMatchRuleUpdateProps = z.infer<typeof ThreatMatchRuleUpdateProps>;
export const ThreatMatchRuleUpdateProps = SharedUpdateProps.merge(ThreatMatchRuleCreateFields);

export type ThreatMatchRulePatchProps = z.infer<typeof ThreatMatchRulePatchProps>;
export const ThreatMatchRulePatchProps = SharedPatchProps.merge(ThreatMatchRulePatchFields);

export type MachineLearningRuleRequiredFields = z.infer<typeof MachineLearningRuleRequiredFields>;
export const MachineLearningRuleRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('machine_learning'),
  anomaly_threshold: AnomalyThreshold,
  machine_learning_job_id: MachineLearningJobId,
});

export type MachineLearningRuleOptionalFields = z.infer<typeof MachineLearningRuleOptionalFields>;
export const MachineLearningRuleOptionalFields = z.object({
  alert_suppression: AlertSuppression.optional(),
});

export type MachineLearningRulePatchFields = z.infer<typeof MachineLearningRulePatchFields>;
export const MachineLearningRulePatchFields = MachineLearningRuleRequiredFields.partial().merge(
  MachineLearningRuleOptionalFields
);

export type MachineLearningRuleResponseFields = z.infer<typeof MachineLearningRuleResponseFields>;
export const MachineLearningRuleResponseFields = MachineLearningRuleRequiredFields.merge(
  MachineLearningRuleOptionalFields
);

export type MachineLearningRuleCreateFields = z.infer<typeof MachineLearningRuleCreateFields>;
export const MachineLearningRuleCreateFields = MachineLearningRuleRequiredFields.merge(
  MachineLearningRuleOptionalFields
);

export type MachineLearningRule = z.infer<typeof MachineLearningRule>;
export const MachineLearningRule = SharedResponseProps.merge(MachineLearningRuleResponseFields);

export type MachineLearningRuleCreateProps = z.infer<typeof MachineLearningRuleCreateProps>;
export const MachineLearningRuleCreateProps = SharedCreateProps.merge(
  MachineLearningRuleCreateFields
);

export type MachineLearningRuleUpdateProps = z.infer<typeof MachineLearningRuleUpdateProps>;
export const MachineLearningRuleUpdateProps = SharedUpdateProps.merge(
  MachineLearningRuleCreateFields
);

export type MachineLearningRulePatchProps = z.infer<typeof MachineLearningRulePatchProps>;
export const MachineLearningRulePatchProps = SharedPatchProps.merge(MachineLearningRulePatchFields);

export type NewTermsRuleRequiredFields = z.infer<typeof NewTermsRuleRequiredFields>;
export const NewTermsRuleRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('new_terms'),
  query: RuleQuery,
  new_terms_fields: NewTermsFields,
  history_window_start: HistoryWindowStart,
});

export type NewTermsRuleOptionalFields = z.infer<typeof NewTermsRuleOptionalFields>;
export const NewTermsRuleOptionalFields = z.object({
  index: IndexPatternArray.optional(),
  data_view_id: DataViewId.optional(),
  filters: RuleFilterArray.optional(),
  alert_suppression: AlertSuppression.optional(),
});

export type NewTermsRuleDefaultableFields = z.infer<typeof NewTermsRuleDefaultableFields>;
export const NewTermsRuleDefaultableFields = z.object({
  language: KqlQueryLanguage.optional(),
});

export type NewTermsRulePatchFields = z.infer<typeof NewTermsRulePatchFields>;
export const NewTermsRulePatchFields = NewTermsRuleRequiredFields.partial()
  .merge(NewTermsRuleOptionalFields)
  .merge(NewTermsRuleDefaultableFields);

export type NewTermsRuleResponseFields = z.infer<typeof NewTermsRuleResponseFields>;
export const NewTermsRuleResponseFields = NewTermsRuleRequiredFields.merge(
  NewTermsRuleOptionalFields
).merge(NewTermsRuleDefaultableFields.required());

export type NewTermsRuleCreateFields = z.infer<typeof NewTermsRuleCreateFields>;
export const NewTermsRuleCreateFields = NewTermsRuleRequiredFields.merge(
  NewTermsRuleOptionalFields
).merge(NewTermsRuleDefaultableFields);

export type NewTermsRule = z.infer<typeof NewTermsRule>;
export const NewTermsRule = SharedResponseProps.merge(NewTermsRuleResponseFields);

export type NewTermsRuleCreateProps = z.infer<typeof NewTermsRuleCreateProps>;
export const NewTermsRuleCreateProps = SharedCreateProps.merge(NewTermsRuleCreateFields);

export type NewTermsRuleUpdateProps = z.infer<typeof NewTermsRuleUpdateProps>;
export const NewTermsRuleUpdateProps = SharedUpdateProps.merge(NewTermsRuleCreateFields);

export type NewTermsRulePatchProps = z.infer<typeof NewTermsRulePatchProps>;
export const NewTermsRulePatchProps = SharedPatchProps.merge(NewTermsRulePatchFields);

export type EsqlQueryLanguage = z.infer<typeof EsqlQueryLanguage>;
export const EsqlQueryLanguage = z.literal('esql');

export type EsqlRuleRequiredFields = z.infer<typeof EsqlRuleRequiredFields>;
export const EsqlRuleRequiredFields = z.object({
  /**
   * Rule type
   */
  type: z.literal('esql'),
  language: EsqlQueryLanguage,
  /**
   * ESQL query to execute
   */
  query: RuleQuery,
});

export type EsqlRuleOptionalFields = z.infer<typeof EsqlRuleOptionalFields>;
export const EsqlRuleOptionalFields = z.object({
  alert_suppression: AlertSuppression.optional(),
  response_actions: z.array(ResponseAction).optional(),
});

export type EsqlRulePatchFields = z.infer<typeof EsqlRulePatchFields>;
export const EsqlRulePatchFields = EsqlRuleOptionalFields.merge(EsqlRuleRequiredFields.partial());

export type EsqlRuleResponseFields = z.infer<typeof EsqlRuleResponseFields>;
export const EsqlRuleResponseFields = EsqlRuleOptionalFields.merge(EsqlRuleRequiredFields);

export type EsqlRuleCreateFields = z.infer<typeof EsqlRuleCreateFields>;
export const EsqlRuleCreateFields = EsqlRuleOptionalFields.merge(EsqlRuleRequiredFields);

export type EsqlRule = z.infer<typeof EsqlRule>;
export const EsqlRule = SharedResponseProps.merge(EsqlRuleResponseFields);

export type EsqlRuleCreateProps = z.infer<typeof EsqlRuleCreateProps>;
export const EsqlRuleCreateProps = SharedCreateProps.merge(EsqlRuleCreateFields);

export type EsqlRuleUpdateProps = z.infer<typeof EsqlRuleUpdateProps>;
export const EsqlRuleUpdateProps = SharedUpdateProps.merge(EsqlRuleCreateFields);

export type EsqlRulePatchProps = z.infer<typeof EsqlRulePatchProps>;
export const EsqlRulePatchProps = SharedPatchProps.merge(EsqlRulePatchFields.partial());

const TypeSpecificCreatePropsInternal = z.discriminatedUnion('type', [
  EqlRuleCreateFields,
  QueryRuleCreateFields,
  SavedQueryRuleCreateFields,
  ThresholdRuleCreateFields,
  ThreatMatchRuleCreateFields,
  MachineLearningRuleCreateFields,
  NewTermsRuleCreateFields,
  EsqlRuleCreateFields,
]);

export type TypeSpecificCreateProps = z.infer<typeof TypeSpecificCreatePropsInternal>;
export const TypeSpecificCreateProps =
  TypeSpecificCreatePropsInternal as z.ZodType<TypeSpecificCreateProps>;

const TypeSpecificPatchPropsInternal = z.union([
  EqlRulePatchFields,
  QueryRulePatchFields,
  SavedQueryRulePatchFields,
  ThresholdRulePatchFields,
  ThreatMatchRulePatchFields,
  MachineLearningRulePatchFields,
  NewTermsRulePatchFields,
  EsqlRulePatchFields,
]);

export type TypeSpecificPatchProps = z.infer<typeof TypeSpecificPatchPropsInternal>;
export const TypeSpecificPatchProps =
  TypeSpecificPatchPropsInternal as z.ZodType<TypeSpecificPatchProps>;

const TypeSpecificResponseInternal = z.discriminatedUnion('type', [
  EqlRuleResponseFields,
  QueryRuleResponseFields,
  SavedQueryRuleResponseFields,
  ThresholdRuleResponseFields,
  ThreatMatchRuleResponseFields,
  MachineLearningRuleResponseFields,
  NewTermsRuleResponseFields,
  EsqlRuleResponseFields,
]);

export type TypeSpecificResponse = z.infer<typeof TypeSpecificResponseInternal>;
export const TypeSpecificResponse = TypeSpecificResponseInternal as z.ZodType<TypeSpecificResponse>;

const RuleCreatePropsInternal = z.discriminatedUnion('type', [
  EqlRuleCreateProps,
  QueryRuleCreateProps,
  SavedQueryRuleCreateProps,
  ThresholdRuleCreateProps,
  ThreatMatchRuleCreateProps,
  MachineLearningRuleCreateProps,
  NewTermsRuleCreateProps,
  EsqlRuleCreateProps,
]);

export type RuleCreateProps = z.infer<typeof RuleCreatePropsInternal>;
export const RuleCreateProps = RuleCreatePropsInternal as z.ZodType<RuleCreateProps>;

const RuleUpdatePropsInternal = z.discriminatedUnion('type', [
  EqlRuleUpdateProps,
  QueryRuleUpdateProps,
  SavedQueryRuleUpdateProps,
  ThresholdRuleUpdateProps,
  ThreatMatchRuleUpdateProps,
  MachineLearningRuleUpdateProps,
  NewTermsRuleUpdateProps,
  EsqlRuleUpdateProps,
]);

export type RuleUpdateProps = z.infer<typeof RuleUpdatePropsInternal>;
export const RuleUpdateProps = RuleUpdatePropsInternal as z.ZodType<RuleUpdateProps>;

const RulePatchPropsInternal = z.union([
  EqlRulePatchProps,
  QueryRulePatchProps,
  SavedQueryRulePatchProps,
  ThresholdRulePatchProps,
  ThreatMatchRulePatchProps,
  MachineLearningRulePatchProps,
  NewTermsRulePatchProps,
  EsqlRulePatchProps,
]);

export type RulePatchProps = z.infer<typeof RulePatchPropsInternal>;
export const RulePatchProps = RulePatchPropsInternal as z.ZodType<RulePatchProps>;

const RuleResponseInternal = z.discriminatedUnion('type', [
  EqlRule,
  QueryRule,
  SavedQueryRule,
  ThreatMatchRule,
  MachineLearningRule,
  NewTermsRule,
  EsqlRule,
]);

export type RuleResponse = z.infer<typeof RuleResponseInternal>;
export const RuleResponse = RuleResponseInternal as z.ZodType<RuleResponse>;
