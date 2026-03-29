#!/usr/bin/env python3
"""
Collect latest phone models data for case manufacturing
Outputs: data/phone-models.json
"""

import json
import requests
from typing import List, Dict
from datetime import datetime

# Known phone models database (based on 2024-2025)
PHONE_MODELS = {
    "iPhone": {
        "13": ["iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 13 mini"],
        "14": ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"],
        "15": ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"],
        "16": ["iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max"],  # expected
        "17": ["iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max"],  # expected
    },
    "Samsung": {
        "Galaxy S24": ["Galaxy S24", "Galaxy S24+", "Galaxy S24 Ultra"],
        "Galaxy S25": ["Galaxy S25", "Galaxy S25+", "Galaxy S25 Ultra"],  # expected 2025
        "Galaxy Z Flip": ["Galaxy Z Flip 5", "Galaxy Z Flip 6"],  # foldable
        "Galaxy Z Fold": ["Galaxy Z Fold 5", "Galaxy Z Fold 6"],  # foldable
        "Galaxy A": ["Galaxy A54", "Galaxy A55", "Galaxy A53", "Galaxy A52"],  # mid-range
    },
    "Huawei": {
        "Mate Series": ["Mate 60", "Mate 60 Pro", "Mate 60 Pro+", "Mate 50", "Mate 50 Pro", "Mate 40", "Mate 40 Pro", "Mate X5"],  # flagship business
        "P Series": ["P70", "P70 Pro", "P60", "P60 Pro", "P50", "P50 Pro", "P40", "P40 Pro"],  # photography flagship
        "nova Series": ["nova 12", "nova 12 Pro", "nova 11", "nova 10", "nova 9"],  # mid-range youth
        "Enjoy Series": ["Enjoy 60", "Enjoy 50", "Enjoy 30"],  # entry-level
    },
    "Xiaomi": {
        "Mi Series": ["Mi 14", "Mi 14 Pro", "Mi 13", "Mi 13 Pro"],
        "Redmi Note": ["Redmi Note 13", "Redmi Note 12", "Redmi Note 11"],
    },
    "OPPO": {
        "Find X": ["Find X7", "Find X6", "Find X5"],
        "Reno": ["Reno 11", "Reno 10", "Reno 9"],
    },
    "vivo": {
        "X Series": ["X100", "X90", "X80"],
        "V Series": ["V30", "V29", "V27"],
    },
    "OnePlus": {
        "Flagship": ["OnePlus 12", "OnePlus 11", "OnePlus 10"],
    }
}

def generate_phone_models_data() -> List[Dict]:
    """Generate structured phone models data"""
    phones = []

    for brand, series_dict in PHONE_MODELS.items():
        for series_name, models in series_dict.items():
            series_id = f"{brand}-{series_name}".lower().replace(" ", "-").replace("/", "-")

            for model in models:
                phone_id = model.lower().replace(" ", "-").replace("+", "plus").replace(".", "")
                phones.append({
                    "id": phone_id,
                    "brand": brand,
                    "series": series_name,
                    "model": model,
                    "slug": phone_id,
                    "is_current": True,  # 2024-2025 models
                    "year": 2024 if "expected" not in series_name else 2025,
                    "created_at": datetime.now().isoformat(),
                })

    return phones

def save_to_json(phones: List[Dict], filename: str):
    """Save data to JSON file"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(phones, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved {len(phones)} phone models to {filename}")

def main():
    print("📱 Collecting phone models data...")
    phones = generate_phone_models_data()
    save_to_json(phones, "data/phone-models.json")

    # Print summary by brand
    print("\n📊 Summary by brand:")
    brand_counts = {}
    for phone in phones:
        brand = phone["brand"]
        brand_counts[brand] = brand_counts.get(brand, 0) + 1

    for brand, count in sorted(brand_counts.items()):
        print(f"  {brand}: {count} models")

    print("\n🎯 Next steps:")
    print("  1. Review data/phone-models.json")
    print("  2. Generate product recommendations")
    print("  3. Sync with your product catalog")

if __name__ == "__main__":
    main()
