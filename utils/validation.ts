/**
 * 输入校验工具 (FR-04)
 *
 * 域名白名单:小红书分享文案 / 链接常见域名
 * - xhslink.com / xhslink.cn (短链)
 * - xiaohongshu.com (完整域名,允许 www./m. 等子域)
 *
 * 长度上限:2000 字符,避免超长粘贴误伤后端与本地存储
 */

const XHS_DOMAIN_RE =
  /https?:\/\/(?:[\w-]+\.)*(?:xhslink\.com|xhslink\.cn|xiaohongshu\.com)\/\S*/i;

export const MAX_INPUT_LEN = 2000;

export type ValidationFailure = 'noDomain' | 'tooLong';

export interface ValidationResult {
  ok: boolean;
  reason?: ValidationFailure;
}

export const validateInput = (text: string): ValidationResult => {
  if (text.length > MAX_INPUT_LEN) return { ok: false, reason: 'tooLong' };
  if (!XHS_DOMAIN_RE.test(text)) return { ok: false, reason: 'noDomain' };
  return { ok: true };
};