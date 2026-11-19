import { XHSApiResponse } from '../types';
import { getDefaultApiUrl } from '../constants';
import { buildAuthHeaders, invalidateAuthToken } from './auth';

/**
 * 解析请求被中止时的统一错误形态。
 * `cancelled` — 用户主动取消
 * `timeout`   — 超过默认超时（FR-02 默认 30s）
 */
export class ParseAbortError extends Error {
  reason: 'cancelled' | 'timeout';
  constructor(reason: 'cancelled' | 'timeout') {
    super(`Request ${reason}`);
    this.name = 'ParseAbortError';
    this.reason = reason;
  }
}

/**
 * 网络层错误:fetch reject / HTTP 非 2xx / 响应体解析失败。
 * App 层归类为 `network` 错误分类。
 */
export class ParseNetworkError extends Error {
  /** 若为 HTTP 状态码错误,记录状态码;网络层 reject 时为 undefined */
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ParseNetworkError';
    this.status = status;
  }
}

export interface ParseOptions {
  /** 外部传入的 AbortSignal：用户取消时调用方应 abort 此 signal */
  signal?: AbortSignal;
  /** 请求超时时间（毫秒）。默认 30 秒。 */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export const parseXHSLink = async (
  input: string,
  options: ParseOptions = {},
): Promise<XHSApiResponse> => {
  const { signal: externalSignal, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  // 同源 ${window.location.origin}/xhs/detail,由 nginx 反代到后端 5556。
  // Strip any trailing slash defensively: appending an extra `/` here used
  // to trigger FastAPI's 307 redirect, which CORS preflight explicitly
  // forbids and breaks cross-origin POST.
  const endpoint = getDefaultApiUrl().replace(/\/$/, '');

  // 内部 controller 把「外部取消」与「超时」合并到同一个 signal 上，
  // fetch 仅需监听一个 signal；区分由 timeoutFired 闭包变量承担。
  const internalController = new AbortController();
  let timeoutFired = false;

  const timer = setTimeout(() => {
    timeoutFired = true;
    internalController.abort();
  }, timeoutMs);

  const forwardAbort = () => internalController.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      forwardAbort();
    } else {
      externalSignal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  try {
    // 后端 2.9+ 强制 `Authorization: Bearer <token>`。
    // 令牌来自同源 /xhs-token.txt(部署时写入);若由 nginx 注入,这里取不到也不影响。
    const headers = await buildAuthHeaders({
      'Content-Type': 'application/json',
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: input, // Send the raw share text
        download: false // We only want metadata first
      }),
      signal: internalController.signal,
    });

    if (!response.ok) {
      if (response.status === 403) {
        // 令牌缺失/失效。清缓存,下次请求重新拉(可能是后补部署的令牌文件)。
        invalidateAuthToken();
        throw new ParseNetworkError(
          'Backend rejected the request: missing or invalid auth token (HTTP 403)',
          403,
        );
      }
      throw new ParseNetworkError(
        `API responded with HTTP ${response.status}`,
        response.status,
      );
    }

    const data: XHSApiResponse = await response.json();
    return data;
  } catch (error) {
    // fetch 在 signal 被 abort 时抛 AbortError
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ParseAbortError(timeoutFired ? 'timeout' : 'cancelled');
    }
    // 已经是 ParseNetworkError,直接上抛
    if (error instanceof ParseNetworkError) {
      throw error;
    }
    // 其他(fetch reject / JSON 解析失败等)统一归类为网络层错误
    const message =
      error instanceof Error ? error.message : 'Network request failed';
    throw new ParseNetworkError(message);
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', forwardAbort);
    }
  }
};