const express = require("express");
const router = express.Router();
const Journal = require("../models/Journal");
const authMiddleware = require("../middleware/authMiddleware");

// Daily prompts
const dailyPrompts = [
  "What made you smile today, even if it was something small?",
  "What is one thing you're struggling with right now? How can you be kinder to yourself about it?",
  "Describe a moment today when you felt truly present. What were you doing?",
  "What is one thing you're grateful for that you usually take for granted?",
  "What emotion has been showing up most for you lately? What might it be telling you?",
  "What would you tell your younger self about what you're going through right now?",
  "What is one small step you could take tomorrow toward something that matters to you?",
];

// Smart rule-based analysis
function analyzeEntry(entry) {
  const text = entry.toLowerCase();

  // Detect emotions
  const emotions = {
    happy: ["happy", "joy", "excited", "grateful", "blessed", "amazing", "wonderful", "great", "fantastic", "love"],
    sad: ["sad", "depressed", "unhappy", "crying", "tears", "lonely", "hopeless", "miserable", "hurt"],
    anxious: ["anxious", "worried", "stress", "nervous", "panic", "overwhelmed", "scared", "fear", "anxiet"],
    angry: ["angry", "frustrated", "mad", "annoyed", "irritated", "furious", "rage"],
    tired: ["tired", "exhausted", "drained", "sleepy", "fatigue", "burnout"],
    hopeful: ["hope", "better", "improve", "progress", "forward", "future", "optimis"],
    grateful: ["grateful", "thankful", "appreciate", "blessed", "fortune"],
  };

  let detectedEmotion = "neutral";
  let maxCount = 0;

  for (const [emotion, keywords] of Object.entries(emotions)) {
    const count = keywords.filter(k => text.includes(k)).length;
    if (count > maxCount) {
      maxCount = count;
      detectedEmotion = emotion;
    }
  }

  // Generate response based on emotion
  const responses = {
    happy: [
      "Your entry radiates such positive energy! 🌟 It's wonderful that you're experiencing these moments of joy. Happiness shared is happiness doubled — consider telling someone close to you about what's making you smile. What can you do tomorrow to nurture this feeling further?",
      "Reading your words brings a smile! 😊 These positive moments are worth celebrating and remembering. Try to anchor this feeling — notice what contributed to it so you can intentionally create more moments like this.",
    ],
    sad: [
      "Thank you for being brave enough to express how you're feeling. 💙 Sadness is a valid emotion that deserves acknowledgment, not suppression. Be gentle with yourself today — you don't have to fix everything at once. What is one small act of kindness you could do for yourself right now?",
      "Your feelings are completely valid, and it takes courage to write them down. 🌧️ Remember that difficult emotions are temporary, even when they don't feel that way. Is there one person you trust that you could reach out to today?",
    ],
    anxious: [
      "It sounds like you're carrying a lot right now. 🌬️ When anxiety rises, try this: breathe in for 4 counts, hold for 4, out for 4. Your worries are real, but they don't define your future. What is ONE thing within your control that you could focus on today?",
      "Anxiety often comes from trying to carry tomorrow's burdens today. 💚 Try breaking down what's overwhelming you into tiny, manageable pieces. What is the single smallest step you could take to feel more grounded right now?",
    ],
    angry: [
      "Your frustration is completely understandable. 🔥 Anger is often a signal that something important to us has been threatened or ignored. Before reacting, try taking 10 deep breaths. What is this anger really trying to tell you about what you need?",
      "It's okay to feel angry — what matters is how we channel that energy. 💪 Physical movement can help release tension. What boundary might need to be set, or what conversation might need to happen to address the root of this feeling?",
    ],
    tired: [
      "Your body and mind are sending you an important message — rest is not a luxury, it's a necessity. 😴 You cannot pour from an empty cup. What is one commitment you could temporarily set aside to give yourself permission to recharge?",
      "Exhaustion is a signal worth listening to. 🌙 Sometimes the most productive thing we can do is rest. What would genuine, guilt-free rest look like for you today? You've earned it.",
    ],
    hopeful: [
      "There's beautiful strength in your words — hope is one of the most powerful forces we carry. 🌱 Hold onto this feeling and let it guide your next steps. What small action could you take today that aligns with this hopeful vision of your future?",
      "Your optimism shines through your writing! ✨ Hope combined with action creates real change. What is one concrete step, however small, you could take toward what you're hoping for?",
    ],
    grateful: [
      "Gratitude is a superpower, and you're clearly practicing it. 🙏 Research shows that recognizing what we're thankful for rewires our brain toward positivity. Who is one person you could express this gratitude to directly today?",
      "Your grateful heart is evident in every word. 🌸 Gratitude doesn't just feel good — it actually changes how our brain processes the world. What is something you usually overlook that deserves more appreciation?",
    ],
    neutral: [
      "Thank you for taking time to reflect today. 🌿 The simple act of journaling — putting thoughts into words — helps us understand ourselves more deeply. What feeling sits just beneath the surface of what you've written? Give yourself permission to explore it.",
      "There's great value in honest reflection, even when words feel ordinary. 📝 Sometimes our most important insights come in quiet moments like this. What is one thing you noticed about yourself through writing this entry?",
    ],
  };

  const responseList = responses[detectedEmotion];
  const response = responseList[Math.floor(Math.random() * responseList.length)];

  return { analysis: response, emotion: detectedEmotion };
}

// GET /api/journal/prompt — get today's prompt
router.get("/prompt", authMiddleware, async (req, res) => {
  try {
    const dayOfWeek = new Date().getDay();
    const prompt = dailyPrompts[dayOfWeek];
    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/journal — save entry + get analysis
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { prompt, entry } = req.body;

    if (!entry || entry.trim().length < 10) {
      return res.status(400).json({ message: "Please write at least a sentence." });
    }

    const { analysis, emotion } = analyzeEntry(entry);

    const journal = new Journal({
      userId: req.userId,
      prompt,
      entry,
      aiAnalysis: analysis,
      mood: emotion,
    });

    await journal.save();

    res.status(201).json({
      message: "Journal entry saved! 🌱",
      journal,
      aiAnalysis: analysis,
      emotion,
    });
  } catch (error) {
    console.error("Journal POST error:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET /api/journal — get journal history
router.get("/", authMiddleware, async (req, res) => {
  try {
    const entries = await Journal.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20);

    res.json({ entries });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;