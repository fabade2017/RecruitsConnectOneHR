const TERMII_API_KEY = process.env.TERMII_API_KEY || '';
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'OneHR';

export async function sendSMS(phone: string, message: string) {
  if (!TERMII_API_KEY) {
    console.log('[SMS MOCK] To:', phone, 'Message:', message);
    return { success: true, messageId: 'mock-sms-' + Date.now() };
  }
  try {
    const res = await fetch('https://api.ng.termii.com/api/sms/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: TERMII_API_KEY, to: phone.replace(/^\+/, ''), from: TERMII_SENDER_ID, sms: message, type: 'plain', channel: 'generic' }),
    });
    const data: any = await res.json();
    return { success: res.ok, messageId: data.message_id };
  } catch (error) {
    console.error('SMS send error:', error);
    return { success: false, error };
  }
}
