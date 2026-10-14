import { getDefaultApiUrl } from '../constants';

export type HealthStatus = 'unknown' | 'up' | 'down';

const PROBE_TIMEOUT_MS = 5_000;

/**
 * 后端健康探测(FR-07):轻量 POST 探活,5 秒超时。
 *
 * 与 `scripts/verify.sh` 保持一致:同源经 nginx 反代架构下,浏览器不会触发
 * CORS preflight,OPTIONS 由 FastAPI 默认 405,故用 POST + 空 url body
 * (实测 ~8ms 即返回 200,不会触发后端对 URL 的网络解析)更能反映真实链路
 * (nginx → 反代 → 5556)是否就绪。具体解析是否成功由业务请求决定。
 *
 * 返回布尔值:成功(2xx)= true,网络/超时 = false。
 */
export const probeBackend = async (
    timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<boolean> => {
    const endpoint = getDefaultApiUrl().replace(/\/$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: '',
                download: false,
            }),
            signal: controller.signal,
        });
        return response.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
};