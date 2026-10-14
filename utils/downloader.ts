import JSZip from 'jszip';

// Native implementation to save files, avoiding external dependency issues
const saveAs = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

// Helper to fetch blob with correct headers to bypass basic hotlink protection
const fetchBlob = async (url: string): Promise<Blob> => {
  // referrerPolicy: 'no-referrer' is crucial for XHS CDN to allow access
  const response = await fetch(url, { referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.blob();
};

export const downloadSingleFile = async (url: string, filename: string) => {
  try {
    const blob = await fetchBlob(url);
    saveAs(blob, filename);
  } catch (error) {
    console.error(`Error downloading file ${url}:`, error);
    // Fallback to opening in new tab if blob fetch fails (e.g. strict CORS)
    window.open(url, '_blank');
  }
};

export const downloadMedia = async (
  urls: string[],
  prefix: string,
  type: 'image' | 'video',
  getFilename?: (url: string, index: number) => string,
  onProgress?: (percent: number) => void,
) => {
  const zip = new JSZip();
  const folder = zip.folder(prefix) || zip;

  let processed = 0;

  const promises = urls.map(async (url, index) => {
    try {
      const blob = await fetchBlob(url);

      // FR-05:扩展名由调用方传入的文件名生成器决定;
      // 旧默认行为作为 fallback,避免破坏现有调用方。
      const filename = getFilename
        ? getFilename(url, index)
        : `${prefix}_${index + 1}.${type === 'video' ? 'mp4' : 'png'}`;

      folder.file(filename, blob);
    } catch (error) {
      console.error(`Error downloading file ${url}:`, error);
      // Fallback: Add a text file with the error url
      folder.file(
        `${prefix}_${index + 1}_error.txt`,
        `Failed to download: ${url}`,
      );
    } finally {
      processed++;
      // fetch 阶段占 0-80%；压缩阶段会从 80% 接续到 99%。
      if (onProgress) {
        onProgress(Math.round((processed / urls.length) * 80));
      }
    }
  });

  await Promise.all(promises);

  // 压缩阶段占 80-99%（留 1% 给 saveAs），与 fetch 阶段拼接成完整 0-100%。
  const content = await zip.generateAsync(
    { type: 'blob' },
    (meta) =>
      onProgress?.(Math.min(99, 80 + Math.round(meta.percent * 0.19))),
  );
  saveAs(content, `${prefix}_xhs_material.zip`);
};