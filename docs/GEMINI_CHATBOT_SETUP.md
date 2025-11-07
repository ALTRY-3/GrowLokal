# 🤖 Gemini Pro Chatbot Setup Guide

## ✅ Migration Complete!

Your chatbot now uses **Google Gemini Pro** instead of OpenAI.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your Gemini API Key

1. Go to **[Google AI Studio](https://makersuite.google.com/app/apikey)**
2. Click "**Get API Key**" or "**Create API Key**"
3. Copy your API key (starts with something like `AIza...`)

### Step 2: Add to Environment Variables

Open `.env.local` and replace the placeholder:

```bash
GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

### Step 3: Restart Your Server

```powershell
npm run dev
```

**That's it!** 🎉

---

## 💰 Gemini Pro Advantages

| Feature | Benefit |
|---------|---------|
| **Free Tier** | 60 requests/minute completely FREE |
| **Speed** | Very fast responses (~1-2 seconds) |
| **Quality** | Comparable to GPT-3.5 Turbo |
| **Cost** | FREE for your expected usage |
| **Multilingual** | Great with Filipino context |

---

## 🧪 Test Your Chatbot

1. Click the chat button (bottom right)
2. Try these queries:

```
"Hi!" 
→ Should greet you with quick actions

"Find pottery items"
→ Should search and show products

"Where is my order?"
→ Should ask to login or show orders

"I want to become a seller"
→ Should show seller quick actions
```

---

## 📊 Free Tier Limits

**Google Gemini Pro Free Tier:**
- **60 requests per minute**
- **1,500 requests per day**
- **1 million tokens per month**

For a marketplace chatbot, this is MORE than enough! Even with 100 customers chatting simultaneously, you won't hit the limits.

---

## 🔧 What Changed?

### Package Changes:
```bash
❌ Removed: openai
✅ Added: @google/generative-ai
```

### Code Changes:
- `src/app/api/chatbot/route.ts` - Switched from OpenAI SDK to Gemini SDK
- `.env.local` - Changed `OPENAI_API_KEY` to `GEMINI_API_KEY`

### What Stayed the Same:
- ✅ All chatbot features (intent detection, product search, etc.)
- ✅ UI components (Chatbot.tsx, chatbot.css)
- ✅ Quick actions
- ✅ Product/order cards
- ✅ Everything else!

---

## 🐛 Troubleshooting

**"API key not valid" error?**
- Make sure you copied the full API key from Google AI Studio
- Key should start with `AIza`
- No spaces before/after the key in `.env.local`
- Restart your dev server after adding the key

**"Failed to connect" error?**
- Check internet connection
- Verify Gemini API key is active
- Check Google AI Studio status

**No response from chatbot?**
- Open browser console (F12)
- Check for error messages
- Verify MongoDB is running
- Make sure dev server restarted after adding API key

---

## 🎯 Testing Checklist

- [ ] Got Gemini API key from Google AI Studio
- [ ] Added `GEMINI_API_KEY` to `.env.local`
- [ ] Restarted dev server (`npm run dev`)
- [ ] Clicked chatbot button
- [ ] Sent "Hi!" message
- [ ] Tried product search ("Find pottery")
- [ ] Tested order tracking (requires login)
- [ ] Checked quick action buttons work

---

## 🎨 Future Enhancements

With Gemini Pro, you can easily add:

1. **Multimodal Input** - Upload product images, get AI descriptions
2. **Filipino Language** - Better Tagalog understanding
3. **Longer Contexts** - More conversation history
4. **Image Analysis** - Product quality assessment

---

## 💡 Pro Tips

1. **Monitor Usage**: Check your quota at [Google AI Studio](https://makersuite.google.com/)
2. **Rate Limiting**: Already built into the chatbot (60/min limit)
3. **Caching**: Consider caching common queries to save API calls
4. **Error Handling**: Fallback responses already implemented

---

## 📞 Need Help?

- **Gemini Docs**: https://ai.google.dev/docs
- **API Reference**: https://ai.google.dev/api/rest
- **Troubleshooting**: https://ai.google.dev/docs/troubleshooting

---

**Enjoy your FREE, fast, and powerful AI chatbot! 🚀**
