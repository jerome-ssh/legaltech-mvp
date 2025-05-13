#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p public/icons

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required. Please install it first:"
    echo "  - macOS: brew install imagemagick"
    echo "  - Ubuntu: sudo apt-get install imagemagick"
    echo "  - Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Function to create an icon
create_icon() {
    local input=$1
    local output=$2
    local size=$3
    local color=$4

    # Create a temporary file for the background
    convert -size ${size}x${size} xc:$color \
        -fill white \
        -gravity center \
        -pointsize $((size/2)) \
        -annotate 0 "$input" \
        "public/icons/$output"
}

# Create main app icons
create_icon "LM" "icon-192x192.png" 192 "#2563eb"  # Blue
create_icon "LM" "icon-512x512.png" 512 "#2563eb"  # Blue

# Create shortcut icons
create_icon "📊" "dashboard.png" 192 "#2563eb"  # Blue
create_icon "👥" "crm.png" 192 "#2563eb"        # Blue
create_icon "📈" "analytics.png" 192 "#2563eb"  # Blue

echo "Icons generated successfully in public/icons/"
echo "You can now customize these icons with your own designs." 