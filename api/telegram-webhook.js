// Vercel Serverless Function — Webhook Telegram
// Endpoint ini menerima update dari Telegram (khususnya command /start)
// dan membalas untuk konfirmasi bahwa bot sudah tersambung.
//
// SETELAH DEPLOY, aktifkan webhook-nya dengan membuka URL ini di browser SEKALI SAJA
// (ganti <TOKEN> dan <DOMAIN-VERCEL-KAMU>):
//
// https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<DOMAIN-VERCEL-KAMU>/api/telegram-webhook
//
// Setelah itu, kirim /start ke bot kamu di Telegram — bot akan membalas
// kalau memang sudah terhubung ke server/website ini.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8921610004:AAEvdnVKzR_ETXfoyYMqYd745CqGt4qNBoI";

export default async function handler(req, res) {
  // Telegram selalu kirim POST. GET dipakai kalau kamu buka URL ini manual buat cek hidup/tidaknya.
  if (req.method !== 'POST') {
    res.status(200).send('Webhook aktif. Kirim /start ke bot Telegram kamu untuk tes koneksi.');
    return;
  }

  try {
    const update = req.body;
    const message = update && update.message;

    if (message && typeof message.text === 'string') {
      const chatId = message.chat.id;
      const text = message.text.trim();

      if (text === '/start') {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text:
              `✅ *Bot Terhubung!*\n\n` +
              `Bot ini aktif dan siap mengirim notifikasi email/OTP dari website Kilzz Temp Mail.\n\n` +
              `Chat ID kamu: \`${chatId}\``,
            parse_mode: 'Markdown'
          })
        });
      }
    }
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }

  // Telegram cuma butuh respons 200 OK, isinya tidak penting.
  res.status(200).send('OK');
}