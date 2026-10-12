// 默认走同源 /xhs/detail (由 nginx 反代到 5556),避免浏览器跨端口直连后端。
// 浏览器端调用,不在构建期执行,所以 window 一定存在。
export const getDefaultApiUrl = () =>
  `${window.location.origin}/xhs/detail`;