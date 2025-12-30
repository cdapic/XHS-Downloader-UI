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

export interface Settings {
  apiUrl: string;
}

export enum Language {
  ZH = 'zh',
  EN = 'en',
}

export type ParseStatus = 'idle' | 'loading' | 'success' | 'error';