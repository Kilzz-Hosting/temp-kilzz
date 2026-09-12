// Vercel Serverless Function — Webhook Telegram
// Sekarang bot bisa akses LANGSUNG ke link worker (server-side), tidak bergantung
// browser/website terbuka.
//
// Setup webhook (buka SEKALI di browser, ganti <TOKEN> & <DOMAIN>):
// https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<DOMAIN-VERCEL-KAMU>/api/telegram-webhook
//
// Command yang tersedia di bot:
//   /start            -> cek bot benar terhubung
//   /cek <alamat>     -> ambil isi inbox langsung dari worker
//                         contoh: /cek abc123@arras-mail.my.id

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8921610004:AAEvdnVKzR_ETXfoyYMqYd745CqGt4qNBoI";
const API_BASE  = process.env.TEMPMAIL_API_BASE  || "https://tempmail-api.culuncuni.workers.dev";

function escapeHtml(str){
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function sendTelegramMessage(chatId, text){
  try{
    await fetch(https://api.telegram.org/bot${BOT_TOKEN}/sendMessage, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
  }catch(err){
    console.error('Gagal kirim balasan Telegram:', err);
  }
}

function formatSender(from){
  if(!from) return '(tidak diketahui)';
  const parts = String(from).split('@');
  const domain = parts[parts.length - 1];
  if(from.length > 40 || from.includes('bounces')) return via ${domain};
  return from;
}

async function handleCekCommand(chatId, address){
  if(!address){
    await sendTelegramMessage(chatId,
      Format: <code>/cek alamat@domain</code>\n\nContoh:\n<code>/cek abc123@arras-mail.my.id</code>);
    return;
  }
  try{
    const r = await fetch(${API_BASE}/inbox?address=${encodeURIComponent(address)});
    if(!r.ok){
      await sendTelegramMessage(chatId, ⚠️ Worker balas status ${r.status} — cek alamat/worker-nya.);
      return;
    }
    const data = await r.json();
    const emails = Array.isArray(data.emails) ? data.emails.slice() : [];

    if(emails.length === 0){
      await sendTelegramMessage(chatId, 📭 Belum ada email masuk ke <code>${escapeHtml(address)}</code>);
      return;
    }

    // Urutkan biar yang terbaru duluan, tampilkan maksimal 5
    emails.sort((a,b)=> new Date(b.receivedAt) - new Date(a.receivedAt));
    const recent = emails.slice(0, 5);
    const lines = recent.map(m => {
      const preview = (m.body || '').replace(/\s+/g,' ').trim().slice(0, 150);
      return • <b>${escapeHtml(m.subject || '(tanpa subjek)')}</b>\n  dari ${escapeHtml(formatSender(m.from))}${preview ? \n  ${escapeHtml(preview)}${preview.length===150?'…':''} : ''};
    });

    await sendTelegramMessage(chatId,
      📬 <b>${emails.length} email</b> di <code>${escapeHtml(address)}</code> (5 terbaru):\n\n${lines.join('\n\n')});
  }catch(err){
    await sendTelegramMessage(chatId, ⚠️ Gagal ambil data dari worker: ${escapeHtml(String(err && err.message || err))});
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(200).send('Webhook aktif. Command: /start, /cek <alamat>');
    return;
  }

  try {
    const update = req.body;
    const message = update && update.message;

    if (message && typeof message.text === 'string') {
      const chatId = message.chat.id;
      const text = message.text.trim();

      if (text === '/start') {
        await sendTelegramMessage(chatId,
          ✅ <b>Bot Terhubung!</b>\n\nBot ini aktif dan bisa akses langsung ke worker email.\n\nChat ID kamu: <code>${chatId}</code>\n\nCoba: <code>/cek alamat@domain</code>);
      } else if (text.startsWith('/cek')) {
        const address = text.split(/\s+/)[1];
        await handleCekCommand(chatId, address);
      }
    }
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }

  res.status(200).send('OK');
}