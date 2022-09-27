/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { TimeRangeBounds } from '@kbn/data-plugin/common';
import type { ISearchStart, QueryStart } from '@kbn/data-plugin/public';
import type { Filter, Query, TimeRange } from '@kbn/es-query';
import { RequestAdapter } from '@kbn/inspector-plugin/common';
import { convertAggregationToChartSeries } from '../../../common/utils/barchart';
import { calculateBarchartColumnTimeInterval } from '../../../common/utils/dates';
import { RawIndicatorFieldId } from '../../../../common/types/indicator';
import { getIndicatorQueryParams } from '../utils/get_indicator_query_params';
import { search } from '../utils/search';

const TIMESTAMP_FIELD = RawIndicatorFieldId.TimeStamp;

export const AGGREGATION_NAME = 'barchartAggregation';

export interface AggregationValue {
  doc_count: number;
  key: number;
  key_as_string: string;
}

export interface Aggregation {
  doc_count: number;
  key: string;
  events: {
    buckets: AggregationValue[];
  };
}

export interface RawAggregatedIndicatorsResponse {
  aggregations: {
    [AGGREGATION_NAME]: {
      buckets: Aggregation[];
    };
  };
}

export interface ChartSeries {
  x: string;
  y: number;
  g: string;
}

export interface FetchAggregatedIndicatorsParams {
  selectedPatterns: string[];
  filters: Filter[];
  filterQuery: Query;
  timeRange: TimeRange;
  field: string;
}

export const createFetchAggregatedIndicators =
  ({
    inspectorAdapter,
    searchService,
    queryService,
  }: {
    inspectorAdapter: RequestAdapter;
    searchService: ISearchStart;
    queryService: QueryStart;
  }) =>
  async (
    { selectedPatterns, timeRange, field, filterQuery, filters }: FetchAggregatedIndicatorsParams,
    signal?: AbortSignal
  ): Promise<ChartSeries[]> => {
    const dateRange: TimeRangeBounds =
      queryService.timefilter.timefilter.calculateBounds(timeRange);

    const dateFrom: number = (dateRange.min as moment.Moment).toDate().getTime();
    const dateTo: number = (dateRange.max as moment.Moment).toDate().getTime();
    const interval = calculateBarchartColumnTimeInterval(dateFrom, dateTo);

    const sharedParams = getIndicatorQueryParams({ timeRange, filters, filterQuery });

    const searchRequestBody = {
      aggregations: {
        [AGGREGATION_NAME]: {
          terms: {
            field,
          },
          aggs: {
            events: {
              date_histogram: {
                field: TIMESTAMP_FIELD,
                fixed_interval: interval,
                min_doc_count: 0,
                extended_bounds: {
                  min: dateFrom,
                  max: dateTo,
                },
              },
            },
          },
        },
      },
      fields: [TIMESTAMP_FIELD, field],
      size: 0,
      ...sharedParams,
    };

    const {
      aggregations: { [AGGREGATION_NAME]: aggregation },
    } = await search<RawAggregatedIndicatorsResponse>(
      searchService,
      {
        params: {
          index: selectedPatterns,
          body: searchRequestBody,
        },
      },
      { signal, inspectorAdapter, requestName: 'Indicators barchart' }
    );

    const aggregations: Aggregation[] = aggregation?.buckets;

    const chartSeries: ChartSeries[] = convertAggregationToChartSeries(aggregations);

    return chartSeries;
  };
