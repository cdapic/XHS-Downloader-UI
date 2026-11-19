import { describe, it, expect, vi, beforeEach } from 'vitest';
import { probeBackend, probeBackendDetailed } from '../health';
import { invalidateAuthToken } from '../auth';
import { createFetchMock } from './fetchMock';

const okResponse = (status = 200) =>
    new Response('{}', {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

describe('probeBackend', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        invalidateAuthToken();
    });

    it('1) HTTP 200 → 返回 true(链路正常)', async () => {
        vi.stubGlobal('fetch', createFetchMock(async () => okResponse(200)));
        await expect(probeBackend(1000)).resolves.toBe(true);
    });

    it('2) FastAPI 对未声明方法的 405 → 返回 false(链路异常)', async () => {
        // 锁定行为:即便后端不可达或返回错误码,探活也必须如实反映 down。
        vi.stubGlobal('fetch', createFetchMock(async () => okResponse(405)));
        await expect(probeBackend(1000)).resolves.toBe(false);
    });

    it('3) 用 POST 探测 + 携带空 url body(瞬时响应,不触发后端网络解析)', async () => {
        let captured: RequestInit | undefined;
        vi.stubGlobal(
            'fetch',
            createFetchMock(async (_url, init) => {
                captured = init;
                return okResponse(200);
            }),
        );
        await probeBackend(1000);
        expect(captured?.method).toBe('POST');
        expect(captured?.headers).toMatchObject({
            'Content-Type': 'application/json',
        });
        // body 应为合法 JSON,url 为空串(实测 ~8ms 返回 200)
        const body =
            captured?.body && JSON.parse(captured.body as string);
        expect(body).toEqual({ url: '', download: false });
    });

    it('4) 网络异常(reject) → 返回 false', async () => {
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => {
                throw new TypeError('Failed to fetch');
            }),
        );
        await expect(probeBackend(1000)).resolves.toBe(false);
    });

    it('5) 超时 → 返回 false(不挂死)', async () => {
        // 永不 resolve 的 fetch,应被 50ms 超时打断
        vi.stubGlobal(
            'fetch',
            createFetchMock(() => new Promise<Response>(() => {})),
        );
        await expect(probeBackend(50)).resolves.toBe(false);
    });

    it('6) 后端 2.9+ 强制鉴权:探活也要带令牌,否则恒 403', async () => {
        let captured: RequestInit | undefined;
        vi.stubGlobal(
            'fetch',
            createFetchMock(
                async (_url, init) => {
                    captured = init;
                    return okResponse(200);
                },
                { token: 'aaa.bbb' },
            ),
        );
        await expect(probeBackend(1000)).resolves.toBe(true);
        expect(captured?.headers).toMatchObject({
            Authorization: 'Bearer aaa.bbb',
        });
    });

    it('7) 403 → probeBackend=false,probeBackendDetailed 带回状态码', async () => {
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => okResponse(403)),
        );
        await expect(probeBackend(1000)).resolves.toBe(false);
        await expect(probeBackendDetailed(1000)).resolves.toEqual({
            ok: false,
            status: 403,
        });
    });
});
