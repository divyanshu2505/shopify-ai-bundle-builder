// ============================================================
// AI Bundle Builder - Main JS
// ============================================================

class AIBundleBuilder {
  constructor() {
    this.section = document.getElementById('ai-bundle-section');
    if (!this.section) return;

    this.productTitle = this.section.dataset.productTitle;
    this.productType  = this.section.dataset.productType;
    this.productTags  = this.section.dataset.productTags;
    this.productDesc  = this.section.dataset.productDescription;
    this.maxRecs      = parseInt(this.section.dataset.maxRecs) || 4;
    this.selectedItems = new Set(); // tracks checkboxes

    this.init();
  }

  async init() {
    try {
      // 1. Get AI recommendations (names + reason)
      const { recommendations, reason } = await this.getAIRecommendations();

      // 2. Match against real Shopify products
      const products = await this.matchShopifyProducts(recommendations);

      // 3. Render
      if (products.length > 0) {
        this.renderProducts(products, reason);
      } else {
        this.renderFallback();
      }
    } catch (err) {
      console.error('AI Bundle Error:', err);
      this.renderFallback();
    }
  }

  // ----- AI CALL -----
  async getAIRecommendations() {

  const response = await fetch('https://shopify-ai-bundle-builder.onrender.com/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      productTitle: this.productTitle,
      productType:  this.productType,
      productTags:  this.productTags,
      maxRecs:      this.maxRecs
    })
  });

  if (!response.ok) {
    throw new Error('AI proxy failed');
  }

  return await response.json();
}

  // ----- SHOPIFY PRODUCT SEARCH -----
  async matchShopifyProducts(names) {
    const results = [];
    for (const name of names) {
      try {
        const res = await fetch(`/search/suggest.json?q=${encodeURIComponent(name)}&resources[type]=product&resources[limit]=1`);
        const data = await res.json();
        const product = data.resources?.results?.products?.[0];
        if (product) results.push(product);
      } catch(e) { /* skip this product */ }
    }
    return results;
  }

  // ----- RENDER PRODUCTS -----
  renderProducts(products, reason) {
    document.getElementById('bundle-skeleton').style.display = 'none';

    const container = document.getElementById('bundle-products');
    container.innerHTML = products.map(p => `
      <div class="bundle-card">
        <label class="bundle-check">
          <input type="checkbox" value="${p.id}" data-variant="${p.variants?.[0]?.id}" checked>
        </label>
        <img src="${p.featured_image || p.image || ''}" alt="${p.title}" loading="lazy">
        <h3>${p.title}</h3>
        <p class="price">${this.formatPrice(p.price)}</p>
        <button class="btn btn-add-single" data-variant="${p.variants?.[0]?.id}">Add to Cart</button>
      </div>
    `).join('');

    document.getElementById('ai-explanation').textContent = reason;
    container.style.display = 'flex';
    document.getElementById('add-bundle-btn').style.display = 'block';

    this.bindEvents();
  }

  // ----- ADD TO CART (AJAX) -----
  async addToCart(variantIds) {
    const items = variantIds.map(id => ({ id, quantity: 1 }));
    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (!res.ok) throw new Error('Cart API failed');
    return res.json();
  }

  bindEvents() {
    // Single add
    document.querySelectorAll('.btn-add-single').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const vid = e.target.dataset.variant;
        await this.addToCart([vid]);
        e.target.textContent = '✓ Added!';
      });
    });

    // Bundle add
    document.getElementById('add-bundle-btn').addEventListener('click', async () => {
      const checked = [...document.querySelectorAll('.bundle-card input:checked')];
      const variantIds = checked.map(c => c.dataset.variant);
      await this.addToCart(variantIds);
      document.getElementById('add-bundle-btn').textContent = '✓ Bundle Added!';
    });
  }

  // ----- FALLBACK -----
  async renderFallback() {
    document.getElementById('bundle-skeleton').style.display = 'none';
    const container = document.getElementById('bundle-products');
    const collHandle = this.section.dataset.fallbackCollection;

    if (collHandle) {
      const res = await fetch(`/collections/${collHandle}/products.json?limit=4`);
      const data = await res.json();
      this.renderProducts(data.products, 'You might also like these popular products:');
    } else {
      container.innerHTML = '<p class="bundle-empty">No recommendations available right now.</p>';
      container.style.display = 'block';
    }
    document.getElementById('bundle-skeleton').style.display = 'none';
  }

  formatPrice(price) {
    if (typeof price === 'string') return price;
    return `₹${(price / 100).toFixed(2)}`;
}
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => new AIBundleBuilder());