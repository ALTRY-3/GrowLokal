# 🚀 Groq API Setup Guide

## Why Groq?

- **100% FREE** with generous limits (14,400 requests/day!)
- **Lightning fast** responses (faster than OpenAI)
- **No credit card required**
- Uses powerful models like Llama 3.3 70B

## Setup Steps:

### 1. Get Your Free Groq API Key

1. Go to: **https://console.groq.com/**
2. Sign up with Google or email (takes 30 seconds)
3. Click **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Give it a name (e.g., "GrowLokal Chatbot")
6. Copy the API key (starts with `gsk_...`)

### 2. Add API Key to Your Project

Open `.env.local` and replace:

```env
GROQ_API_KEY=your-groq-api-key-here
```

With your actual key:

```env
GROQ_API_KEY=gsk_your_actual_key_here
```

### 3. Restart Your Dev Server

Stop the current server (Ctrl+C) and restart:

```bash
npm run dev
```

### 4. Test Your Chatbot!

Open your app and click the chatbot button. Try saying:

- "Hi!"
- "Show me handicrafts"
- "Track my orders"

## Available Models on Groq:

We're using **`llama-3.3-70b-versatile`** (recommended), but you can also try:

- `llama-3.1-70b-versatile` - Very smart, great for complex tasks
- `mixtral-8x7b-32768` - Good balance of speed and quality
- `gemma2-9b-it` - Lighter, faster for simple tasks

To change models, edit `src/app/api/chatbot/route.ts` line 10:

```typescript
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Change this
```

## Rate Limits (FREE Tier):

- **14,400 requests per day**
- **30 requests per minute**
- Perfect for development and small-medium apps!

## Troubleshooting:

**"API key not found"**: Make sure you added it to `.env.local` and restarted the server

**"Rate limit exceeded"**: You hit the 30 req/min limit, wait 60 seconds

**"Model not found"**: Check the model name spelling in route.ts

## Alternative APIs (if you need them):

### OpenAI ChatGPT (Paid, $0.002/1K tokens)

- Most popular, excellent quality
- Get key: https://platform.openai.com/api-keys

### Anthropic Claude (Paid, $0.003/1K tokens)

- Best for reasoning and safety
- Get key: https://console.anthropic.com/

### Cohere (Free tier: 100 calls/month)

- Good for conversational AI
- Get key: https://dashboard.cohere.com/

---

**Need help?** Check the Groq docs: https://console.groq.com/docs/quickstart
