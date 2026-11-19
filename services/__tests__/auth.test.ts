import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getAuthToken,
    buildAuthHeaders,
    invalidateAuthToken,
} from '../auth';
import { createFetchMock, TOKEN_FILE } from './fetchMock';

describe('auth', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        invalidateAuthToken();
    });

    it('1) 令牌文件存在 → 取到令牌,headers 带上 Authorization', async () => {
        vi.stubGlobal(
            'fetch',
            createFetchMock(undefined, { token: 'aaa.bbb' }),
        );
        await expect(getAuthToken()).resolves.toBe('aaa.bbb');
        await expect(buildAuthHeaders({ 'Content-Type': 'application/json' })).resolves.toEqual({
            'Content-Type': 'application/json',
            Authorization: 'Bearer aaa.bbb',
        });
    });

    it('2) 令牌文件 404 → 返回 null,headers 原样(留给 nginx 注入)', async () => {
        vi.stubGlobal('fetch', createFetchMock(undefined, { token: null }));
        await expect(getAuthToken()).resolves.toBeNull();
        await expect(buildAuthHeaders({ 'Content-Type': 'application/json' })).resolves.toEqual({
            'Content-Type': 'application/json',
        });
    });

    it('3) 令牌文件内容不是令牌格式(如 SPA fallback 的 index.html)→ 当作没有令牌', async () => {
        vi.stubGlobal(
            'fetch',
            createFetchMock(undefined, { token: '<!doctype html><html></html>' }),
        );
        await expect(getAuthToken()).resolves.toBeNull();
    });

    it('4) 令牌文件请求失败(reject)→ 返回 null,不抛异常', async () => {
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => {
                throw new TypeError('Failed to fetch');
            }),
        );
        await expect(getAuthToken()).resolves.toBeNull();
    });

    it('5) 令牌只拉一次(缓存)', async () => {
        let tokenFetches = 0;
        vi.stubGlobal(
            'fetch',
            createFetchMock(
                async () => new Response('{}', { status: 200 }),
                { token: 'aaa.bbb' },
            ),
        );
        const originalFetch = global.fetch;
        vi.stubGlobal('fetch', ((url: string, init?: RequestInit) => {
            if (String(url).includes(TOKEN_FILE)) tokenFetches += 1;
            return originalFetch(url, init);
        }) as typeof fetch);

        await getAuthToken();
        await getAuthToken();
        await buildAuthHeaders({});
        expect(tokenFetches).toBe(1);
    });

    it('6) invalidateAuthToken → 下次重新拉取', async () => {
        let tokenFetches = 0;
        const base = createFetchMock(undefined, { token: 'aaa.bbb' });
        vi.stubGlobal('fetch', ((url: string, init?: RequestInit) => {
            if (String(url).includes(TOKEN_FILE)) tokenFetches += 1;
            return base(url, init);
        }) as typeof fetch);

        await getAuthToken();
        invalidateAuthToken();
        await getAuthToken();
        expect(tokenFetches).toBe(2);
    });
});
