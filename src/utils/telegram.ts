import type { Lead } from '../types';

function formatStars(rating?: number): string {
  if (!rating) return 'غير متاح';
  const full = Math.round(rating);
  return '⭐'.repeat(full) + ` (${rating}/5)`;
}

export function buildTelegramMessage(lead: Lead): string {
  return `
🎯 *عميل محتمل جديد - Leads Harvester*

🏢 *الاسم:* ${lead.name}
📞 *الهاتف:* ${lead.phone || 'غير متاح'}
📍 *العنوان:* ${lead.address || 'غير متاح'}
⭐ *التقييم:* ${formatStars(lead.rating)} ${lead.reviewCount ? `(${lead.reviewCount.toLocaleString('ar')} تقييم)` : ''}
🏷️ *النوع:* ${lead.category || 'غير محدد'}
🌐 *الموقع:* ${lead.website || 'غير متاح'}
⏰ *وقت الاستخراج:* ${new Date(lead.timestamp).toLocaleString('ar-SA')}

---
📊 تم الإرسال عبر *Leads Harvester*
`.trim();
}

export async function sendToTelegram(
  lead: Lead,
  botToken: string,
  chatId: string
): Promise<void> {
  if (!botToken || !chatId) {
    throw new Error('يرجى إدخال Bot Token و Chat ID في الإعدادات أولاً');
  }

  const message = buildTelegramMessage(lead);
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    const telegramErrors: Record<number, string> = {
      401: 'Bot Token غير صحيح. تحقق من الـ Token في إعدادات التليجرام.',
      400: `خطأ في البيانات: ${data.description}`,
      403: 'البوت لا يملك صلاحية إرسال رسائل لهذا الـ Chat. تأكد من إضافة البوت للمحادثة.',
    };
    throw new Error(telegramErrors[data.error_code] || `خطأ تليجرام: ${data.description}`);
  }
}

export async function sendBulkToTelegram(
  leads: Lead[],
  botToken: string,
  chatId: string,
  onProgress?: (index: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < leads.length; i++) {
    try {
      await sendToTelegram(leads[i], botToken, chatId);
      success++;
      await new Promise(r => setTimeout(r, 300));
    } catch {
      failed++;
    }
    onProgress?.(i + 1);
  }

  return { success, failed };
}
