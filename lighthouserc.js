module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
      settings: {
        throttlingMethod: 'devtools',
        throttling: {
          requestSlowdown: 4,
          minPageLoadTime: 1000,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'performance:first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'performance:largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'performance:cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'performance:total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'accessibility:color-contrast': ['error', { minScore: 0.9 }],
        'accessibility:no-missing-image-alt': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
