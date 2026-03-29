#!/usr/bin/env python3
"""
Download phone case product images from free image sources
Sources: Unsplash, Pexels (free for commercial use)
"""

import json
import requests
import os
import time
from pathlib import Path
from typing import List, Dict

# Configuration
DOWNLOAD_DIR = Path("public/uploads/series-placeholders")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Image search keywords for each series
IMAGE_KEYWORDS = {
    "iphone-13-series": "iPhone 13 case product photography",
    "iphone-14-series": "iPhone 14 case product photography",
    "iphone-15-series": "iPhone 15 case product photography",
    "iphone-16-series": "iPhone 16 case mockup",
    "samsung-galaxy-s20-s21-s22-s23-s24": "Samsung Galaxy S24 case product",
    "samsung-galaxy-z-flip-fold": "Samsung Galaxy Z Flip case foldable",
    "huawei-mate-series": "Huawei Mate 60 case product",
    "huawei-p-series": "Huawei P60 case photography",
    "huawei-nova-series": "Huawei nova case product",
    "custom-oem-odm": "phone case OEM manufacturing",
    "accessories": "phone accessories wholesale",
}

def download_unsplash_image(keyword: str, filename: str, max_retries: int = 3) -> bool:
    """
    Download image from Unsplash (requires API key for production)
    For now, we'll use placeholder images or you can add your Unsplash API key
    """
    # Option 1: Use Unsplash API (requires API key)
    # UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")
    # if UNSPLASH_ACCESS_KEY:
    #     url = f"https://api.unsplash.com/photos/random?query={keyword}&orientation=portrait"
    #     headers = {"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"}
    #     response = requests.get(url, headers=headers)
    #     if response.status_code == 200:
    #         data = response.json()
    #         image_url = data["urls"]["regular"]
    #         img_data = requests.get(image_url).content
    #         with open(DOWNLOAD_DIR / filename, "wb") as f:
    #             f.write(img_data)
    #         print(f"  ✅ Downloaded: {filename}")
    #         return True

    # Option 2: Use placeholder.co (no API key needed)
    placeholder_url = f"https://placehold.co/400x600/1e40af/white?text={keyword.replace(' ', '+')}"
    try:
        response = requests.get(placeholder_url, timeout=10)
        if response.status_code == 200:
            with open(DOWNLOAD_DIR / filename, "wb") as f:
                f.write(response.content)
            print(f"  ✅ Downloaded placeholder: {filename}")
            return True
    except Exception as e:
        print(f"  ❌ Failed to download {filename}: {e}")
        return False

    return False

def main():
    print("🖼️  Downloading product placeholder images...")
    print(f"📁 Target directory: {DOWNLOAD_DIR}")

    downloaded = 0
    for series_id, keyword in IMAGE_KEYWORDS.items():
        filename = f"{series_id}.png"
        if download_unsplash_image(keyword, filename):
            downloaded += 1
        time.sleep(0.5)  # Be polite to the server

    print(f"\n✅ Downloaded {downloaded}/{len(IMAGE_KEYWORDS)} images")
    print(f"📁 Images saved to: {DOWNLOAD_DIR}")
    print("\n💡 To get real product photos:")
    print("  1. Get Unsplash API key (free) and add to script")
    print("  2. Replace placeholder images manually")
    print("  3. Use your own product photos")

if __name__ == "__main__":
    main()
