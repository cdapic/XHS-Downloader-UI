import { describe, it, expect, vi, beforeEach } from 'vitest';
import { probeBackend } from '../health';

const okResponse = (status = 200) =>
    new Response('{}', {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

/** 与 xhsService.test.ts 相同的 signal-aware mock(happy-dom fetch 不会自动按 signal 中止)。 */
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

describe('probeBackend', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('1) HTTP 200 → 返回 true(链路正常)', async () => {
        vi.stubGlobal('fetch', signalAwareFetch(async () => okResponse(200)));
        await expect(probeBackend(1000)).resolves.toBe(true);
    });

    it('2) FastAPI 对未声明方法的 405 → 返回 false(链路异常)', async () => {
        // 锁定行为:即便后端不可达或返回错误码,探活也必须如实反映 down。
        vi.stubGlobal('fetch', signalAwareFetch(async () => okResponse(405)));
        await expect(probeBackend(1000)).resolves.toBe(false);
    });

    it('3) 用 POST 探测 + 携带哨兵 URL body(避免被误判为 OPTIONS)', async () => {
        let captured: RequestInit | undefined;
        vi.stubGlobal(
            'fetch',
            signalAwareFetch(async (init) => {
                captured = init;
                return okResponse(200);
            }),
        );
        await probeBackend(1000);
        expect(captured?.method).toBe('POST');
        expect(captured?.headers).toMatchObject({
            'Content-Type': 'application/json',
        });
        // body 应为合法 JSON,且 url 是哨兵
        const body =
            captured?.body && JSON.parse(captured.body as string);
        expect(body).toMatchObject({
            url: expect.stringContaining('__probe__'),
            download: false,
        });
    });

    it('4) 网络异常(reject) → 返回 false', async () => {
        vi.stubGlobal(
            'fetch',
            signalAwareFetch(async () => {
                throw new TypeError('Failed to fetch');
            }),
        );
        await expect(probeBackend(1000)).resolves.toBe(false);
    });

    it('5) 超时 → 返回 false(不挂死)', async () => {
        // 永不 resolve 的 fetch,应被 50ms 超时打断
        vi.stubGlobal('fetch', signalAwareFetch(async () => new Promise<Response>(() => {})));
        await expect(probeBackend(50)).resolves.toBe(false);
    });
});