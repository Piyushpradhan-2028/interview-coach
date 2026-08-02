const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Interview Coach Backend is running",
  });
});

// Claude API
app.post("/api/claude", async (req, res) => {
  try {
    const { system, userText, maxTokens = 1024 } = req.body;

    if (!userText) {
      return res.status(400).json({
        success: false,
        message: "userText is required",
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "ANTHROPIC_API_KEY is missing in .env",
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system: system || "",
        messages: [
          {
            role: "user",
            content: userText,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Claude API Error:", data);

      return res.status(response.status).json({
        success: false,
        message: data?.error?.message || "Claude API request failed",
      });
    }

    const text = (data.content || [])
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    res.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error("Server Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});