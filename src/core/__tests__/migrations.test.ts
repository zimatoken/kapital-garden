import { describe, expect, it } from 'vitest';
import { createInitialState } from '../factories';
import { migrateState } from '../migrations';

describe('migrateState', () => {
  it('валидное состояние v1 проходит без потерь', () => {
    const s = createInitialState();
    expect(migrateState(s)).toEqual(s);
  });

  it('null / мусор → чистое начальное состояние, без паники', () => {
    expect(migrateState(null).deposits).toEqual([]);
    expect(migrateState('garbage').schemaVersion).toBe(1);
    expect(migrateState(42).settings.savings.percent).toBe(10);
  });

  it('объект без schemaVersion → начальное состояние', () => {
    const s = migrateState({ deposits: [] });
    expect(s).toHaveProperty('settings');
    expect(s.schemaVersion).toBe(1);
  });
});
