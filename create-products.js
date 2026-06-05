/**
 * create-products.js
 * Creates all missing product categories in the Shopify store.
 * Run: node create-products.js
 */

require("dotenv").config();
const https = require("https");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const STORE   = "x0c0jv-1b.myshopify.com";
const TOKEN   = process.env.SHOPIFY_ADMIN_TOKEN; // set in .env

// ─── PRODUCT DEFINITIONS ─────────────────────────────────────────────────────
const products = [
  // ── WELLNESS GUMMIES ──
  {
    title: "Wellness Gummies – Daily Multivitamin",
    body_html:
      "<p>A daily dose of essential vitamins and minerals packed into delicious fruit-flavoured gummies. Supports overall health, immunity, and energy levels.</p>",
    vendor: "NutriStack",
    product_type: "Gummies",
    tags: "wellness, gummies, multivitamin, daily health, immunity, vitamins",
    variants: [
      { title: "30 Gummies",  price: "699.00",  sku: "WG-30",  inventory_quantity: 100, inventory_management: "shopify" },
      { title: "60 Gummies",  price: "1199.00", sku: "WG-60",  inventory_quantity: 100, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600" }],
  },

  // ── HAIR GUMMIES ──
  {
    title: "Hair Gummies – Biotin & Collagen",
    body_html:
      "<p>Infused with Biotin, Collagen, Zinc, and Vitamin E to nourish hair from within. Promotes stronger, thicker, and shinier hair with regular use.</p>",
    vendor: "NutriStack",
    product_type: "Gummies",
    tags: "hair gummies, biotin, collagen, hair growth, hair health, skin",
    variants: [
      { title: "30 Gummies",  price: "799.00",  sku: "HG-30",  inventory_quantity: 100, inventory_management: "shopify" },
      { title: "60 Gummies",  price: "1399.00", sku: "HG-60",  inventory_quantity: 100, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600" }],
  },

  // ── SLEEP GUMMIES ──
  {
    title: "Sleep Gummies – Melatonin & Ashwagandha",
    body_html:
      "<p>Wind down naturally with our Sleep Gummies formulated with Melatonin, Ashwagandha, and L-Theanine. Promotes deep, restorative sleep without grogginess.</p>",
    vendor: "NutriStack",
    product_type: "Gummies",
    tags: "sleep gummies, melatonin, ashwagandha, sleep aid, relaxation, stress relief",
    variants: [
      { title: "30 Gummies",  price: "849.00",  sku: "SG-30",  inventory_quantity: 100, inventory_management: "shopify" },
      { title: "60 Gummies",  price: "1499.00", sku: "SG-60",  inventory_quantity: 100, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600" }],
  },

  // ── ACV GUMMIES ──
  {
    title: "ACV Gummies – Apple Cider Vinegar",
    body_html:
      "<p>Get all the benefits of Apple Cider Vinegar without the harsh taste. Supports gut health, digestion, metabolism, and healthy weight management.</p>",
    vendor: "NutriStack",
    product_type: "Gummies",
    tags: "ACV gummies, apple cider vinegar, digestion, gut health, weight management, metabolism",
    variants: [
      { title: "30 Gummies",  price: "749.00",  sku: "ACV-30", inventory_quantity: 100, inventory_management: "shopify" },
      { title: "60 Gummies",  price: "1299.00", sku: "ACV-60", inventory_quantity: 100, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600" }],
  },

  // ── IMMUNITY SUPPLEMENTS ──
  {
    title: "Immunity Booster – Vitamin C, D3 & Zinc",
    body_html:
      "<p>A powerful triple-action immunity formula combining Vitamin C 1000mg, Vitamin D3, and Zinc. Strengthens your immune system and keeps seasonal illnesses at bay.</p>",
    vendor: "NutriStack",
    product_type: "Immunity Supplements",
    tags: "immunity, vitamin c, vitamin d3, zinc, immune booster, supplements, health",
    variants: [
      { title: "60 Capsules",  price: "699.00",  sku: "IMM-60",  inventory_quantity: 150, inventory_management: "shopify" },
      { title: "120 Capsules", price: "1199.00", sku: "IMM-120", inventory_quantity: 150, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600" }],
  },

  // ── SPORTS NUTRITION – WHEY PROTEIN ──
  {
    title: "Whey Protein – Chocolate Fudge",
    body_html:
      "<p>Premium isolate-based Whey Protein with 27g of protein per serving. Fast-absorbing formula for muscle recovery, lean muscle building, and post-workout replenishment.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "whey protein, sports nutrition, muscle building, protein shake, post workout, gym",
    variants: [
      { title: "1kg – Chocolate",  price: "1999.00", sku: "WP-1KG-CHOC",  inventory_quantity: 80, inventory_management: "shopify" },
      { title: "2kg – Chocolate",  price: "3499.00", sku: "WP-2KG-CHOC",  inventory_quantity: 80, inventory_management: "shopify" },
      { title: "1kg – Vanilla",    price: "1999.00", sku: "WP-1KG-VAN",   inventory_quantity: 80, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600" }],
  },

  // ── SPORTS NUTRITION – CREATINE ──
  {
    title: "Creatine Monohydrate – Unflavoured",
    body_html:
      "<p>100% pure Creatine Monohydrate – the most researched sports supplement for increasing strength, power output, and lean muscle mass. Mixes easily with any drink.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "creatine, creatine monohydrate, sports nutrition, strength, power, muscle, gym",
    variants: [
      { title: "250g",  price: "599.00",  sku: "CR-250G",  inventory_quantity: 120, inventory_management: "shopify" },
      { title: "500g",  price: "999.00",  sku: "CR-500G",  inventory_quantity: 120, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600" }],
  },

  // ── SPORTS NUTRITION – PRE-WORKOUT ──
  {
    title: "Pre-Workout Ignite – Berry Blast",
    body_html:
      "<p>High-stimulant pre-workout formula with Caffeine 200mg, Beta-Alanine, Citrulline Malate, and B-Vitamins for explosive energy, laser focus, and incredible pumps.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "pre-workout, energy, focus, caffeine, pump, sports nutrition, gym, workout",
    variants: [
      { title: "200g – Berry Blast",   price: "1299.00", sku: "PW-200G-BERRY",  inventory_quantity: 90, inventory_management: "shopify" },
      { title: "200g – Green Apple",   price: "1299.00", sku: "PW-200G-APPLE",  inventory_quantity: 90, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600" }],
  },

  // ── SPORTS NUTRITION – MASS GAINER ──
  {
    title: "Mass Gainer Pro – Double Chocolate",
    body_html:
      "<p>A high-calorie mass gainer with 1250 kcal, 50g protein, 248g complex carbs, and added digestive enzymes per serving. Engineered for hardgainers who need serious caloric surplus to grow.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "mass gainer, weight gain, bulk, calories, protein, carbs, sports nutrition, gym",
    variants: [
      { title: "3kg – Chocolate",  price: "2499.00", sku: "MG-3KG-CHOC",  inventory_quantity: 60, inventory_management: "shopify" },
      { title: "5kg – Chocolate",  price: "3999.00", sku: "MG-5KG-CHOC",  inventory_quantity: 60, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1619564813854-e7c3c01a65a7?w=600" }],
  },

  // ── SPORTS NUTRITION – MULTIVITAMIN FOR ATHLETES ──
  {
    title: "Athlete Multivitamin – 30 Tablets",
    body_html:
      "<p>A comprehensive once-daily multivitamin tailored for active individuals and athletes. Contains 25+ vitamins and minerals including B-complex, Iron, Magnesium, Calcium, and Omega-3 support.</p>",
    vendor: "NutriStack",
    product_type: "Multivitamins",
    tags: "multivitamin, athlete, vitamins, minerals, b-complex, omega, sports nutrition, daily health",
    variants: [
      { title: "30 Tablets",  price: "499.00", sku: "MV-30T",  inventory_quantity: 200, inventory_management: "shopify" },
      { title: "90 Tablets",  price: "1299.00", sku: "MV-90T",  inventory_quantity: 200, inventory_management: "shopify" },
    ],
    images: [{ src: "https://images.unsplash.com/photo-1550831107-1553da8c8464?w=600" }],
  },
];

// ─── HTTP HELPER ──────────────────────────────────────────────────────────────
function shopifyRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: STORE,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!TOKEN) {
    console.error("❌  SHOPIFY_ADMIN_TOKEN not set in .env");
    process.exit(1);
  }

  console.log(`\n🚀  Creating ${products.length} products on ${STORE}...\n`);

  for (const p of products) {
    try {
      const res = await shopifyRequest("POST", "/admin/api/2024-01/products.json", { product: p });

      if (res.status === 201) {
        const created = res.body.product;
        console.log(`✅  Created: ${created.title}  (ID: ${created.id})`);
      } else if (res.status === 422) {
        // Probably already exists – skip
        const errs = res.body.errors;
        if (JSON.stringify(errs).includes("taken")) {
          console.log(`⚠️   Already exists (skipped): ${p.title}`);
        } else {
          console.error(`❌  Error for "${p.title}":`, JSON.stringify(errs));
        }
      } else {
        console.error(`❌  Unexpected ${res.status} for "${p.title}":`, JSON.stringify(res.body));
      }

      // Respect Shopify rate limit (2 requests/sec)
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`❌  Network error for "${p.title}":`, err.message);
    }
  }

  console.log("\n🎉  Done! All products processed.\n");
}

main();
