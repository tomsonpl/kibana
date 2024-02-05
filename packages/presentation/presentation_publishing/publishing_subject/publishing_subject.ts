/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { useEffect, useMemo, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { PublishingSubject, ValueFromPublishingSubject } from './types';

/**
 * Declares a publishing subject, allowing external code to subscribe to react state changes.
 * Changes to state fire subject.next
 * @param state React state from useState hook.
 */
export const usePublishingSubject = <T extends unknown = unknown>(
  state: T
): PublishingSubject<T> => {
  const subject = useMemo<BehaviorSubject<T>>(
    () => new BehaviorSubject<T>(state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => subject.next(state), [subject, state]);
  return subject;
};

/**
 * Declares a state variable that is synced with a publishing subject value.
 * @param subject Publishing subject.
 */
export const useStateFromPublishingSubject = <
  SubjectType extends PublishingSubject<any> | undefined = PublishingSubject<any> | undefined
>(
  subject: SubjectType
): ValueFromPublishingSubject<SubjectType> => {
  const [value, setValue] = useState<ValueFromPublishingSubject<SubjectType>>(subject?.getValue());
  useEffect(() => {
    if (!subject) return;
    const subscription = subject.subscribe((newValue) => setValue(newValue));
    return () => subscription.unsubscribe();
  }, [subject]);
  return value;
};
