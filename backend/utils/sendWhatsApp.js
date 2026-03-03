import axios from "axios";

const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL ||
  "https://graph.instagram.com/v18.0";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Send a WhatsApp message using Meta's WhatsApp Business API
 * @param {string} recipientPhoneNumber - E.g., +8801312345678
 * @param {string} message - Message text to send
 * @returns {Promise<object>} - API response
 */
export const sendWhatsAppMessage = async (recipientPhoneNumber, message) => {
  try {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.error("❌ WhatsApp API credentials missing");
      console.error(`Phone ID: ${WHATSAPP_PHONE_ID ? "✓" : "✗"}`);
      console.error(`Access Token: ${WHATSAPP_ACCESS_TOKEN ? "✓" : "✗"}`);
      return { success: false, error: "WhatsApp API not configured" };
    }

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipientPhoneNumber,
      type: "text",
      text: {
        body: message,
      },
    };

    console.log(`📤 Sending WhatsApp to: ${recipientPhoneNumber}`);
    console.log(`📝 Message: ${message.substring(0, 50)}...`);
    console.log(`🔗 URL: ${url}`);

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ WhatsApp message sent successfully to ${recipientPhoneNumber}`);
    console.log(`📊 Response:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Error sending WhatsApp to ${recipientPhoneNumber}`);
    console.error(`Status: ${error.response?.status}`);
    console.error(`Error Data:`, error.response?.data || error.message);
    console.error(`Full Error:`, error);
    return { success: false, error: error.response?.data || error.message };
  }
};

/**
 * Send SOS WhatsApp message with user info
 * @param {string} recipientPhoneNumber - Recipient's WhatsApp number
 * @param {object} userData - User info {username, location}
 * @returns {Promise<object>}
 */
export const sendSOSWhatsApp = async (recipientPhoneNumber, userData) => {
  const sosMessage = `🚨 *EMERGENCY SOS ALERT* 🚨\n\n*${userData.username}* needs immediate help!\n\n${
    userData.location ? `📍 Location: ${userData.location}\n` : ""
  }Please contact them immediately or call emergency services.\n\nTime: ${new Date().toLocaleString()}`;

  return sendWhatsAppMessage(recipientPhoneNumber, sosMessage);
};
