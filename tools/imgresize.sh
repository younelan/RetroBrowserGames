#!/bin/bash

# Default values
DEFAULT_QUALITY=85
OUTPUT_DIR="resized"

show_help() {
    echo "Usage: $0 [options] <image_files...>"
    echo "Options:"
    echo "  -w, --width     Width in pixels (maintains aspect ratio if height not specified)"
    echo "  -h, --height    Height in pixels (maintains aspect ratio if width not specified)"
    echo "  -q, --quality   JPEG quality (1-100, default: original quality)"
    echo "  -d, --dir       Output directory (default: ./resized)"
    echo ""
    echo "Examples:"
    echo "  $0 *.jpg                          # Show this help"
    echo "  $0 -q 75 *.jpg                    # Change quality only"
    echo "  $0 -w 800 *.jpg                   # Resize width to 800px, auto height"
    echo "  $0 -h 600 *.jpg                   # Resize height to 600px, auto width"
    echo "  $0 -w 800 -h 600 *.jpg           # Resize to exact dimensions"
    echo "  $0 -w 800 -q 75 *.jpg            # Resize width + quality"
    echo "  $0 -w 800 -h 600 -q 75 *.jpg     # Resize + quality"
    echo "  $0 -d custom_dir -w 800 *.jpg    # Custom output directory"
}

# Parse arguments
WIDTH=""
HEIGHT=""
QUALITY=""
OUTPUT_DIR="resized"

while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--width)
            WIDTH="$2"
            shift 2
            ;;
        -h|--height)
            HEIGHT="$2"
            shift 2
            ;;
        -q|--quality)
            QUALITY="$2"
            shift 2
            ;;
        -d|--dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -*)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            break
            ;;
    esac
done

# Show help if no parameters provided
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Detect ImageMagick command: prefer `magick` (ImageMagick v7), fall back to `convert`
if command -v magick >/dev/null 2>&1; then
    IMGCMD=magick
elif command -v convert >/dev/null 2>&1; then
    IMGCMD=convert
else
    echo "Error: ImageMagick not found. Install with 'brew install imagemagick' or 'sudo port install ImageMagick'" >&2
    exit 1
fi

# Process each image
for img in "$@"; do
    if [ ! -f "$img" ]; then
        echo "Skipping $img - file not found"
        continue
    fi

    filename=$(basename "$img")
    resize_params=""
    quality_params=""

    # Build resize parameters
    if [ ! -z "$WIDTH" ] && [ ! -z "$HEIGHT" ]; then
        resize_params="-resize ${WIDTH}x${HEIGHT}!"
    elif [ ! -z "$WIDTH" ]; then
        resize_params="-resize ${WIDTH}x"
    elif [ ! -z "$HEIGHT" ]; then
        resize_params="-resize x${HEIGHT}"
    fi

    # Build quality parameters
    if [ ! -z "$QUALITY" ]; then
        quality_params="-quality $QUALITY"
    fi

    # Process image
    if [ ! -z "$resize_params" ] || [ ! -z "$quality_params" ]; then
        # preserve PNG transparency by forcing RGBA output and enabling alpha
        ext=$(echo "${filename##*.}" | tr '[:upper:]' '[:lower:]')
        if [ "$ext" = "png" ]; then
            "$IMGCMD" "$img" -alpha set -background none $resize_params $quality_params PNG32:"$OUTPUT_DIR/$filename"
        else
            "$IMGCMD" "$img" $resize_params $quality_params "$OUTPUT_DIR/$filename"
        fi
        echo "Processed: $img -> $OUTPUT_DIR/$filename"
    else
        echo "No processing needed for $img"
    fi
done