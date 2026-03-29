const fs = require('fs');

const categories = [
  'iPhone 15 Series',
  'Samsung Galaxy Series',
  'Google Pixel Series',
  'OnePlus Series',
  'Xiaomi Series',
  'Huawei Series',
  'Clear Cases',
  'Leather Cases',
  'Eco-friendly Cases',
  'Custom Print Cases',
  'B2B Bulk',
  'Gaming Phone Series',
  'Rugged Phone Series',
  'Wallet Cases',
  'Folio Cases',
  'Kickstand Cases',
  'Battery Cases',
  'Screen Protectors',
  'Camera Protectors',
  'Chargers & Cables'
];

const materials = ['TPU', 'PC', 'Leather', 'Fabric', 'Biodegradable'];
const finishes = ['Matte', 'Glossy', 'Satin'];
const features = [
  'Drop protection',
  'Scratch resistant',
  'Slim profile',
  'Precise cutouts',
  'Wireless charging compatible',
  'Eco-friendly material',
  'Anti-yellowing',
  'Raised edges',
  'Lightweight',
  'Durable'
];

function generateId(index) {
  return `prod-${String(index+1).padStart(3, '0')}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function generateProduct(i) {
  const category = categories[i % categories.length];
  const material = materials[randomInt(0, materials.length-1)];
  const finish = finishes[randomInt(0, finishes.length-1)];
  const moq = [100, 200, 500, 1000][randomInt(0,3)];
  const minPrice = parseFloat(randomFloat(1.5, 3.5));
  const maxPrice = parseFloat(randomFloat(minPrice, minPrice*1.8));
  
  const name = `${category} Model ${String.fromCharCode(65 + (i % 26))}${i+1}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  let compatibility = [];
  if (category.includes('iPhone')) {
    compatibility = ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15'];
  } else if (category.includes('Samsung')) {
    compatibility = ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Series'];
  } else if (category.includes('Pixel')) {
    compatibility = ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a'];
  } else {
    compatibility = ['Universal', 'Most models'];
  }
  
  const price_tiers = [
    { minQty: moq, price: minPrice, label: `MOQ ${moq}` },
    { minQty: moq*2, price: parseFloat((minPrice*0.95).toFixed(2)), label: `${moq*2} pcs` },
    { minQty: moq*10, price: maxPrice, label: `${moq*10} pcs` }
  ];
  
  const productFeatures = features.sort(() => 0.5 - Math.random()).slice(0, randomInt(3,6));
  
  const images = [
    `https://picsum.photos/seed/${slug}/800/800`,
    `https://picsum.photos/seed/${slug}-2/800/800`,
    `https://picsum.photos/seed/${slug}-3/800/800`
  ];
  
  const now = new Date().toISOString();
  
  return {
    id: generateId(i),
    name,
    slug,
    category,
    description: `High-quality ${category.toLowerCase()} for ${compatibility[0]}. ${material} material with ${finish} finish.`,
    fullDescription: `Our ${name} offers premium protection and style. Made from ${material} with a ${finish} finish. Features include: ${productFeatures.join(', ')}. Compatible with ${compatibility.join(', ')}. MOQ: ${moq} units. Lead time: 7-10 business days.`,
    compatibility,
    material,
    finish,
    thickness: `${randomFloat(0.8, 2.0)}mm`,
    moq,
    leadTime: `${randomInt(5,10)}-${randomInt(10,14)} business days`,
    priceRange: `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)} per piece`,
    price_tiers,
    images,
    features: productFeatures,
    status: 'active',
    viewCount: randomInt(0, 500),
    salesCount: randomInt(0, 200),
    is_active: 1,
    created_at: now,
    updated_at: now
  };
}

const products = Array.from({length: 128}, (_, i) => generateProduct(i));
fs.writeFileSync('data/products.json', JSON.stringify(products, null, 2));
console.log(`✅ Generated ${products.length} products`);
