import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    parseXHSLink,
    ParseAbortError,
    ParseNetworkError,
} from '../xhsService';
import { invalidateAuthToken } from '../auth';
import { createFetchMock } from './fetchMock';

const okBody = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });

/** 业务请求永远不 resolve(用于超时/取消用例)。 */
const never = () => new Promise<Response>(() => {});

describe('parseXHSLink', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        invalidateAuthToken();
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
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => okBody(body)),
        );
        const data = await parseXHSLink('https://xhslink.com/x');
        expect(data).toEqual(body);
    });

    it('2) HTTP 200 + data:null → 返回原 body(null data 由 App 归类为 backend)', async () => {
        const body = { message: 'failed', params: {} as any, data: null };
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => okBody(body)),
        );
        const data = await parseXHSLink('https://xhslink.com/x');
        expect(data).toEqual(body);
        expect(data?.data).toBeNull();
    });

    it('3) HTTP 500 → throws ParseNetworkError(status=500)', async () => {
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => okBody({}, 500)),
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
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => {
                throw new TypeError('Failed to fetch');
            }),
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
        vi.stubGlobal('fetch', createFetchMock(never));
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
        vi.stubGlobal('fetch', createFetchMock(never));
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

    it('7) 后端 2.9+ 强制鉴权:有令牌文件 → 请求带 Authorization 头', async () => {
        let captured: RequestInit | undefined;
        vi.stubGlobal(
            'fetch',
            createFetchMock(
                async (_url, init) => {
                    captured = init;
                    return okBody({ message: 'ok', params: {}, data: null });
                },
                { token: 'aaa.bbb' },
            ),
        );
        await parseXHSLink('x');
        expect(captured?.headers).toMatchObject({
            'Content-Type': 'application/json',
            Authorization: 'Bearer aaa.bbb',
        });
    });

    it('8) 后端 2.9+ 强制鉴权:无令牌文件 → 不带 Authorization(留给 nginx 注入)', async () => {
        let captured: RequestInit | undefined;
        vi.stubGlobal(
            'fetch',
            createFetchMock(async (_url, init) => {
                captured = init;
                return okBody({ message: 'ok', params: {}, data: null });
            }),
        );
        await parseXHSLink('x');
        expect(captured?.headers).toEqual({
            'Content-Type': 'application/json',
        });
    });

    it('9) HTTP 403 → throws ParseNetworkError(status=403)', async () => {
        vi.stubGlobal(
            'fetch',
            createFetchMock(async () => okBody({}, 403)),
        );
        let caught: unknown;
        try {
            await parseXHSLink('x');
        } catch (e) {
            caught = e;
        }
        expect(caught).toBeInstanceOf(ParseNetworkError);
        expect((caught as ParseNetworkError).status).toBe(403);
    });
});
