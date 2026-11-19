/** 测试用 fetch mock:按 URL 路由,令牌文件与业务请求分开处理。 */

export const TOKEN_FILE = 'xhs-token.txt';

/**
 * 创建一个 signal-aware 的 fetch mock。
 *
 * - 请求令牌文件(`/xhs-token.txt`):`token` 为 null 时回 404(模拟"没有令牌文件",
 *   对应 nginx 注入模式);给字符串则回 200 + 令牌原文。
 * - 其它 URL:交给 `impl` 处理。
 *
 * happy-dom 的 fetch 不会自动按 signal 中止,所以这里自己实现中止语义。
 */
export const createFetchMock = (
    impl?: (url: string, init?: RequestInit) => Promise<Response> | Response,
    options: { token?: string | null } = {},
): typeof fetch => {
    const { token = null } = options;

    return ((url: string, init?: RequestInit) => {
        const signal = init?.signal;
        const target = String(url);

        const run = async (): Promise<Response> => {
            if (target.includes(TOKEN_FILE)) {
                if (token === null) {
                    return new Response('Not Found', { status: 404 });
                }
                return new Response(token, { status: 200 });
            }
            return await impl?.(target, init)!;
        };

        return new Promise<Response>((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'));
                return;
            }
            const onAbort = () =>
                reject(new DOMException('Aborted', 'AbortError'));
            signal?.addEventListener('abort', onAbort, { once: true });
            run().then(resolve, reject);
        });
    }) as typeof fetch;
};
