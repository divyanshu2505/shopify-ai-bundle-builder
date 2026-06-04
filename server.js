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

app.post("/ai-proxy", async (req, res) => {
  try {
    const { productTitle, productType, productTags, maxRecs } = req.body;

    const prompt = `
You are a sports nutrition expert.

Product:
${productTitle}

Type:
${productType}

Tags:
${productTags}

Suggest ${maxRecs || 4} complementary products.

Return ONLY valid JSON:

{
  "recommendations": [
    "Creatine",
    "Shaker",
    "Multivitamin",
    "Pre Workout"
  ],
  "reason": "short explanation"
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

    res.json(JSON.parse(cleaned));

  } catch (err) {
    console.error(err);

    res.json({
      recommendations: [
        "Creatine",
        "Shaker",
        "Multivitamin",
        "Pre Workout"
      ],
      reason: "Fallback recommendations"
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