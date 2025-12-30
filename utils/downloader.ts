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
  onProgress?: (percent: number) => void
) => {
  const zip = new JSZip();
  const folder = zip.folder(prefix) || zip;
  
  let processed = 0;

  const promises = urls.map(async (url, index) => {
    try {
      const blob = await fetchBlob(url);
      
      const ext = type === 'video' ? 'mp4' : 'png';
      const filename = `${prefix}_${index + 1}.${ext}`;
      
      folder.file(filename, blob);
    } catch (error) {
      console.error(`Error downloading file ${url}:`, error);
      // Fallback: Add a text file with the error url
      folder.file(`${prefix}_${index + 1}_error.txt`, `Failed to download: ${url}`);
    } finally {
      processed++;
      if (onProgress) {
        onProgress(Math.round((processed / urls.length) * 100));
      }
    }
  });

  await Promise.all(promises);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, `${prefix}_xhs_material.zip`);
};