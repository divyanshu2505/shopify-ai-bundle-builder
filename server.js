const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// Simple in-memory cache to prevent hitting OpenRouter rate limits
const recsCache = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

app.post("/ai-proxy", async (req, res) => {
  try {
    const { productTitle, productType, productTags, productDescription, productCollections, maxRecs } = req.body;

    const limit = parseInt(maxRecs) || 4;
    const cacheKey = `${(productTitle || '').trim().toLowerCase()}_recs_${limit}`;
    
    // Check cache
    if (recsCache[cacheKey] && (Date.now() - recsCache[cacheKey].timestamp < CACHE_TTL)) {
      console.log(`[Cache Hit] Serving cached recommendations for: ${productTitle}`);
      return res.json(recsCache[cacheKey].data);
    }

    console.log(`[Cache Miss] Querying AI for: ${productTitle}`);
    const prompt = `
You are an expert sports nutrition and health supplement advisor.
A customer is viewing the following product:
Title: ${productTitle}
Type: ${productType}
Tags: ${productTags}
Collections: ${productCollections || ''}
Description: ${productDescription || ''}

Based on this product, suggest exactly ${limit} complementary products from other categories that would build a perfect wellness/fitness bundle.
Choose products from the following categories:
- Mass Gainers
- Whey Protein
- Creatine
- Pre-Workout
- Multivitamins
- Wellness Gummies
- Hair Gummies
- Sleep Gummies
- ACV Gummies
- Immunity Supplements
- Sports Nutrition

In addition:
1. Detect the primary health/fitness goal of the current product (e.g., "Muscle Growth", "Weight Gain", "Energy & Focus", "Sleep & Relaxation", "Immunity", "Hair & Skin Health", "General Wellness").
2. Write a short, highly engaging 1-2 sentence explanation of why this bundle is perfect for the detected goal.

Return ONLY a valid JSON object:
{
  "recommendations": [
    "Product Category or Name 1",
    "Product Category or Name 2",
    "Product Category or Name 3",
    "Product Category or Name 4"
  ],
  "reason": "A 1-2 sentence compelling reason explaining why this bundle works.",
  "goal": "Detected health/fitness goal name"
}
`;

    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;

    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const resultData = JSON.parse(cleaned);

    // Save to cache
    recsCache[cacheKey] = {
      timestamp: Date.now(),
      data: resultData
    };

    res.json(resultData);

  } catch (err) {
    console.error("AI Error:", err);

    res.json({
      recommendations: [
        "Creatine",
        "Whey Protein",
        "Multivitamin",
        "Pre Workout"
      ],
      reason: "Commonly combined for overall performance, strength, and recovery.",
      goal: "Muscle Growth & Performance"
    });
  }
});
app.get("/", (req, res) => {
  res.send("Backend Running");
});

app.get("/test-ai", async (req, res) => {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Say hello"
        }
      ]
    });

    res.send(response.choices[0].message.content);

  } catch (err) {
    res.status(500).send(err.message);
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});