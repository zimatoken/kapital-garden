import { KGState } from '../types/state';
import { migrateState } from './migrations';

/**
 * core НЕ импортирует localStorage напрямую. Только этот интерфейс.
 * Завтра: IndexedDBAdapter, FileAdapter, CloudAdapter — без переписывания core.
 */
export interface StorageAdapter {
  load(): Promise<KGState | null>;
  save(state: KGState): Promise<void>;
  snapshot(tag: string): Promise<void>;
  restore(tag: string): Promise<KGState | null>;
}

export function createLocalStorageAdapter(key = 'kg.state'): StorageAdapter {
  const read = (k: string): KGState | null => {
    try {
      const raw = globalThis.localStorage?.getItem(k);
      return raw ? migrateState(JSON.parse(raw)) : null;
    } catch {
      return null; // сломанный JSON — не крашим приложение
    }
  };
  const write = (k: string, state: KGState): void => {
    try {
      globalThis.localStorage?.setItem(k, JSON.stringify(state));
    } catch {
      // quota exceeded — тихо, без паники (принцип: тишина важнее шума)
    }
  };
  return {
    load: async () => read(key),
    save: async (state) => write(key, state),
    snapshot: async (tag) => {
      const s = read(key);
      if (s) write(`${key}.${tag}`, s);
    },
    restore: async (tag) => read(`${key}.${tag}`),
  };
}
