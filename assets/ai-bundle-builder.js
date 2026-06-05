// ==========================================================================
// AI Bundle Builder - Advanced ES6+ Frontend Logic
// ==========================================================================

class AIBundleBuilder {
  constructor() {
    this.section = document.getElementById('ai-bundle-section');
    if (!this.section) return;

    // Read Shopify liquid-injected metadata
    this.currentProductId  = this.section.dataset.productId;
    this.productTitle      = this.section.dataset.productTitle;
    this.productType       = this.section.dataset.productType;
    this.productTags       = this.section.dataset.productTags;
    this.productColl       = this.section.dataset.productCollections;
    this.productDesc       = this.section.dataset.productDescription;
    this.maxRecs           = parseInt(this.section.dataset.maxRecs) || 4;
    this.fallbackColl      = this.section.dataset.fallbackCollection;

    // Discount configuration
    this.discountCode       = this.section.dataset.discountCode || 'BUNDLE10';
    this.discountPercentage = parseInt(this.section.dataset.discountPercentage) || 10;
    this.enableGoals        = this.section.dataset.enableGoals === 'true';
    this.showAnalytics      = this.section.dataset.showAnalytics === 'true';

    // Main product data
    this.mainProduct = {
      variantId: this.section.dataset.mainVariantId,
      title: this.section.dataset.mainProductTitle,
      price: parseInt(this.section.dataset.mainProductPrice),
      image: this.section.dataset.mainProductImage
    };

    // State
    this.recommendedProducts = []; // loaded full product JSONs

    this.init();
  }

  async init() {
    // Increment page views for analytics
    this.trackAnalytics('view');

    try {
      // 1. Fetch recommendations from OpenRouter backend
      const { recommendations, reason, goal } = await this.getAIRecommendations();

      // 2. Fetch full Shopify product data for matches
      this.recommendedProducts = await this.matchShopifyProducts(recommendations);

      // 3. Render
      if (this.recommendedProducts.length > 0) {
        this.renderGoalBadge(goal);
        this.renderProducts(this.recommendedProducts, reason);
      } else {
        await this.renderFallback();
      }
    } catch (err) {
      console.error('AI Bundle Builder Error:', err);
      await this.renderFallback();
    }

    if (this.showAnalytics) {
      this.renderAnalyticsDashboard();
    }
  }

