#!/usr/bin/env python3
"""Fix double-escaped Unicode including emoji surrogate pairs.
v3: handles \\uD83C\\uDF89 -> actual emoji
"""
import os
import re
import sys

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'apps', 'frontend')
EXTENSIONS = ('.tsx', '.ts', '.jsx', '.js')
SKIP_DIRS = {'node_modules', '.next', 'dist', '.git'}


def fix_content(content):
    count = [0]

    def fix_surrogate_pair(match):
        high = int(match.group(1), 16)
        low = int(match.group(2), 16)
        cp = 0x10000 + (high - 0xD800) * 0x400 + (low - 0xDC00)
        count[0] += 1
        return chr(cp)

    # Step 1: surrogate pairs -> emoji
    content = re.sub(
        r'\\u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][cdefCDEF][0-9a-fA-F]{2})',
        fix_surrogate_pair,
        content
    )

    def fix_regular(match):
        cp = int(match.group(1), 16)
        if 0xD800 <= cp <= 0xDFFF:
            return match.group(0)
        if cp >= 0x00A0:
            count[0] += 1
            return chr(cp)
        return match.group(0)

    # Step 2: regular \\uXXXX -> UTF-8 char
    content = re.sub(r'\\u([0-9a-fA-F]{4})', fix_regular, content)

    return content, count[0]


def main():
    if not os.path.isdir(FRONTEND_DIR):
        print(f'ERROR: {FRONTEND_DIR} not found')
        sys.exit(1)

    print(f'Scanning: {FRONTEND_DIR}')
    print('=' * 60)

    fixed_files = []
    total = 0

    for root, dirs, files in os.walk(FRONTEND_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            if not fname.endswith(EXTENSIONS):
                continue
            filepath = os.path.join(root, fname)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                if not content.strip():
                    continue
                new_content, count = fix_content(content)
                if count > 0:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    fixed_files.append((filepath, count))
                    total += count
            except Exception as e:
                print(f'  WARN: {filepath}: {e}')

    print(f'Files fixed: {len(fixed_files)}')
    print(f'Total replacements: {total}')
    print('=' * 60)
    for fp, cnt in sorted(fixed_files):
        rel = os.path.relpath(fp, os.path.dirname(FRONTEND_DIR))
        print(f'  [{cnt:3d}] {rel}')


if __name__ == '__main__':
    main()
