import { XHSApiResponse } from '../types';
import { getDefaultApiUrl } from '../constants';

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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: input, // Send the raw share text
        download: false // We only want metadata first
      }),
      signal: internalController.signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: XHSApiResponse = await response.json();
    return data;
  } catch (error) {
    // fetch 在 signal 被 abort 时抛 AbortError
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ParseAbortError(timeoutFired ? 'timeout' : 'cancelled');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', forwardAbort);
    }
  }
};