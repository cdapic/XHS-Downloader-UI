import React, { useState, useEffect, useRef } from 'react';
import { Download, PlayCircle, Image as ImageIcon, Loader2, ExternalLink, AlertCircle, Maximize2 } from 'lucide-react';
import { XHSNoteData, Language } from '../types';
import { downloadMedia, downloadSingleFile } from '../utils/downloader';
import { t } from '../utils/i18n';

interface MediaGridProps {
  data: XHSNoteData;
  language: Language;
}

// Helper to generate thumbnail URL for faster preview
// 缩略图走 imageView2 CDN 压缩：w/240 q/50 首屏只发 ~5-10KB/张，原图只在 hover 放大按钮触发。
const getThumbnailUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('imageView2')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}imageView2/2/w/240/format/webp/q/50`;
};

// Helper to guess extension
const getExtension = (url: string, mediaType: 'video' | 'image'): string => {
  if (mediaType === 'video') return 'mp4';
  const match = url.match(/\.(png|jpg|jpeg|webp|gif)/i);
  if (match) return match[1];
  return 'png';
};

// --- Video Component to handle Blob fetching ---
interface VideoItemProps {
  url: string;
  poster?: string;
  index: number;
}

const VideoItem: React.FC<VideoItemProps> = ({ url, poster, index }) => {
  // 默认折叠：不 fetch 视频流，节省首屏带宽；用户点播放才展开 fetch+blob。
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

      // Fetch using fetch API to strictly control referrer
      // This bypasses the <video> tag's limitation where it might still send Origin/Referrer
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

  // 折叠态：缩略图 + 中心播放按钮；不消耗带宽。
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

  // Error State / Fallback (展开后 fetch 失败)
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
      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-900">
          <Loader2 size={24} className="animate-spin text-white/50" />
        </div>
      )}

      {/* Video Player */}
      {blobUrl && (
        <video
          ref={videoRef}
          src={blobUrl}
          className="w-full h-full object-contain"
          controls
          playsInline
          poster={poster}
          // Loop short videos for better experience
          loop
        />
      )}
    </div>
  );
};

// --- Main Grid Component ---
export const MediaGrid: React.FC<MediaGridProps> = ({ data, language }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadingItems, setDownloadingItems] = useState<Set<number>>(new Set());

  const isVideoNote = data.作品类型 === '视频';
  
  const validLivePhotoUrls = data.动图地址 ? data.动图地址.filter((url): url is string => !!url) : [];
  const validDownloadUrls = data.下载地址 || [];

  let mediaType: 'video' | 'image' = 'image';
  let displayItems: string[] = [];

  if (isVideoNote) {
    mediaType = 'video';
    if (validLivePhotoUrls.length > 0) {
      displayItems = validLivePhotoUrls;
    } else {
      displayItems = validDownloadUrls;
    }
  } else {
    mediaType = 'image';
    displayItems = validDownloadUrls;
  }

  const handleBatchDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      await downloadMedia(
        displayItems, 
        data.作品ID, 
        mediaType,
        (p) => setDownloadProgress(p)
      );
    } catch (e) {
      alert('Download failed. Please check console.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSingleDownload = async (url: string, index: number) => {
    const ext = getExtension(url, mediaType);
    const filename = `${data.作品ID}_${index + 1}.${ext}`;
    
    setDownloadingItems(prev => new Set(prev).add(index));
    try {
      await downloadSingleFile(url, filename);
    } finally {
      setDownloadingItems(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        No media found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {mediaType === 'video' ? <PlayCircle size={20} /> : <ImageIcon size={20} />}
          {mediaType === 'video' ? t(language, 'videos') : t(language, 'images')}
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({displayItems.length})
          </span>
        </h3>
        
        <button
          onClick={handleBatchDownload}
          disabled={isDownloading || displayItems.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-xhs-dark text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium min-w-[180px]"
        >
          {isDownloading ? (
            <div className="flex items-center gap-2 flex-1">
              <Loader2 size={16} className="animate-spin shrink-0" />
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex justify-between items-center text-xs">
                  <span>
                    {t(
                      language,
                      downloadProgress > 80
                        ? 'compressing'
                        : 'downloading',
                    )}
                  </span>
                  <span className="tabular-nums">
                    {downloadProgress}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-xhs-red transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <Download size={16} />
              {t(language, 'downloadAll')}
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {displayItems.map((url, index) => {
          const previewUrl = mediaType === 'image' ? getThumbnailUrl(url) : url;

          let posterUrl: string | undefined = undefined;
          if (mediaType === 'video') {
            const potentialCover = validDownloadUrls[index];
            if (potentialCover && potentialCover !== url) {
              posterUrl = potentialCover;
            }
          }

          return (
            <div 
              key={index} 
              className="group relative aspect-[3/4] bg-gray-900 rounded-xl overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center"
            >
              {mediaType === 'video' ? (
                // Use the new VideoItem component that handles Blob fetching
                <VideoItem 
                  url={url} 
                  poster={posterUrl} 
                  index={index} 
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt={`Content ${index}`} 
                  className="w-full h-full object-contain transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              )}
              
              {/* Overlay gradient for controls visibility */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none z-20" />
              
              <button
                onClick={() => window.open(url, '_blank', 'noreferrer')}
                className="absolute bottom-3 right-[60px] p-3 bg-white/90 backdrop-blur text-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:text-xhs-red z-30"
                title="Open Original"
              >
                <Maximize2 size={18} />
              </button>

              <button
                onClick={() => handleSingleDownload(url, index)}
                disabled={downloadingItems.has(index)}
                className="absolute bottom-3 right-3 p-3 bg-white/90 backdrop-blur text-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:text-xhs-red disabled:opacity-70 disabled:cursor-wait z-30"
                title="Download Original"
              >
                {downloadingItems.has(index) ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
              </button>
              
              <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur text-white text-xs rounded-md font-mono z-20 font-bold border border-white/10">
                {index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};