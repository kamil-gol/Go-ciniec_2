#!/usr/bin/env python3
"""Fix double-escaped Unicode in all frontend source files.

Replaces \\uXXXX (literal backslash + uXXXX in file) with actual UTF-8 chars.
Example: \\u0105 -> ą, \\u0142 -> ł, \\u0144 -> ń
"""
import os
import re
import sys

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'apps', 'frontend')
EXTENSIONS = ('.tsx', '.ts', '.jsx', '.js')
SKIP_DIRS = {'node_modules', '.next', 'dist', '.git'}

# Match TWO literal backslashes + u + 4 hex digits
# In Python regex: each \\ matches one literal backslash
PATTERN = re.compile('\\\\u([0-9a-fA-F]{4})')


def fix_file(filepath):
    """Fix unicode escapes in a single file. Returns number of replacements."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    replacements = [0]  # mutable container instead of nonlocal

    def replacer(match):
        code_point = int(match.group(1), 16)
        char = chr(code_point)
        # Only replace extended Latin and above (Polish chars etc)
        # Skip ASCII control chars and basic ASCII
        if code_point >= 0x00C0:
            replacements[0] += 1
            return char
        return match.group(0)

    new_content = PATTERN.sub(replacer, content)

    if replacements[0] > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

    return replacements[0]


def main():
    if not os.path.isdir(FRONTEND_DIR):
        print(f'ERROR: Frontend dir not found: {FRONTEND_DIR}')
        sys.exit(1)

    print(f'Scanning: {FRONTEND_DIR}')
    print(f'Pattern: two literal backslashes + uXXXX')
    print(f'=' * 60)

    fixed_files = []
    total = 0

    for root, dirs, files in os.walk(FRONTEND_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            if not fname.endswith(EXTENSIONS):
                continue
            filepath = os.path.join(root, fname)
            try:
                count = fix_file(filepath)
                if count > 0:
                    fixed_files.append((filepath, count))
                    total += count
            except Exception as e:
                print(f'  WARN: {filepath}: {e}')

    print(f'\nFiles fixed: {len(fixed_files)}')
    print(f'Total replacements: {total}')
    print(f'=' * 60)
    for fp, cnt in sorted(fixed_files):
        rel = os.path.relpath(fp, os.path.dirname(FRONTEND_DIR))
        print(f'  [{cnt:3d}] {rel}')

    if total == 0:
        print('\nNo double-escaped Unicode found. Files are clean.')
    else:
        print(f'\nDone! {total} replacements in {len(fixed_files)} files.')


if __name__ == '__main__':
    main()
