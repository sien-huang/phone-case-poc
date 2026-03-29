import productsData from '@/data/products.json';

describe('Products Data', () => {
  it('has valid product structure', () => {
    expect(Array.isArray(productsData)).toBe(true);
    expect(productsData.length).toBeGreaterThan(0);
  });

  it('each product has required fields', () => {
    productsData.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('moq');
      expect(product).toHaveProperty('leadTime');
    });
  });

  it('product IDs are unique', () => {
    const ids = productsData.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all products have valid MOQ numbers', () => {
    productsData.forEach(product => {
      expect(typeof product.moq).toBe('number');
      expect(product.moq).toBeGreaterThan(0);
    });
  });

  it('all products have price_tiers or priceRange', () => {
    productsData.forEach(product => {
      const hasPriceTiers = Array.isArray(product.price_tiers) && product.price_tiers.length > 0;
      const hasPriceRange = typeof product.priceRange === 'string';
      expect(hasPriceTiers || hasPriceRange).toBe(true);
    });
  });

  it('categories are non-empty strings', () => {
    productsData.forEach(product => {
      expect(typeof product.category).toBe('string');
      expect(product.category.length).toBeGreaterThan(0);
    });
  });

  it('all products have images', () => {
    productsData.forEach(product => {
      // Products may have images array or single image
      const hasImages = product.images && Array.isArray(product.images) && product.images.length > 0;
      const hasImage = typeof product.image === 'string';
      expect(hasImages || hasImage).toBe(true);
    });
  });
});

describe('Data Transformations', () => {
  const getDisplayPrice = (product: any): string => {
    if (product.priceRange) {
      return product.priceRange;
    }
    if (product.price_tiers && product.price_tiers.length > 0) {
      const firstPrice = product.price_tiers[0].price;
      const lastPrice = product.price_tiers[product.price_tiers.length - 1].price;
      return `$${firstPrice} - $${lastPrice}`;
    }
    return 'Contact for price';
  };

  it('formats price range correctly', () => {
    const productWithTiers = {
      price_tiers: [{ price: 5.99 }, { price: 4.99 }, { price: 3.99 }]
    };
    const result = getDisplayPrice(productWithTiers);
    expect(result).toContain('5.99');
    expect(result).toContain('-');
  });

  it('returns contact text when no price data', () => {
    const productNoPrice = {};
    expect(getDisplayPrice(productNoPrice as any)).toBe('Contact for price');
  });

  it('uses priceRange if available', () => {
    const product = { priceRange: '$5.99 - $8.99' };
    expect(getDisplayPrice(product as any)).toBe('$5.99 - $8.99');
  });

  it('handles single price tier', () => {
    const product = { price_tiers: [{ price: 12.99 }] };
    expect(getDisplayPrice(product)).toBe('$12.99 - $12.99');
  });
});
