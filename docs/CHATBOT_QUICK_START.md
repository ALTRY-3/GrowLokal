# 🤖 AI CHATBOT - QUICK START GUIDE

## ⚡ Setup (5 Minutes)

### 1. Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Sign up/login
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### 2. Add to Environment
```bash
# Edit .env.local
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Test It!
- Click the floating chat button (bottom right)
- Try: "Show me pottery items"
- Try: "Where is my order?"
- Try: "I want to become a seller"

---

## 💬 What Can Users Ask?

### Product Search
- "Find pottery items"
- "Show me handmade bags"
- "I'm looking for beauty products"
- "What handicrafts do you have?"

### Order Tracking
- "Where is my order?"
- "Track my delivery"
- "Show my recent orders"

### Wishlist
- "What's in my wishlist?"
- "Show saved items"

### Seller
- "How do I become a seller?"
- "I want to sell products"

### General Help
- "How does shipping work?"
- "What payment methods do you accept?"

---

## 🎨 Features at a Glance

✅ Natural language understanding  
✅ Product search with images  
✅ Order tracking  
✅ Wishlist management  
✅ Quick action buttons  
✅ Context-aware responses  
✅ Filipino-friendly personality  
✅ Mobile responsive  

---

## 🔍 How It Works

1. User types message
2. AI detects intent (product search, orders, etc.)
3. System fetches relevant data from database
4. OpenAI generates natural response
5. UI shows response + product cards + quick actions

---

## 💰 Cost

- Model: GPT-3.5 Turbo
- ~$0.001 per conversation
- ~$1 for 1000 conversations
- Very affordable!

---

## 🐛 Troubleshooting

**Chatbot not responding?**
- Check OPENAI_API_KEY in .env.local
- Restart dev server
- Check browser console for errors

**"Failed to connect"?**
- Check internet connection
- Verify OpenAI API key is valid
- Check OpenAI status: https://status.openai.com

**Products not showing?**
- Ensure MongoDB is running
- Check product database has items
- Verify products have isActive: true

---

## 📝 Customization

### Change AI Personality
Edit `src/app/api/chatbot/route.ts`:
```typescript
const SYSTEM_PROMPT = `Your custom instructions here...`;
```

### Adjust Response Length
```typescript
max_tokens: 200,  // Increase for longer responses
```

### Add New Intents
```typescript
const INTENTS = {
  YOUR_INTENT: ['keyword1', 'keyword2'],
};
```

---

## 🎯 Quick Test Commands

```
"Hi" → Welcome + quick actions
"Find pottery" → Product search
"My orders" → Order tracking (requires login)
"Wishlist" → Navigate to wishlist
"Become seller" → Seller info
```

---

## ✅ That's It!

Your AI chatbot is ready to help customers! 🎉

**Files Modified:**
- `src/app/api/chatbot/route.ts` ← AI logic
- `src/components/Chatbot.tsx` ← UI component
- `src/components/chatbot.css` ← Styles
- `.env.local` ← API key

**Documentation:**
- `docs/AI_CHATBOT_COMPLETE.md` ← Full guide
