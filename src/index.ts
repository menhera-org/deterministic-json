/* -*- indent-tabs-mode: nil; tab-width: 2; -*- */
/* vim: set ts=2 sw=2 et ai : */
/**
  Copyright (C) 2023 WebExtensions Experts Group

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  @license
*/

namespace DeterministicJSON {
  const EXCLUDED_TYPES: readonly string[] = [
    'undefined',
  ];

  /**
   * Returns a sorted list of string own property keys with non-undefined values.
   */
  export function keys(obj: object): string[] {
    const record = obj as Record<string, unknown>;
    return Object.getOwnPropertyNames(record).sort().filter((key) => {
      const value = record[key];
      if (EXCLUDED_TYPES.includes(typeof value)) return false;
      return true;
    });
  }

  function sortObjectKeysInternal(obj: object, state: object[] = []): object {
    if (state.includes(obj)) throw new Error('Circular reference detected');
    state.push(obj);
    if (Array.isArray(obj)) {
      return obj.map((value) => {
        if (value === null || typeof value != 'object') return value;
        return sortObjectKeysInternal(value, state);
      });
    }
    const record = obj as Record<string, unknown>;
    const sorted = {} as Record<string, unknown>;
    keys(record).forEach((key) => {
      let value = record[key];
      if (value !== null && typeof value == 'object') {
        value = sortObjectKeysInternal(value, state);
      }
      sorted[key] = value;
    });
    state.pop();
    return sorted;
  }

  function sortObjectKeys(obj: object): object {
    return sortObjectKeysInternal(obj);
  }

  /**
   * Returns a new deep-copied object with sorted keys.
   * Returns the same value for non-objects.
   */
  export function sortKeysIfObject(value: unknown): unknown {
    if (value === null || typeof value != 'object') return value;
    return sortObjectKeys(value);
  }

  function stringifyInternal(value: unknown, space?: string | number | undefined): string {
    return JSON.stringify(sortKeysIfObject(value), null, space);
  }

  /**
   * Converts a JavaScript value into a JSON string in a deterministic manner with sorted keys.
   */
  export function stringify(value: unknown, replacer?: (number | string)[] | ((this: any, key: string, value: any) => any) | null, space?: string | number): string {
    const json = JSON.stringify(value, replacer as any);
    const parsed = JSON.parse(json);
    return stringifyInternal(parsed, space);
  }

  export function parse(text: string, reviver?: (this: any, key: string, value: any) => any): unknown {
    const parsed = JSON.parse(text);
    const sorted = sortKeysIfObject(parsed);
    const json = JSON.stringify(sorted);
    return JSON.parse(json, reviver);
  }
}

export { DeterministicJSON };
export default DeterministicJSON;
