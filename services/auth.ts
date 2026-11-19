import { getAuthTokenUrl } from '../constants';

/**
 * 后端鉴权令牌(运行时获取)。
 *
 * 后端 2.9 起 `POST /xhs/detail` 强制校验 `Authorization: Bearer <token>`,
 * 缺失或无效一律 403。令牌由后端用本地 secret(HMAC-SHA256)签发,secret 持久化在
 * 后端 Volume 里,容器重建不失效;后端默认不设过期时间(`_TOKEN_LIFETIME = None`)。
 *
 * 令牌有两条获取路径,前端都能工作,可单独用也可并存:
 *
 * 1. **同源静态文件(默认)**:部署时把令牌写成 `<origin>/xhs-token.txt`
 *    (sync.sh 自动做),前端按需拉取并缓存。
 *    代价:能打开页面的 LAN 用户也能看到令牌。
 * 2. **反代层注入**:nginx 的 `location /xhs/` 里加
 *    `proxy_set_header Authorization "Bearer <token>";`。
 *    此时前端拿不到令牌文件也没关系 —— nginx 的 proxy_set_header 会覆盖客户端
 *    自带的头。令牌只留在 nginx 配置文件里,不进浏览器。
 *
 * 两种方式并存时以 nginx 注入的为准,前端带的头被覆盖,不会冲突。
 */

/** 令牌格式:base64url(payload) + "." + base64url(HMAC 签名)。 */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** 拉取令牌文件自身的超时:令牌拿不到不该拖垮整个业务请求。 */
const TOKEN_FETCH_TIMEOUT_MS = 2_000;

/** 令牌缓存(模块级,整个页面生命周期内复用)。 */
let cached: Promise<string | null> | null = null;

/** 令牌文件不可达 / 不存在 / 内容不像令牌 → 返回 null(交给 nginx 注入或让后端回 403)。 */
const requestToken = async (): Promise<string | null> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TOKEN_FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(getAuthTokenUrl(), {
            cache: 'no-store',
            signal: controller.signal,
        });
        if (!response.ok) return null;
        const token = (await response.text()).trim();
        // 防呆:nginx 的 SPA fallback 会把不存在的路径回成 index.html(200),
        // 不校验格式的话会把整段 HTML 当令牌发出去。格式不对一律当作"没有令牌"。
        return TOKEN_PATTERN.test(token) ? token : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

/**
 * 取鉴权令牌(带缓存)。
 *
 * @returns 令牌字符串;拿不到时为 null(此时请求不带 Authorization 头)。
 */
export const getAuthToken = (): Promise<string | null> => {
    if (!cached) {
        cached = requestToken();
    }
    return cached;
};

/**
 * 丢弃缓存的令牌。
 *
 * 后端回 403 时调用:令牌可能是"后补部署"的,清缓存后下次请求会重新拉一次。
 */
export const invalidateAuthToken = (): void => {
    cached = null;
};

/**
 * 给请求头补上 Authorization(有令牌时)。
 *
 * 没有令牌时原样返回 —— 对应 nginx 注入模式,前端完全无感。
 */
export const buildAuthHeaders = async (
    headers: Record<string, string>,
): Promise<Record<string, string>> => {
    const token = await getAuthToken();
    return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
};
