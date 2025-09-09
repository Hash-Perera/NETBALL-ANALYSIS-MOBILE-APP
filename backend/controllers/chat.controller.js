const OpenAI = require("openai");

exports.chat = async (req, res) => {
  try {
    const client = new OpenAI({ apiKey: process.env.CHAT_API_KEY });

    const { messages = [], language = "en" } = req.body;

    const lang = language === "si" ? "si" : "en";

    const refusal = {
      en: "I'm a Netball-only assistant. Please ask about Netball (rules, positions, skills, drills, tactics, fitness, injuries, equipment, tournaments, umpiring, etc.).",
      si: "මම Netball සඳහා පමණක් උපකාරී බොට් එකක්. කරුණාකර Netball ගැන (නීති, තත්ත්ව, කුසලතා/භ්‍යාස, උපාය, සෞඛ්‍ය, උපකරණ, තරඟ, අම්පයර් වීම ආදිය) අසන්න.",
    };

    const sys = {
      role: "system",
      content: [
        // Role & scope
        "You are a helpful, concise assistant that ONLY answers questions about NETBALL.",
        "Topics allowed: World Netball rules & interpretations, positions and rotations, coaching drills, passing/shooting/defense skills, footwork/obstruction/contact, tactics (set plays, center pass strategies), fitness for netball, netball-specific injuries & prevention (general info, no medical diagnosis), equipment, umpiring/hand signals, teams/leagues/tournaments history or facts.",
        "If the user asks something unrelated to netball, REFUSE and briefly redirect to netball.",
        "Be accurate, practical, and keep answers short unless the user asks for depth.",

        lang === "si"
          ? "Always reply in Sinhala. Use clear, simple Sinhala. Do not switch languages."
          : "Always reply in English. Do not switch languages.",

        `When refusing, use this short message: "${
          lang === "si" ? refusal.si : refusal.en
        }"`,
      ].join("\n"),
    };

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [sys, ...messages],
      temperature: 0.3,
      max_tokens: 600,
    });

    const reply = r.choices?.[0]?.message?.content?.trim();
    res.json({
      reply:
        reply ||
        (lang === "si"
          ? "සමාවන්න, පිළිතුර ලබා දීමට නොහැකි විය."
          : "Sorry, I couldn’t generate a reply."),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      reply:
        req.body?.language === "si"
          ? "සර්වර් දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න."
          : "Server error. Please try again.",
    });
  }
};
