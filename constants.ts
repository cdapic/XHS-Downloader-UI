import { XHSApiResponse } from './types';

export const DEFAULT_API_URL = 'http://localhost:8000';
export const DEMO_API_KEY = 'demo';

export const MOCK_RESPONSE: XHSApiResponse = {
  "message": "获取小红书作品数据成功 (Demo)",
  "params": {
      "url": "demo",
      "download": false,
      "index": null,
      "cookie": null,
      "proxy": null,
      "skip": false
  },
  "data": {
      "收藏数量": "100+",
      "评论数量": "50+",
      "分享数量": "200+",
      "点赞数量": "1000+",
      "作品标签": "Demo Tag",
      "作品ID": "demo_id_12345",
      "作品链接": "https://www.xiaohongshu.com/explore/demo",
      "作品标题": "Demo Note: Cute Cat Photos",
      "作品描述": "This is a demo response to test the UI functionality without a backend.",
      "作品类型": "图文",
      "发布时间": "2025-01-01_12:00:00",
      "最后更新时间": "2025-01-01_12:00:00",
      "时间戳": 1735732800.0,
      "作者昵称": "Demo User",
      "作者ID": "demo_user_id",
      "作者链接": "#",
      "下载地址": [
          "https://picsum.photos/800/800?random=1",
          "https://picsum.photos/800/1000?random=2",
          "https://picsum.photos/800/800?random=3",
          "https://picsum.photos/1000/800?random=4"
      ],
      "动图地址": [
          null,
          null,
          null,
          null
      ]
  }
};