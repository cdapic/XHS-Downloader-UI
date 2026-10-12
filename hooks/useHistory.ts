import { useState, useCallback, useEffect } from 'react';

export interface HistoryItem {
  id: string;
  text: string;
  createdAt: number;
  status: 'success' | 'error';
  noteTitle?: string;
}

const STORAGE_KEY = 'xhs_history';
const MAX_ITEMS = 50;

// 读取 + 校验 + 兜底：JSON.parse 失败 / 非数组 / 元素缺字段都视为空。
const safeRead = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x: any) =>
        typeof x?.text === 'string' &&
        typeof x?.id === 'string' &&
        typeof x?.createdAt === 'number',
    ) as HistoryItem[];
  } catch {
    return [];
  }
};

// 写入失败（localStorage 满 / 隐私模式禁用）静默降级——不打断 UI。
const safeWrite = (items: HistoryItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* noop */
  }
};

export const useHistory = () => {
  const [items, setItems] = useState<HistoryItem[]>(safeRead);

  // 跨 tab 同步：其它 tab 修改 localStorage 时本页刷新列表。
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(safeRead());
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const push = useCallback(
    (item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
      const trimmed = item.text.trim();
      if (!trimmed) return;
      setItems((prev) => {
        // 同文本去重：已有相同 text 时移除旧项（保持最新在最前）。
        const filtered = prev.filter((x) => x.text !== trimmed);
        const next: HistoryItem = {
          ...item,
          text: trimmed,
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: Date.now(),
        };
        const result = [next, ...filtered].slice(0, MAX_ITEMS);
        safeWrite(result);
        return result;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      safeWrite(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    safeWrite([]);
  }, []);

  return { items, push, remove, clear };
};