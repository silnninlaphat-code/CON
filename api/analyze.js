// CONS — /api/analyze : ใช้ Google Gemini ถอด BOQ ละเอียด + สร้าง imagePrompt + อ่านรูปอ้างอิง (JSON mode)
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const host = req.headers.host || '', origin = req.headers.origin || req.headers.referer || '';
  if (origin && host && origin.indexOf(host) === -1) return res.status(403).json({ error: 'forbidden origin' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const room = (body.room || 'ห้อง').toString().slice(0, 80);
    const style = (body.style || '').toString().slice(0, 300);
    const area = Number(body.area) || 0;
    const concept = (body.concept || '').toString().slice(0, 500);
    const key = process.env.GOOGLE_API_KEY;
    if (!key) return res.status(500).json({ error: 'ยังไม่ได้ตั้ง GOOGLE_API_KEY ใน Vercel' });

    const sys = 'คุณเป็นสถาปนิกและ QS (ผู้ประเมินราคา) มืออาชีพในไทย วิเคราะห์ห้องที่กำหนด (และรูปอ้างอิงถ้ามี) แล้วตอบเป็น JSON เท่านั้น ตามสคีมา: {"imagePrompt":"<English prompt สำหรับเรนเดอร์ photorealistic ของห้องนี้ ตรงชนิดห้องและสไตล์>","items":[{"cat":"หมวดงานไทย","name":"ชื่อวัสดุ/งานเฉพาะเจาะจง","unit":"หน่วยไทย","qty":ตัวเลขจากพื้นที่,"matUnit":ราคาวัสดุต่อหน่วยบาท,"laborUnit":ค่าแรงต่อหน่วยบาท,"tag":"ป้ายสั้นไทย<=12ตัว"}],"risks":["ข้อควรระวังไทย"],"alts":["วัสดุทดแทน/ลดงบ ไทย"],"conf":0-100}. กฎ: items ต้องเจาะจงตามชนิดห้องจริง (เช่น โรงรถ → พื้นอีพ็อกซี่/ขัดมัน, ประตูม้วน/บานเลื่อน, ระบบไฟ-ปลั๊ก, ชั้นเก็บของ — ไม่ใช่เคาน์เตอร์ครัว), 8-16 รายการ ครบงานหลัก (รื้อถอนถ้าจำเป็น พื้น ผนัง ฝ้า สี ไฟฟ้า งานเฉพาะห้อง เฟอร์นิเจอร์/บิวท์อิน), qty คำนวณสมเหตุผลจากพื้นที่, ราคาเป็นราคาตลาดไทยปี 2026 จริง ไม่สุ่มมั่ว. ตอบ JSON ล้วน ห้ามมีข้อความหรือ markdown อื่น';
    const userText = 'ชนิดห้อง: ' + room + '\nพื้นที่: ' + area + ' ตร.ม.\nสไตล์/วัสดุที่เลือก: ' + (style || '-') + '\nคอนเซปต์เพิ่มเติม: ' + (concept || '-');
    const parts = [{ text: userText }];
    if (body.refImage) parts.push({ inline_data: { mime_type: (body.refMime || 'image/jpeg'), data: body.refImage } });

    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ system_instruction: { parts: [{ text: sys }] }, contents: [{ role: 'user', parts: parts }], generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 4096, temperature: 0.4 } })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: (data.error && data.error.message) || 'gemini error' });
    const txt = ((data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || []).map(function (p) { return p.text || ''; }).join('').trim();
    let parsed = null; try { parsed = JSON.parse(txt); } catch (e) { const m = txt.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} } }
    if (!parsed || !Array.isArray(parsed.items)) return res.status(200).json({ error: 'parse fail' });
    return res.status(200).json(parsed);
  } catch (e) { return res.status(500).json({ error: String((e && e.message) || e) }); }
};
