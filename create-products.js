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
    options: [
      { name: "Size", values: ["30 Gummies", "60 Gummies"] }
    ],
    variants: [
      { option1: "30 Gummies",  price: "699.00",  sku: "WG-30" },
      { option1: "60 Gummies",  price: "1199.00", sku: "WG-60" },
    ],
  },

  // ── HAIR GUMMIES ──
  {
    title: "Hair Gummies – Biotin & Collagen",
    body_html:
      "<p>Infused with Biotin, Collagen, Zinc, and Vitamin E to nourish hair from within. Promotes stronger, thicker, and shinier hair with regular use.</p>",
    vendor: "NutriStack",
    product_type: "Gummies",
    tags: "hair gummies, biotin, collagen, hair growth, hair health, skin",
    options: [
      { name: "Size", values: ["30 Gummies", "60 Gummies"] }
    ],
    variants: [
      { option1: "30 Gummies",  price: "799.00",  sku: "HG-30" },
      { option1: "60 Gummies",  price: "1399.00", sku: "HG-60" },
    ],
  },

  // ── SLEEP GUMMIES ──
  {
    title: "Sleep Gummies – Melatonin & Ashwagandha",
    body_html:
      "<p>Wind down naturally with our Sleep Gummies formulated with Melatonin, Ashwagandha, and L-Theanine. Promotes deep, restorative sleep without grogginess.</p>",
    vendor: "NutriStack",
    product_type: "Gummies",
    tags: "sleep gummies, melatonin, ashwagandha, sleep aid, relaxation, stress relief",
    options: [
      { name: "Size", values: ["30 Gummies", "60 Gummies"] }
    ],
    variants: [
      { option1: "30 Gummies",  price: "849.00",  sku: "SG-30" },
      { option1: "60 Gummies",  price: "1499.00", sku: "SG-60" },
    ],
  },

  // ── ACV GUMMIES ──
  {
    title: "ACV Gummies – Apple Cider Vinegar",
    body_html:
      "<p>Get all the benefits of Apple Cider Vinegar without the harsh taste. Supports gut health, digestion, metabolism, and healthy weight management.</p>",
    vendor: "NutriStack",
    product_type: "Gummies",
    tags: "ACV gummies, apple cider vinegar, digestion, gut health, weight management, metabolism",
    options: [
      { name: "Size", values: ["30 Gummies", "60 Gummies"] }
    ],
    variants: [
      { option1: "30 Gummies",  price: "749.00",  sku: "ACV-30" },
      { option1: "60 Gummies",  price: "1299.00", sku: "ACV-60" },
    ],
  },

  // ── IMMUNITY SUPPLEMENTS ──
  {
    title: "Immunity Booster – Vitamin C, D3 & Zinc",
    body_html:
      "<p>A powerful triple-action immunity formula combining Vitamin C 1000mg, Vitamin D3, and Zinc. Strengthens your immune system and keeps seasonal illnesses at bay.</p>",
    vendor: "NutriStack",
    product_type: "Immunity Supplements",
    tags: "immunity, vitamin c, vitamin d3, zinc, immune booster, supplements, health",
    options: [
      { name: "Size", values: ["60 Capsules", "120 Capsules"] }
    ],
    variants: [
      { option1: "60 Capsules",  price: "699.00",  sku: "IMM-60" },
      { option1: "120 Capsules", price: "1199.00", sku: "IMM-120" },
    ],
  },

  // ── SPORTS NUTRITION – WHEY PROTEIN ──
  {
    title: "Whey Protein – Chocolate Fudge",
    body_html:
      "<p>Premium isolate-based Whey Protein with 27g of protein per serving. Fast-absorbing formula for muscle recovery, lean muscle building, and post-workout replenishment.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "whey protein, sports nutrition, muscle building, protein shake, post workout, gym",
    options: [
      { name: "Size/Flavor", values: ["1kg – Chocolate", "2kg – Chocolate", "1kg – Vanilla"] }
    ],
    variants: [
      { option1: "1kg – Chocolate",  price: "1999.00", sku: "WP-1KG-CHOC" },
      { option1: "2kg – Chocolate",  price: "3499.00", sku: "WP-2KG-CHOC" },
      { option1: "1kg – Vanilla",    price: "1999.00", sku: "WP-1KG-VAN" },
    ],
  },

  // ── SPORTS NUTRITION – CREATINE ──
  {
    title: "Creatine Monohydrate – Unflavoured",
    body_html:
      "<p>100% pure Creatine Monohydrate – the most researched sports supplement for increasing strength, power output, and lean muscle mass. Mixes easily with any drink.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "creatine, creatine monohydrate, sports nutrition, strength, power, muscle, gym",
    options: [
      { name: "Size", values: ["250g", "500g"] }
    ],
    variants: [
      { option1: "250g",  price: "599.00",  sku: "CR-250G" },
      { option1: "500g",  price: "999.00",  sku: "CR-500G" },
    ],
  },

  // ── SPORTS NUTRITION – PRE-WORKOUT ──
  {
    title: "Pre-Workout Ignite – Berry Blast",
    body_html:
      "<p>High-stimulant pre-workout formula with Caffeine 200mg, Beta-Alanine, Citrulline Malate, and B-Vitamins for explosive energy, laser focus, and incredible pumps.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "pre-workout, energy, focus, caffeine, pump, sports nutrition, gym, workout",
    options: [
      { name: "Flavor", values: ["200g – Berry Blast", "200g – Green Apple"] }
    ],
    variants: [
      { option1: "200g – Berry Blast",   price: "1299.00", sku: "PW-200G-BERRY" },
      { option1: "200g – Green Apple",   price: "1299.00", sku: "PW-200G-APPLE" },
    ],
  },

  // ── SPORTS NUTRITION – MASS GAINER ──
  {
    title: "Mass Gainer Pro – Double Chocolate",
    body_html:
      "<p>A high-calorie mass gainer with 1250 kcal, 50g protein, 248g complex carbs, and added digestive enzymes per serving. Engineered for hardgainers who need serious caloric surplus to grow.</p>",
    vendor: "NutriStack",
    product_type: "Sports Nutrition",
    tags: "mass gainer, weight gain, bulk, calories, protein, carbs, sports nutrition, gym",
    options: [
      { name: "Size", values: ["3kg – Chocolate", "5kg – Chocolate"] }
    ],
    variants: [
      { option1: "3kg – Chocolate",  price: "2499.00", sku: "MG-3KG-CHOC" },
      { option1: "5kg – Chocolate",  price: "3999.00", sku: "MG-5KG-CHOC" },
    ],
  },

  // ── SPORTS NUTRITION – MULTIVITAMIN FOR ATHLETES ──
  {
    title: "Athlete Multivitamin – 30 Tablets",
    body_html:
      "<p>A comprehensive once-daily multivitamin tailored for active individuals and athletes. Contains 25+ vitamins and minerals including B-complex, Iron, Magnesium, Calcium, and Omega-3 support.</p>",
    vendor: "NutriStack",
    product_type: "Multivitamins",
    tags: "multivitamin, athlete, vitamins, minerals, b-complex, omega, sports nutrition, daily health",
    options: [
      { name: "Size", values: ["30 Tablets", "90 Tablets"] }
    ],
    variants: [
      { option1: "30 Tablets",  price: "499.00", sku: "MV-30T" },
      { option1: "90 Tablets",  price: "1299.00", sku: "MV-90T" },
    ],
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
