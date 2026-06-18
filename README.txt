CONS — เว็บ + AI จริง (Google Gemini)  ·  แชตตอบจริง + เจนรูปจริง
==================================================================

โครงไฟล์
  index.html        = หน้าเว็บแอป
  api/chat.js       = หลังบ้าน แชต AI (Gemini text)
  api/image.js      = หลังบ้าน เจนรูป (Gemini 2.5 Flash Image / Nano Banana)
  package.json      = ไฟล์โปรเจกต์

ทั้ง "แชต" และ "เจนรูป" ใช้คีย์ตัวเดียวกัน = GOOGLE_API_KEY

──────────────────────────────────────
ขั้น 1) เอาคีย์ Gemini (ฟรี)
  - ไปที่  https://aistudio.google.com  →  "Get API key"  →  Create API key  →  คัดลอกเก็บไว้
  - เจนรูป (gemini-2.5-flash-image) มี free tier ~500 รูป/วัน  ไม่ต้องใส่บัตรเครดิต

ขั้น 2) ขึ้น Vercel
  วิธี A (ไม่ต้องใช้ terminal) — แนะนำ
    1. แตกไฟล์ zip
    2. github.com → New repository → Upload files → ลากทุกไฟล์/โฟลเดอร์เข้าไป → Commit
    3. vercel.com → Add New… → Project → Import repo นี้ → Deploy
  วิธี B (terminal)
    1. npm i -g vercel
    2. cd cons-web
    3. vercel   (ตอบตามคำถาม จะได้ลิงก์)

ขั้น 3) ใส่คีย์ใน Vercel
  - Vercel → โปรเจกต์ → Settings → Environment Variables
  - เพิ่ม:  Name = GOOGLE_API_KEY   Value = (คีย์จาก AI Studio)
  - Save → Redeploy (Deployments → … → Redeploy)

ขั้น 4) ลองใช้บนเว็บที่ deploy แล้ว
  - แชต: พิมพ์ในช่อง "ถาม AI ผู้ช่วย" ด้านล่าง → Gemini ตอบจริง
  - เจนรูป: ไป AI Studio → แท็บดินสอ (AI Design) → เลือกห้อง/สไตล์/พิมพ์คอนเซปต์ → กดปุ่มเจน → ได้รูปจริง

──────────────────────────────────────
ข้อควรรู้
  • /api/chat และ /api/image เปิดสาธารณะ (ยังไม่มีล็อกอิน) ใครรู้ลิงก์ก็ยิงใช้คีย์เราได้
    → ตั้ง quota/งบใน Google AI Studio/Cloud และอย่าปล่อยลิงก์กว้าง จนกว่าจะใส่ระบบสมาชิก (ขั้นต่อไป)
  • Free tier มีลิมิตต่อนาที/ต่อวัน เกินแล้ว error ชั่วคราว
  • เจนรูปได้ผลดีสุดเมื่อพิมพ์คอนเซปต์เป็นภาษาอังกฤษ (ระบบสร้าง prompt อังกฤษให้อัตโนมัติจากสไตล์ที่เลือก)
  • วิดีโอ + โมเดล 3D (SketchUp) ยังเป็นการจำลอง — วิดีโอ (Veo) ต่อได้แต่ช้า/เสียเงิน, 3D ยังไม่มี API ลัด
  • ถ้าเปิดไฟล์ index.html ในเครื่องเฉย ๆ (ไม่ผ่าน Vercel) แชต/เจนรูปจะตกไปโหมดจำลอง เพราะไม่มีหลังบ้าน
