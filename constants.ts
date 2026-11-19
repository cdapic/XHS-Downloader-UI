// 默认走同源 /xhs/detail (由 nginx 反代到 5556),避免浏览器跨端口直连后端。
// 浏览器端调用,不在构建期执行,所以 window 一定存在。
export const getDefaultApiUrl = () =>
  `${window.location.origin}/xhs/detail`;

// 鉴权令牌文件(同源静态文件),部署时由 sync.sh 写入 dist/xhs-token.txt。
// 后端 2.9 起强制校验 `Authorization: Bearer <token>`,前端从这里取令牌。
export const getAuthTokenUrl = () =>
  `${window.location.origin}/xhs-token.txt`;
