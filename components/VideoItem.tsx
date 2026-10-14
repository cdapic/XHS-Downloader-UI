import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

interface VideoItemProps {
  url: string;
  poster?: string;
  index: number;
}

/**
 * 视频项组件:折叠态显示缩略图 + 中心播放按钮,点击展开后用 fetch + Blob 代理
 * 绕过 XHS CDN 的 Referer 防盗链。
 *
 * 设计要点:
 * - 默认折叠,不 fetch 视频流(节省首屏带宽)
 * - 展开后 fetch + URL.createObjectURL(),失败给出 Open Original 降级出口
 * - 卸载时清理 Blob URL 防内存泄漏
 */
export const VideoItem: React.FC<VideoItemProps> = ({ url, poster, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!expanded) return;
    let active = true;
    let createdUrl = '';

    const fetchVideo = async () => {
      setLoading(true);
      setError(false);

      // referrerPolicy: 'no-referrer' 避免浏览器自动带 Referer 头触发 CDN 防盗链
      try {
        const response = await fetch(url, { referrerPolicy: 'no-referrer' });
        if (!response.ok) {
          throw new Error(`Failed to load video: ${response.status}`);
        }
        const blob = await response.blob();
        if (active) {
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
          setLoading(false);
        }
      } catch (err) {
        console.error('Video Blob fetch failed:', err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchVideo();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [url, expanded]);

  const handleOpenOriginal = () => {
    window.open(url, '_blank', 'noreferrer');
  };

  // 折叠态:缩略图 + 中心播放按钮;不消耗带宽
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        aria-label={`Play video ${index + 1}`}
        className="w-full h-full relative bg-black group/vid cursor-pointer flex items-center justify-center"
      >
        {poster ? (
          <img
            src={poster}
            alt={`Video ${index + 1}`}
            className="w-full h-full object-contain"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-white/50 text-sm">No preview</div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/vid:bg-black/40 transition-colors">
          <PlayCircle
            size={56}
            className="text-white/90 group-hover/vid:text-white group-hover/vid:scale-110 transition-all drop-shadow-lg"
          />
        </div>
      </button>
    );
  }

  // 展开后 fetch 失败:降级提示 + Open Original 出口
  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 gap-2 p-4 text-center">
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-xs">Preview unavailable</p>
        <button
          onClick={handleOpenOriginal}
          className="mt-2 flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full transition-colors"
        >
          <ExternalLink size={12} />
          Open Original
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
          <Loader2 size={24} className="animate-spin text-white/50" />
        </div>
      )}
      {blobUrl && (
        <video
          ref={videoRef}
          src={blobUrl}
          className="w-full h-full object-contain"
          controls
          playsInline
          poster={poster}
          loop
        />
      )}
    </div>
  );
};