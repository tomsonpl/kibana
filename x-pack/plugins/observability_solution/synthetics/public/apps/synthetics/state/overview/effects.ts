/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { debounce, call, takeLeading, takeEvery, put, select } from 'redux-saga/effects';
import type { TrendTable } from '../../../../../common/types';
import { fetchEffectFactory } from '../utils/fetch_effect';
import { selectOverviewState, selectOverviewTrends } from './selectors';
import {
  fetchMonitorOverviewAction,
  quietFetchOverviewAction,
  refreshOverviewTrends,
  trendStatsBatch,
} from './actions';
import { fetchMonitorOverview, fetchOverviewTrendStats as trendsApi } from './api';
import { MonitorOverviewState } from '.';

export function* fetchMonitorOverviewEffect() {
  yield debounce(
    200, // Only take the latest while ignoring any intermediate triggers
    [fetchMonitorOverviewAction.get, quietFetchOverviewAction.get],
    fetchEffectFactory(
      fetchMonitorOverview,
      fetchMonitorOverviewAction.success,
      fetchMonitorOverviewAction.fail
    )
  );
}

export const TRENDS_CHUNK_SIZE = 50;

export function* fetchTrendEffect(
  action: ReturnType<typeof trendStatsBatch.get>
): Generator<unknown, void, TrendTable> {
  try {
    // batch requests LIFO as the user scrolls
    for (let i = action.payload.length; i > 0; i -= TRENDS_CHUNK_SIZE) {
      const chunk = action.payload.slice(Math.max(i - TRENDS_CHUNK_SIZE, 0), i);
      if (chunk.length > 0) {
        const trendStats = yield call(trendsApi, chunk);
        yield put(trendStatsBatch.success(trendStats));
      }
    }
  } catch (e: any) {
    yield put(trendStatsBatch.fail(e));
  }
}

export function* fetchOverviewTrendStats() {
  yield takeEvery(trendStatsBatch.get, fetchTrendEffect);
}

export function* refreshTrends(): Generator<unknown, void, any> {
  const existingTrends: TrendTable = yield select(selectOverviewTrends);
  const overviewState: MonitorOverviewState = yield select(selectOverviewState);

  let acc = {};
  const keys = Object.keys(existingTrends);
  while (keys.length) {
    const chunk = keys
      .splice(0, keys.length < 10 ? keys.length : 40)
      .filter(
        (key: string) =>
          existingTrends[key] !== null &&
          overviewState.data.monitors.some(
            ({ configId }) => configId === existingTrends[key]!.configId
          )
      )
      .map((key: string) => ({
        configId: existingTrends[key]!.configId,
        locationId: existingTrends[key]!.locationId,
        schedule: overviewState.data.monitors.find(
          ({ configId }) => configId === existingTrends[key]!.configId
        )!.schedule,
      }));
    if (chunk.length) {
      const res = yield call(trendsApi, chunk);
      acc = { ...acc, ...res };
    }
  }
  if (Object.keys(acc).length) {
    yield put(trendStatsBatch.success(acc));
  }
}

export function* refreshOverviewTrendStats() {
  yield takeLeading(refreshOverviewTrends.get, refreshTrends);
}
