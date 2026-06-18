// CONS — Vercel serverless function: เจนรูปด้วย Google Gemini 2.5 Flash Image (Nano Banana)
// ใช้ GOOGLE_API_KEY ตัวเดียวกับ /api/chat  ·  free tier ~500 รูป/วัน (ไม่ต้องใส่บัตร)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const host = req.headers.host || '';
  const origin = req.headers.origin || req.headers.referer || '';
  if (origin && host && origin.indexOf(host) === -1) return res.status(403).json({ error: 'forbidden origin' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    let prompt = body.prompt;
    if (!prompt || !String(prompt).trim()) return res.status(400).json({ error: 'no prompt' });
    prompt = String(prompt).slice(0, 4000);
    const ar = (body.ratio || '4:3');
    prompt = prompt + '. Aspect ratio ' + ar + ', composition framed for ' + ar + '.';

    const key = process.env.GOOGLE_API_KEY;
    if (!key) return res.status(500).json({ error: 'ยังไม่ได้ตั้ง GOOGLE_API_KEY ใน Vercel' });

    const MODEL = 'gemini-2.5-flash-image'; // เปลี่ยนได้ เช่น 'gemini-3.1-flash-image-preview'
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (data.error && data.error.message) || 'image error' });

    let img = null, mime = 'image/png';
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    for (let i = 0; i < parts.length; i++) {
      const inl = parts[i].inlineData || parts[i].inline_data;
      if (inl && inl.data) { img = inl.data; mime = inl.mimeType || inl.mime_type || mime; break; }
    }
    if (!img) {
      const fb = (data.promptFeedback && data.promptFeedback.blockReason) || 'no image';
      return res.status(200).json({ error: 'ไม่ได้ภาพ (' + fb + ')' });
    }
    return res.status(200).json({ image: img, mime: mime });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
