export interface XHSNoteData {
  收藏数量: string;
  评论数量: string;
  分享数量: string;
  点赞数量: string;
  作品标签: string;
  作品ID: string;
  作品链接: string;
  作品标题: string;
  作品描述: string;
  作品类型: '图文' | '视频';
  发布时间: string;
  最后更新时间: string;
  时间戳: number;
  作者昵称: string;
  作者ID: string;
  作者链接: string;
  下载地址: string[]; // List of image URLs or video cover
  动图地址: (string | null)[]; // Often null for images, contains video URL if type is video
}

export interface XHSApiResponse {
  message: string;
  params: {
    url: string;
    download: boolean;
    index: number | null;
    cookie: string | null;
    proxy: string | null;
    skip: boolean;
  };
  data: XHSNoteData | null;
}

export enum Language {
  ZH = 'zh',
  EN = 'en',
}

export type ParseStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * FR-03 错误三分类。
 * - network : fetch reject / HTTP 非 2xx / 30s 超时
 * - backend : HTTP 200 但 data 为 null 或空对象(后端已收到但未能解析)
 * - parse   : 输入非法或响应结构不符(主要由 FR-04 输入校验触发)
 */
export type ErrorCategory = 'network' | 'backend' | 'parse';

/**
 * App 层使用的错误对象,与 service 层抛出的 Error 类解耦。
 * - title   : 分类标题(已本地化)
 * - message : 自助建议(network/parse)或后端原文(backend)
 */
export interface AppError {
  category: ErrorCategory;
  title: string;
  message: string;
}