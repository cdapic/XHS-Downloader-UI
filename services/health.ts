import { getDefaultApiUrl } from '../constants';

export type HealthStatus = 'unknown' | 'up' | 'down';

const PROBE_TIMEOUT_MS = 5_000;

/**
 * 后端健康探测(FR-07):轻量 OPTIONS 预检,5 秒超时。
 * 返回布尔值:成功(2xx)= true,网络/CORS/超时 = false。
 */
export const probeBackend = async (
    timeoutMs: number = PROBE_TIMEOUT_MS,
): Promise<boolean> => {
    const endpoint = getDefaultApiUrl().replace(/\/$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(endpoint, {
            method: 'OPTIONS',
            signal: controller.signal,
        });
        return response.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
};