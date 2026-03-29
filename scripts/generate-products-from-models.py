#!/usr/bin/env python3
"""
Generate product data based on collected phone models
Outputs: data/products-generated.json (ready for import)
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict

# Load phone models
PHONE_MODELS_FILE = "data/phone-models.json"
PRODUCTS_OUTPUT = "data/products-generated.json"

# Product series configurations
SERIES_CONFIG = {
    "iPhone": {
        "category": "iPhone {generation} Series",
        "material_options": ["TPU (Thermoplastic Polyurethane)", "PC (Polycarbonate)", "Leather", "Silicone"],
        "finish_options": ["Matte Anti-fingerprint", "Glossy", "Transparent", "Textured"],
        "moq": 500,
        "lead_time": "7-10 business days",
        "price_ranges": {
            "TPU": "$1.20 - $1.80",
            "PC": "$1.50 - $2.20",
            "Leather": "$3.00 - $4.50",
            "Silicone": "$1.80 - $2.50",
        }
    },
    "Samsung": {
        "category": "Samsung Galaxy {series}",
        "material_options": ["TPU", "PC + TPU hybrid", "Leather"],
        "finish_options": ["Matte", "Glossy", "Anti-slip"],
        "moq": 500,
        "lead_time": "7-10 business days",
        "price_ranges": {
            "TPU": "$1.30 - $1.90",
            "PC + TPU hybrid": "$1.80 - $2.50",
            "Leather": "$3.20 - $4.80",
        }
    },
    "Huawei": {
        "category": "Huawei {series}",
        "material_options": ["TPU", "Leather", "PC"],
        "finish_options": ["Matte", "Glossy", "Executive"],
        "moq": 500,
        "lead_time": "7-12 business days",
        "price_ranges": {
            "TPU": "$1.20 - $1.80",
            "Leather": "$3.00 - $4.50",
            "PC": "$1.50 - $2.20",
        }
    },
    "Xiaomi": {
        "category": "Xiaomi {series}",
        "material_options": ["TPU", "PC"],
        "finish_options": ["Matte", "Glossy"],
        "moq": 500,
        "lead_time": "7-10 business days",
        "price_ranges": {
            "TPU": "$1.10 - $1.60",
            "PC": "$1.40 - $2.00",
        }
    },
    "OPPO": {
        "category": "OPPO {series}",
        "material_options": ["TPU", "PC", "Leather"],
        "finish_options": ["Matte", "Glossy"],
        "moq": 500,
        "lead_time": "7-10 business days",
        "price_ranges": {
            "TPU": "$1.10 - $1.60",
            "PC": "$1.40 - $2.00",
            "Leather": "$2.80 - $4.00",
        }
    },
    "vivo": {
        "category": "vivo {series}",
        "material_options": ["TPU", "PC"],
        "finish_options": ["Matte", "Glossy"],
        "moq": 500,
        "lead_time": "7-10 business days",
        "price_ranges": {
            "TPU": "$1.10 - $1.60",
            "PC": "$1.40 - $2.00",
        }
    },
    "OnePlus": {
        "category": "OnePlus {series}",
        "material_options": ["TPU", "PC", "Leather"],
        "finish_options": ["Matte", "Glossy", "Sandstone"],
        "moq": 500,
        "lead_time": "7-10 business days",
        "price_ranges": {
            "TPU": "$1.20 - $1.80",
            "PC": "$1.50 - $2.20",
            "Leather": "$3.00 - $4.00",
        }
    }
}

# Product series templates
SERIES_TEMPLATES = {
    "Classic": {
        "name_suffix": "Classic Case",
        "description": "Clean, minimalist protection for {model}. Perfect for professionals.",
        "full_description": "Our Classic series offers a slim profile with reliable drop protection. The {material} material provides everyday durability while maintaining a sleek appearance. Precise cutouts ensure full functionality. Compatible with {model}. Made from premium {material} with reinforced corners.",
        "features": [
            "Slim profile, easy to install/remove",
            "Precise cutouts for all ports and buttons",
            "Supports wireless charging",
            "Anti-yellowing material",
            "Reinforced corner protection"
        ],
        "material": "TPU",
        "finish": "Matte Anti-fingerprint",
        "thickness": "1.2mm",
    },
    "Premium": {
        "name_suffix": "Premium Case",
        "description": "Premium materials and finishes for {model}. Executive appeal with superior protection.",
        "full_description": "The Premium series combines genuine leather with metal accents for an upscale look and feel. Designed specifically for {model}, this case offers excellent protection while maintaining a sophisticated appearance. Includes a built-in card slot for convenience.",
        "features": [
            "Genuine leather exterior (where applicable)",
            "Metal button accents",
            "Built-in card slot",
            "RFID protection",
            "Wireless charging compatible"
        ],
        "material": "Leather",
        "finish": "Hand-finished leather with metal button",
        "thickness": "1.5mm",
    },
    "Heavy-Duty": {
        "name_suffix": "Heavy-Duty Case",
        "description": "Military-grade protection for {model}. Built for extreme conditions.",
        "full_description": "Heavy-duty protection for {model}. Features include dual-layer construction (PC + TPU), reinforced corners, and raised edges for screen and camera protection. Military-grade drop tested (MIL-STD-810H).",
        "features": [
            "Military-grade drop protection",
            "Dual-layer construction (PC + TPU)",
            "Built-in kickstand (select models)",
            "Raised camera and screen edges",
            "Anti-slip grip strips"
        ],
        "material": "PC + TPU hybrid",
        "finish": "Matte texture with grip strips",
        "thickness": "2.0mm",
    },
    "Clear": {
        "name_suffix": "Clear Case",
        "description": "Showcase your {model} with our ultra-clear, yellowing-resistant case.",
        "full_description": "Our Crystal Clear series is made from premium transparent TPU that resists yellowing over time. Perfect for showcasing your device's original design while providing reliable protection.",
        "features": [
            "Ultra-clear, yellowing-resistant",
            "Slim and lightweight",
            "Precise cutouts",
            "No yellowing guarantee",
            "100% transparency"
        ],
        "material": "TPU (Clear)",
        "finish": "Crystal Clear",
        "thickness": "1.0mm",
    }
}

def determine_series_from_model(model: str) -> str:
    """Determine which product series to create based on model"""
    model_lower = model.lower()

    if any(word in model_lower for word in ["promax", "pro max", "ultra", "pro+"]):
        return "Premium"
    elif any(word in model_lower for word in ["flip", "fold", "z fold"]):
        return "Heavy-Duty"  # Foldables need extra protection
    elif "lite" in model_lower or "mini" in model_lower:
        return "Classic"
    else:
        return "Classic"  # Default

def generate_product_name(brand: str, series: str, model: str, template_name: str) -> str:
    """Generate product display name"""
    template = SERIES_TEMPLATES[template_name]
    suffix = template["name_suffix"]
    return f"{model} {suffix}"

def generate_sku(brand: str, model: str, template_name: str, index: int) -> str:
    """Generate SKU/product ID"""
    brand_code = brand[:4].upper().ljust(4, 'X')  # e.g., APLE for Apple
    model_code = model.replace(" ", "").replace("+", "P").replace("ProMax", "PM").replace("Pro+", "PP").replace("Ultra", "ULT")[:8].upper()
    template_code = template_name[:3].upper()
    return f"{brand_code}{model_code}-{template_code}-{index:03d}"

def generate_products_from_models(phone_models: List[Dict]) -> List[Dict]:
    """Generate product catalog from phone models"""
    products = []
    count = 0

    for idx, phone in enumerate(phone_models):
        brand = phone["brand"]
        series = phone["series"]
        model = phone["model"]

        # Get brand config
        if brand not in SERIES_CONFIG:
            print(f"⚠️  Skipping unknown brand: {brand}")
            continue

        config = SERIES_CONFIG[brand]

        # Determine product template (series)
        template_name = determine_series_from_model(model)

        # Format category with series info
        # For iPhone, use "iPhone 15 Series" not "iPhone 15 Series Series"
        if brand == "iPhone":
            # Extract generation from series (e.g., "15" from "iPhone 15")
            gen = series.split()[1] if len(series.split()) > 1 else series
            category = f"iPhone {gen} Series"
        elif brand == "Samsung":
            # Samsung series like "Galaxy S24" -> "Samsung Galaxy S Series"
            if "Z" in series:
                category = "Samsung Galaxy Z Series"
            else:
                category = "Samsung Galaxy S Series"
        elif brand == "Huawei":
            # Huawei series: "Mate Series", "P Series", "nova Series"
            category = f"Huawei {series}"
        else:
            # Other brands: use generic
            category = f"{brand} {series}"

        template = SERIES_TEMPLATES[template_name]

        product = {
            "id": generate_sku(brand, model, template_name, idx),
            "name": generate_product_name(brand, series, model, template_name),
            "slug": generate_sku(brand, model, template_name, idx).lower(),
            "category": category,
            "description": template["description"].format(model=model),
            "fullDescription": template["full_description"].format(model=model, material=template["material"]),
            "compatibility": [model],
            "material": template["material"],
            "finish": template["finish"],
            "thickness": template["thickness"],
            "moq": config["moq"],
            "leadTime": config["lead_time"],
            "priceRange": config["price_ranges"].get(template["material"].split()[0], "$1.50 - $2.00"),
            "patent": "Design Patent Pending",
            "features": template["features"],
            "images": [f"/uploads/series-placeholders/{category.replace(' ', '-')}.png"],
            "is_active": 1,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        products.append(product)
        count += 1
        if count <= 5:  # Print first 5 for verification
            print(f"  📦 Generated: {product['name']} → {product['category']}")

    if count > 5:
        print(f"  ... and {count - 5} more products")

    return products

def main():
    print("🏭 Generating product catalog from phone models...")

    # Load phone models
    if not os.path.exists(PHONE_MODELS_FILE):
        print(f"❌ Phone models file not found: {PHONE_MODELS_FILE}")
        print("   Please run collect-phone-models.py first")
        return

    with open(PHONE_MODELS_FILE, 'r', encoding='utf-8') as f:
        phone_models = json.load(f)

    print(f"📱 Loaded {len(phone_models)} phone models")

    # Generate products
    products = generate_products_from_models(phone_models)

    # Save to JSON
    with open(PRODUCTS_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Generated {len(products)} products")
    print(f"📁 Saved to: {PRODUCTS_OUTPUT}")

    # Print summary by category
    print("\n📊 Products by category:")
    category_counts = {}
    for product in products:
        cat = product["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1

    for cat, count in sorted(category_counts.items()):
        print(f"  {cat}: {count} products")

    print("\n🎯 Next steps:")
    print("  1. Review data/products-generated.json")
    print("  2. Update categories.json if new categories appear")
    print("  3. Import products: node scripts/import-products.js data/products-generated.json")
    print("  4. Upload real product images to replace placeholders")

if __name__ == "__main__":
    main()