  // ----- FETCH RECS FROM PROXY -----
  async getAIRecommendations() {
    const apiEndpoint = 'https://shopify-ai-bundle-builder.onrender.com/ai-proxy';
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productTitle: this.productTitle,
        productType:  this.productType,
        productTags:  this.productTags,
        productCollections: this.productColl,
        productDescription: this.productDesc,
        maxRecs:      this.maxRecs
      })
    });

    if (!response.ok) {
      throw new Error('Backend proxy returned error');
    }

    return await response.json();
  }

  // ----- SEARCH & FETCH PRODUCT DETAILS -----
  async matchShopifyProducts(recommendationNames) {
    const matched = [];
    const limit = this.maxRecs;

    for (const name of recommendationNames) {
      if (matched.length >= limit) break;
      try {
        // Query predictive search API
        const suggestUrl = `/search/suggest.json?q=${encodeURIComponent(name)}&resources[type]=product&resources[limit]=1`;
        const suggestRes = await fetch(suggestUrl);
        const suggestData = await suggestRes.json();
        const suggested = suggestData.resources?.results?.products?.[0];

        if (suggested && suggested.handle) {
          // Fetch full product details
          const detailRes = await fetch(`/products/${suggested.handle}.js`);
          const fullProduct = await detailRes.json();

          // Validation checks:
          // 1. Exclude the current product itself
          // 2. Must be available in stock
          // 3. Must not already be added to matches
          const isSelf = String(fullProduct.id) === String(this.currentProductId);
          const isAlreadyMatched = matched.some(p => p.id === fullProduct.id);

          if (!isSelf && fullProduct.available && !isAlreadyMatched) {
            matched.push(fullProduct);
          }
        }
      } catch (e) {
        console.warn(`Could not match product: "${name}"`, e);
      }
    }
    return matched;
  }

  // ----- RENDER GOAL BADGE -----
  renderGoalBadge(goal) {
    if (!this.enableGoals || !goal) return;

    const badge = document.getElementById('ai-goal-badge');
    const badgeWrapper = document.getElementById('ai-goal-badge-wrapper');
    if (!badge || !badgeWrapper) return;

    // Reset classes
    badge.className = 'ai-goal-badge';
    
    // Normalize and pick class
    const gLower = goal.toLowerCase();
    let goalClass = 'goal-default';

    if (gLower.includes('muscle') || gLower.includes('growth') || gLower.includes('strength')) {
      goalClass = 'goal-muscle';
    } else if (gLower.includes('weight') || gLower.includes('gain') || gLower.includes('bulk')) {
      goalClass = 'goal-weight';
    } else if (gLower.includes('energy') || gLower.includes('focus') || gLower.includes('workout')) {
      goalClass = 'goal-energy';
    } else if (gLower.includes('sleep') || gLower.includes('relax') || gLower.includes('calm')) {
      goalClass = 'goal-sleep';
    } else if (gLower.includes('immun') || gLower.includes('protect') || gLower.includes('shield')) {
      goalClass = 'goal-immunity';
    } else if (gLower.includes('hair') || gLower.includes('skin') || gLower.includes('nail')) {
      goalClass = 'goal-hair';
    } else if (gLower.includes('well') || gLower.includes('vit') || gLower.includes('health')) {
      goalClass = 'goal-wellness';
    }

    badge.classList.add(goalClass);
    badge.textContent = goal;
    badgeWrapper.style.display = 'block';
  }

  // ----- RENDER PRODUCTS -----
  renderProducts(products, reason) {
    // Hide skeleton loader
    const skeleton = document.getElementById('bundle-skeleton');
    if (skeleton) skeleton.style.display = 'none';

    // Render cards
    const container = document.getElementById('bundle-products');
    if (!container) return;

    container.innerHTML = products.map((p, idx) => {
      const defaultVariant = p.variants.find(v => v.available) || p.variants[0];
      const hasMultipleVariants = p.variants.length > 1;

      // Render variant options dropdown if multiple
      let variantSelectHtml = '';
      if (hasMultipleVariants) {
        variantSelectHtml = `
          <div class="bundle-variant-wrapper">
            <select class="bundle-variant-select" data-product-idx="${idx}">
              ${p.variants.map(v => `
                <option value="${v.id}" data-price="${v.price}" ${v.id === defaultVariant.id ? 'selected' : ''} ${!v.available ? 'disabled' : ''}>
                  ${v.title} - ${this.formatPrice(v.price)} ${v.available ? '' : '(Out of Stock)'}
                </option>
              `).join('')}
            </select>
          </div>
        `;
      }

      return `
        <div class="bundle-card" id="card-${idx}">
          <label class="bundle-check">
            <input type="checkbox" class="bundle-checkbox" data-product-idx="${idx}" data-variant-id="${defaultVariant.id}" checked>
          </label>
          <div class="bundle-card-img-wrapper">
            <img src="${p.featured_image || p.image || ''}" alt="${p.title}" loading="lazy">
          </div>
          <h3>${p.title}</h3>
          <p class="price" id="price-display-${idx}">${this.formatPrice(defaultVariant.price)}</p>
          ${variantSelectHtml}
          <button class="btn btn-add-single" data-product-idx="${idx}">Add to Cart</button>
        </div>
      `;
    }).join('');

    container.style.display = 'grid';

    // Update AI Explanation
    const explanation = document.getElementById('ai-explanation');
    if (explanation) explanation.textContent = reason;

    // Show sidebar
    const sidebar = document.getElementById('bundle-sidebar');
    if (sidebar) sidebar.style.display = 'block';

    // Setup events and initial bundle pricing
    this.bindEvents();
    this.updateBundleSummary();
  }

  // ----- FALLBACK SYSTEM -----
  async renderFallback() {
    const skeleton = document.getElementById('bundle-skeleton');
    if (skeleton) skeleton.style.display = 'none';

    if (!this.fallbackColl) {
      const container = document.getElementById('bundle-products');
      if (container) {
        container.innerHTML = '<p class="bundle-empty">No recommended products are currently available.</p>';
        container.style.display = 'block';
      }
      return;
    }

    try {
      // Fetch fallback products
      const res = await fetch(`/collections/${this.fallbackColl}/products.json?limit=6`);
      const data = await res.json();
      
      const fallbackMatches = [];
      for (const p of data.products) {
        const isSelf = String(p.id) === String(this.currentProductId);
        if (!isSelf) {
          // Fetch full details
          const detailRes = await fetch(`/products/${p.handle}.js`);
          const fullProduct = await detailRes.json();
          if (fullProduct.available) {
            fallbackMatches.push(fullProduct);
          }
        }
      }

      this.recommendedProducts = fallbackMatches.slice(0, this.maxRecs);

      if (this.recommendedProducts.length > 0) {
        this.renderGoalBadge("Selected For You");
        this.renderProducts(this.recommendedProducts, "We selected these popular nutrition products that complement your health stack.");
      } else {
        const container = document.getElementById('bundle-products');
        if (container) {
          container.innerHTML = '<p class="bundle-empty">No recommended products are currently available.</p>';
          container.style.display = 'block';
        }
      }
    } catch(err) {
      console.error('Fallback load error:', err);
      const container = document.getElementById('bundle-products');
      if (container) {
        container.innerHTML = '<p class="bundle-empty">No recommended products are currently available.</p>';
        container.style.display = 'block';
      }
    }
  }

  // ----- BIND INTERACTIVE ACTIONS -----
  bindEvents() {
    // 1. Checkbox click
    this.section.querySelectorAll('.bundle-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const idx = e.target.dataset.productIdx;
        const card = document.getElementById(`card-${idx}`);
        if (e.target.checked) {
          card.classList.remove('card-disabled');
        } else {
          card.classList.add('card-disabled');
        }
        this.updateBundleSummary();
      });
    });

    // 2. Variant select change
    this.section.querySelectorAll('.bundle-variant-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const idx = e.target.dataset.productIdx;
        const selectedOpt = e.target.options[e.target.selectedIndex];
        const newPrice = parseInt(selectedOpt.dataset.price);
        const newVariantId = e.target.value;

        // Update the checkbox data-variant-id
        const checkbox = this.section.querySelector(`.bundle-checkbox[data-product-idx="${idx}"]`);
        if (checkbox) checkbox.dataset.variantId = newVariantId;

        // Update card price display
        const priceDisplay = document.getElementById(`price-display-${idx}`);
        if (priceDisplay) priceDisplay.textContent = this.formatPrice(newPrice);

        this.updateBundleSummary();
      });
    });

    // 3. Add Single Item Button
    this.section.querySelectorAll('.btn-add-single').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const idx = e.target.dataset.productIdx;
        const checkbox = this.section.querySelector(`.bundle-checkbox[data-product-idx="${idx}"]`);
        const variantId = checkbox.dataset.variantId;

        this.trackAnalytics('click');

        e.target.textContent = 'Adding...';
        e.target.setAttribute('disabled', 'disabled');

        try {
          await this.addToCart([variantId]);
          e.target.textContent = '✓ Added!';
          e.target.classList.add('btn-added');
        } catch (err) {
          console.error(err);
          e.target.textContent = 'Error!';
          setTimeout(() => {
            e.target.textContent = 'Add to Cart';
            e.target.removeAttribute('disabled');
          }, 2000);
        }
      });
    });

    // 4. Add Stack Button
    const addBundleBtn = document.getElementById('add-bundle-btn');
    if (addBundleBtn) {
      addBundleBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Collect checked variant IDs
        const checkedBoxes = [...this.section.querySelectorAll('.bundle-checkbox:checked')];
        const variantIds = checkedBoxes.map(chk => chk.dataset.variantId);

        // Include Main Product Variant ID
        // Try to read current selected variant of main product dynamically from main form
        let mainVariantId = this.mainProduct.variantId;
        const mainFormIdInput = document.querySelector('form[action*="/cart/add"] [name="id"]');
        if (mainFormIdInput && mainFormIdInput.value) {
          mainVariantId = mainFormIdInput.value;
        }

        variantIds.unshift(mainVariantId); // prepend main product

        this.trackAnalytics('add');

        addBundleBtn.textContent = 'Adding Stack...';
        addBundleBtn.setAttribute('disabled', 'disabled');

        try {
          // Silently set discount code
          if (this.discountCode) {
            await fetch(`/discount/${encodeURIComponent(this.discountCode)}`);
          }

          // Add items to AJAX cart
          await this.addToCart(variantIds);

          addBundleBtn.textContent = '✓ Stack Added!';
          addBundleBtn.classList.add('btn-success');
        } catch (err) {
          console.error(err);
          addBundleBtn.textContent = 'Error adding!';
          setTimeout(() => {
            addBundleBtn.textContent = 'Add Stack to Cart';
            addBundleBtn.removeAttribute('disabled');
          }, 3000);
        }
      });
    }
  }

  // ----- UPDATE BUNDLE PRICING AND SUMMARY -----
  updateBundleSummary() {
    const listContainer = document.getElementById('checkout-items-list');
    if (!listContainer) return;

    // Get current main product variant details
    let mainPrice = this.mainProduct.price;
    let mainTitle = this.mainProduct.title;
    
    // Look up main variant selection dynamically
    const mainFormIdInput = document.querySelector('form[action*="/cart/add"] [name="id"]');
    if (mainFormIdInput && mainFormIdInput.value) {
      const selectedId = mainFormIdInput.value;
      // If Dawn has global variant information, we could grab pricing, otherwise fall back to liquid base
      // Let's also look for a main product price element if it changes on selection
      const mainPriceEl = document.querySelector('.price .price-item--sale, .price .price-item--regular');
      if (mainPriceEl) {
        // Strip non-numerical chars
        const text = mainPriceEl.textContent.replace(/[^\d]/g, '');
        if (text) mainPrice = parseInt(text);
      }
    }

    let itemsHtml = `
      <div class="checkout-item-row">
        <span class="checkout-item-dot"></span>
        <span class="checkout-item-title">${mainTitle} (This Product)</span>
        <span class="checkout-item-price">${this.formatPrice(mainPrice)}</span>
      </div>
    `;

    let subtotal = mainPrice;
    let checkedCount = 0;

    // Add recommended checked items
    this.recommendedProducts.forEach((p, idx) => {
      const checkbox = this.section.querySelector(`.bundle-checkbox[data-product-idx="${idx}"]`);
      if (checkbox && checkbox.checked) {
        checkedCount++;
        const variantId = checkbox.dataset.variantId;
        const variant = p.variants.find(v => String(v.id) === String(variantId)) || p.variants[0];
        
        itemsHtml += `
          <div class="checkout-item-row">
            <span class="checkout-item-dot"></span>
            <span class="checkout-item-title">${p.title} - ${variant.title}</span>
            <span class="checkout-item-price">${this.formatPrice(variant.price)}</span>
          </div>
        `;
        subtotal += variant.price;
      }
    });

    listContainer.innerHTML = itemsHtml;

    // Calculate Discounts
    const originalPriceEl = document.getElementById('original-total-price');
    const discountRow = document.getElementById('discount-row');
    const discountAmtEl = document.getElementById('discount-amount');
    const discountPctEl = document.getElementById('discount-percent-label');
    const finalPriceEl = document.getElementById('final-total-price');
    const discountNote = document.getElementById('discount-applied-note');

    if (originalPriceEl) originalPriceEl.textContent = this.formatPrice(subtotal);

    // Apply discount only if bundle has at least 1 recommended item checked
    if (checkedCount > 0 && this.discountPercentage > 0) {
      const discountAmt = Math.round(subtotal * (this.discountPercentage / 100));
      const finalTotal = subtotal - discountAmt;

      if (discountRow) discountRow.style.display = 'flex';
      if (discountAmtEl) discountAmtEl.textContent = `-${this.formatPrice(discountAmt)}`;
      if (discountPctEl) discountPctEl.textContent = this.discountPercentage;
      if (finalPriceEl) finalPriceEl.textContent = this.formatPrice(finalTotal);
      if (discountNote) {
        const codeNote = document.getElementById('discount-code-note');
        if (codeNote) codeNote.textContent = this.discountCode;
        discountNote.style.display = 'block';
      }
    } else {
      if (discountRow) discountRow.style.display = 'none';
      if (finalPriceEl) finalPriceEl.textContent = this.formatPrice(subtotal);
      if (discountNote) discountNote.style.display = 'none';
    }

    // Disable CTA if no items selected (only main product left)
    const addBundleBtn = document.getElementById('add-bundle-btn');
    if (addBundleBtn) {
      if (checkedCount === 0) {
        addBundleBtn.textContent = 'Select items to build stack';
        addBundleBtn.setAttribute('disabled', 'disabled');
      } else {
        addBundleBtn.textContent = 'Add Stack to Cart';
        addBundleBtn.removeAttribute('disabled');
      }
    }
  }

  // ----- ADD TO CART AJAX CORE -----
  async addToCart(variantIds) {
    const items = variantIds.map(id => ({ id: parseInt(id), quantity: 1 }));
    
    // Grab Dawn's cart elements
    const cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    const payload = { items };

    if (cart) {
      payload.sections = cart.getSectionsToRender().map((section) => section.id);
      payload.sections_url = window.location.pathname;
      cart.setActiveElement(document.activeElement);
    }

    const res = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error('Cart API request failed');
    }

    const data = await res.json();

    // Trigger theme updates via standard Dawn pubsub pub/sub triggers
    if (window.publish && window.PUB_SUB_EVENTS) {
      window.publish(window.PUB_SUB_EVENTS.cartUpdate, {
        source: 'ai-bundle-builder',
        cartData: data
      });
    }

    // Render drawer content to user
    if (cart) {
      cart.renderContents(data);
    } else {
      // Fallback redirect to cart page
      window.location.href = '/cart';
    }

    return data;
  }

  // ----- UTILS: CURRENCY FORMATTING -----
  formatPrice(priceCents) {
    const currencyCode = window.Shopify?.currency?.active || 'INR';
    const priceNum = (priceCents / 100).toFixed(2);
    
    // Symbol mapping
    const symbols = {
      INR: '₹', USD: '$', EUR: '€', GBP: '£', CAD: '$', AUD: '$', JPY: '¥'
    };
    const symbol = symbols[currencyCode] || '';

    // Indian style pricing comma separation if INR
    if (currencyCode === 'INR') {
      const parts = priceNum.split('.');
      let x = parts[0];
      const y = parts[1] ? '.' + parts[1] : '';
      const rgx = /(\d+)(\d{3})/;
      while (rgx.test(x)) {
        x = x.replace(rgx, '$1' + ',' + '$2');
      }
      return symbol + x + y;
    }

    return `${symbol}${priceNum}`;
  }

  // ----- ANALYTICS TRACKING -----
  trackAnalytics(type) {
    if (!this.showAnalytics) return;

    try {
      const storeKey = 'ai_bundle_analytics';
      let data = JSON.parse(localStorage.getItem(storeKey)) || {
        views: 0,
        clicks: 0,
        adds: 0
      };

      if (type === 'view') {
        data.views++;
      } else if (type === 'click') {
        data.clicks++;
      } else if (type === 'add') {
        data.adds++;
      }

      localStorage.setItem(storeKey, JSON.stringify(data));
      this.renderAnalyticsDashboard();
    } catch(e) {
      console.warn('Analytics storage failed:', e);
    }
  }

  renderAnalyticsDashboard() {
    const dashboard = document.getElementById('ai-analytics-dashboard');
    if (!dashboard) return;

    try {
      const storeKey = 'ai_bundle_analytics';
      const data = JSON.parse(localStorage.getItem(storeKey)) || {
        views: 0,
        clicks: 0,
        adds: 0
      };

      const viewsEl = document.getElementById('metric-views');
      const clicksEl = document.getElementById('metric-clicks');
      const addsEl = document.getElementById('metric-adds');
      const convEl = document.getElementById('metric-conversion');

      if (viewsEl) viewsEl.textContent = data.views;
      if (clicksEl) clicksEl.textContent = data.clicks;
      if (addsEl) addsEl.textContent = data.adds;
      
      if (convEl) {
        const cr = data.views > 0 ? ((data.adds / data.views) * 100).toFixed(1) : '0.0';
        convEl.textContent = `${cr}%`;
      }

      dashboard.style.display = 'block';
    } catch(e) {}
  }
}

// Initialise on load
document.addEventListener('DOMContentLoaded', () => {
  new AIBundleBuilder();
});