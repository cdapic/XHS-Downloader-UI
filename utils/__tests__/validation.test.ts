import { describe, it, expect } from 'vitest';
import { validateInput, MAX_INPUT_LEN } from '../validation';

describe('validateInput', () => {
    it('合法 xhslink.com 链接 → ok', () => {
        expect(
            validateInput('https://xhslink.com/o/ZF48mtu9v2'),
        ).toEqual({ ok: true });
    });

    it('合法 xhslink.cn 链接 → ok', () => {
        expect(validateInput('https://xhslink.cn/o/abc')).toEqual({
            ok: true,
        });
    });

    it('合法 xiaohongshu.com(含子域) → ok', () => {
        expect(
            validateInput(
                'https://www.xiaohongshu.com/explore/abc?xsec_token=xyz',
            ),
        ).toEqual({ ok: true });
    });

    it('分享全文含合法链接 → ok(不误伤真实粘贴场景)', () => {
        expect(
            validateInput(
                '10 https://xhslink.com/o/ZF48mtu9v2 复制链接打开「小红书」',
            ),
        ).toEqual({ ok: true });
    });

    it('非小红书文本 → noDomain', () => {
        expect(validateInput('hello world')).toEqual({
            ok: false,
            reason: 'noDomain',
        });
    });

    it('超过 MAX_INPUT_LEN 字符 → tooLong', () => {
        // 即使内容含合法链接,长度优先
        const longText =
            'https://xhslink.com/o/abc ' + 'x'.repeat(MAX_INPUT_LEN);
        expect(validateInput(longText)).toEqual({
            ok: false,
            reason: 'tooLong',
        });
    });

    it('空字符串 → noDomain', () => {
        expect(validateInput('')).toEqual({
            ok: false,
            reason: 'noDomain',
        });
    });
});