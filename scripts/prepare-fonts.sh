#!/usr/bin/env bash
set -e

FONT_DIR="packages/poster/fonts"
SOURCE_REGULAR="$FONT_DIR/source/NotoSerifSC-Regular.otf"
SOURCE_SEMIBOLD="$FONT_DIR/source/NotoSerifSC-SemiBold.otf"

if [ ! -f "$SOURCE_REGULAR" ] || [ ! -f "$SOURCE_SEMIBOLD" ]; then
  echo "Source fonts missing. Download Noto Serif SC to $FONT_DIR/source/"
  echo "  https://github.com/notofonts/noto-cjk/releases"
  exit 1
fi

if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "pyftsubset not installed"
  echo "  pip install fonttools brotli"
  exit 1
fi

echo "Subsetting Regular..."
pyftsubset "$SOURCE_REGULAR" \
  --output-file="$FONT_DIR/NotoSerifSC-Regular.subset.otf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2000-206F,U+3000-303F,U+4E00-9FFF,U+FF00-FFEF,U+3400-4DBF" \
  --layout-features="*" \
  --no-hinting \
  --desubroutinize

echo "Subsetting SemiBold..."
pyftsubset "$SOURCE_SEMIBOLD" \
  --output-file="$FONT_DIR/NotoSerifSC-SemiBold.subset.otf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2000-206F,U+3000-303F,U+4E00-9FFF,U+FF00-FFEF,U+3400-4DBF" \
  --layout-features="*" \
  --no-hinting \
  --desubroutinize

echo "Done:"
ls -lh "$FONT_DIR"/*.subset.otf
