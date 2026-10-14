import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    parseXHSLink,
    ParseAbortError,
    ParseNetworkError,
} from '../xhsService';

const okBody = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

/** Mock fetch that respects AbortSignal — happy-dom 的 fetch 不会自动按 signal 中止。 */
const signalAwareFetch = (
    impl?: (init?: RequestInit) => Promise<Response>,
): typeof fetch => {
    return ((_url: string, init?: RequestInit) => {
        const signal = init?.signal;
        return new Promise<Response>((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'));
                return;
            }
            const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
            signal?.addEventListener('abort', onAbort, { once: true });
            impl?.(init).then(resolve, reject);
        });
    }) as typeof fetch;
};

describe('parseXHSLink', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('1) HTTP 200 + 完整 body → 返回 data', async () => {
        const body = {
            message: 'ok',
            params: {
                url: 'https://xhslink.com/x',
                download: false,
                index: null,
                cookie: null,
                proxy: null,
                skip: false,
            },
            data: {
                收藏数量: '0',
                评论数量: '0',
                分享数量: '0',
                点赞数量: '0',
                作品标签: '',
                作品ID: 'id',
                作品链接: '',
                作品标题: 'title',
                作品描述: '',
                作品类型: '图文' as const,
                发布时间: '',
                最后更新时间: '',
                时间戳: 0,
                作者昵称: 'a',
                作者ID: 'a',
                作者链接: '',
                下载地址: ['https://example.com/1.webp'],
                动图地址: [null],
            },
        };
        vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
            Promise.resolve(okBody(body)),
        );
        const data = await parseXHSLink('https://xhslink.com/x');
        expect(data).toEqual(body);
    });

    it('2) HTTP 200 + data:null → 返回原 body(null data 由 App 归类为 backend)', async () => {
        const body = { message: 'failed', params: {} as any, data: null };
        vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
            Promise.resolve(okBody(body)),
        );
        const data = await parseXHSLink('https://xhslink.com/x');
        expect(data).toEqual(body);
        expect(data?.data).toBeNull();
    });

    it('3) HTTP 500 → throws ParseNetworkError(status=500)', async () => {
        vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
            Promise.resolve(okBody({}, 500)),
        );
        let caught: unknown;
        try {
            await parseXHSLink('x');
        } catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(ParseNetworkError);
        expect((caught as ParseNetworkError).status).toBe(500);
    });

    it('4) fetch reject → throws ParseNetworkError', async () => {
        vi.spyOn(global, 'fetch').mockImplementationOnce(() =>
            Promise.reject(new TypeError('Failed to fetch')),
        );
        let caught: unknown;
        try {
            await parseXHSLink('x');
        } catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(ParseNetworkError);
    });

    it('5) 30s 超时(测试用 50ms)→ throws ParseAbortError(reason="timeout")', async () => {
        // 永不 resolve;signal-aware mock 会在内部 timer abort 时拒绝
        vi.spyOn(global, 'fetch').mockImplementationOnce(
            signalAwareFetch(() => new Promise(() => {})) as never,
        );
        let caught: unknown;
        try {
            await parseXHSLink('x', { timeoutMs: 50 });
        } catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(ParseAbortError);
        expect((caught as ParseAbortError).reason).toBe('timeout');
    });

    it('6) 外部 signal abort → throws ParseAbortError(reason="cancelled")', async () => {
        vi.spyOn(global, 'fetch').mockImplementationOnce(
            signalAwareFetch(() => new Promise(() => {})) as never,
        );
        const ac = new AbortController();
        let caught: unknown;
        try {
            const promise = parseXHSLink('x', { signal: ac.signal });
            ac.abort();
            await promise;
        } catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(ParseAbortError);
        expect((caught as ParseAbortError).reason).toBe('cancelled');
    });
});