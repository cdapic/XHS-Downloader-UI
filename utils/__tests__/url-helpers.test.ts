import { describe, it, expect } from 'vitest';
import { getExtension } from '../url-helpers';

describe('getExtension', () => {
    it('图片 .jpg → jpg', () => {
        expect(
            getExtension('https://sns-img-bd.xhscdn.com/abc.jpg', 'image'),
        ).toBe('jpg');
    });

    it('图片 .png → png', () => {
        expect(
            getExtension('https://sns-img-bd.xhscdn.com/abc.PNG', 'image'),
        ).toBe('png');
    });

    it('图片 .webp → webp', () => {
        expect(
            getExtension('https://sns-img-bd.xhscdn.com/abc.webp', 'image'),
        ).toBe('webp');
    });

    it('图片无扩展名 → fallback png', () => {
        expect(
            getExtension('https://sns-img-bd.xhscdn.com/abc', 'image'),
        ).toBe('png');
    });

    it('视频 → mp4(无论 URL 是否含扩展名)', () => {
        expect(getExtension('https://x.com/v?id=1', 'video')).toBe('mp4');
        expect(getExtension('https://x.com/v.mp4', 'video')).toBe('mp4');
    });
});