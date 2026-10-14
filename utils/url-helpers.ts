/**
 * URL 工具函数 (FR-05 共享给单文件下载与 ZIP 打包)
 *
 * `getExtension` 原为 MediaGrid 内私有函数,FR-05 起提到 utils,
 * 被单文件下载与批量打包两条路径共用,避免扩展名硬编码漂移。
 */

/** 图片扩展名白名单,大小写不敏感 */
const IMAGE_EXT_RE = /\.(png|jpg|jpeg|webp|gif)/i;

/**
 * 根据 URL 与媒体类型推断文件扩展名。
 * - 视频一律返回 `mp4`(后端协议层面即 .mp4)
 * - 图片按 URL 实际扩展名推断;无扩展名或无法识别则回退 `png`
 */
export const getExtension = (
  url: string,
  mediaType: 'image' | 'video',
): string => {
  if (mediaType === 'video') return 'mp4';
  const m = url.match(IMAGE_EXT_RE);
  return m ? m[1].toLowerCase() : 'png';
};