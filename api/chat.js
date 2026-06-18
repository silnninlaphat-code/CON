// CONS — Vercel serverless function: เรียก Google Gemini อย่างปลอดภัย (คีย์อยู่ฝั่งเซิร์ฟเวอร์)
// ตั้งค่า Environment Variable ชื่อ GOOGLE_API_KEY ใน Vercel (คีย์จาก https://aistudio.google.com)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // กันการยิงข้ามเว็บแบบง่าย ๆ (ไม่ใช่ระบบกันจริง — ของจริงต้องมี auth + rate limit)
  const host = req.headers.host || '';
  const origin = req.headers.origin || req.headers.referer || '';
  if (origin && host && origin.indexOf(host) === -1) {
    return res.status(403).json({ error: 'forbidden origin' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let prompt = body.prompt, system = body.system, context = body.context;
    if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'no prompt' });
    prompt = String(prompt).slice(0, 4000); // กันข้อความยาวเกิน

    const key = process.env.GOOGLE_API_KEY;
    if (!key) return res.status(500).json({ error: 'ยังไม่ได้ตั้ง GOOGLE_API_KEY ใน Vercel' });

    // เปลี่ยนรุ่นได้: 'gemini-2.5-flash' (ฟรี/เร็ว), 'gemini-3.5-flash', 'gemini-2.0-flash'
    const MODEL = 'gemini-2.5-flash';
    const userText = (context ? context + '\n\n' : '') + 'คำถามจากผู้ใช้: ' + prompt;

    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          system_instruction: system ? { parts: [{ text: system }] } : undefined,
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { maxOutputTokens: 1000 }
        })
      }
    );

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (data.error && data.error.message) || 'gemini error' });

    const cand = (data.candidates && data.candidates[0]) || null;
    const text = cand && cand.content && cand.content.parts
      ? cand.content.parts.map(function (p) { return p.text || ''; }).join('').trim()
      : '';
    if (!text) {
      const fb = (data.promptFeedback && data.promptFeedback.blockReason) || (cand && cand.finishReason) || 'empty';
      return res.status(200).json({ error: 'ไม่มีคำตอบ (' + fb + ')' });
    }
    return res.status(200).json({ text: text });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
