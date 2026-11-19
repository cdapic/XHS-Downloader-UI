import { getDefaultApiUrl } from '../constants';
import { buildAuthHeaders, invalidateAuthToken } from './auth';

export type HealthStatus = 'unknown' | 'up' | 'down' | 'auth';

/**
 * 'auth' — 后端可达,但拒绝了请求(403):缺少或无效的鉴权令牌。
 * 与 'down'(链路不通)区分开,避免把"缺令牌"误报成"后端没起来"。
 */
export interface ProbeResult {
    /** 2xx = true */
    ok: boolean;
    /** HTTP 状态码;网络异常/超时时为 undefined */
    status?: number;
}

const PROBE_TIMEOUT_MS = 5_000;

/**
 * 后端健康探测(FR-07):轻量 POST 探活,5 秒超时。
 *
 * 与 `scripts/verify.sh` 保持一致:同源经 nginx 反代架构下,浏览器不会触发
 * CORS preflight,OPTIONS 由 FastAPI 默认 405,故用 POST + 空 url body
 * (实测 ~8ms 即返回 200,不会触发后端对 URL 的网络解析)更能反映真实链路
 * (nginx → 反代 → 5556)是否就绪。具体解析是否成功由业务请求决定。
 *
 * 后端 2.9 起强制校验 Authorization 令牌,探活同样要带令牌,否则恒为 403。
 */
export const probeBackendDetailed = async (
    timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<ProbeResult> => {
    const endpoint = getDefaultApiUrl().replace(/\/$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const headers = await buildAuthHeaders({
            'Content-Type': 'application/json',
        });
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                url: '',
                download: false,
            }),
            signal: controller.signal,
        });
        // 403 = 令牌缺失/失效:清缓存,让「重试」能拉到新部署的令牌文件
        if (response.status === 403) {
            invalidateAuthToken();
        }
        return { ok: response.ok, status: response.status };
    } catch {
        return { ok: false };
    } finally {
        clearTimeout(timer);
    }
};

/**
 * 后端健康探测(布尔版):成功(2xx)= true,网络/超时/非 2xx = false。
 */
export const probeBackend = async (
    timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<boolean> => {
    const result = await probeBackendDetailed(timeoutMs);
    return result.ok;
};
