import axios from "axios";

/**
 * Send a WhatsApp message using Meta's WhatsApp Business API
 * @param {string} recipientPhoneNumber - E.g., +8801312345678
 * @param {string} message - Message text to send
 * @param {object} options - Optional settings { mode: "text" | "template" }
 * @returns {Promise<object>} - API response
 */
export const sendWhatsAppMessage = async (
  recipientPhoneNumber,
  message,
  options = {},
) => {
  try {
    // Read from process.env at runtime, not at module load time
    const WHATSAPP_API_URL =
      process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v22.0";
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const WHATSAPP_MESSAGE_MODE =
      process.env.WHATSAPP_MESSAGE_MODE || "text"; // text | template
    const WHATSAPP_TEMPLATE_NAME =
      process.env.WHATSAPP_TEMPLATE_NAME || "hello_world";
    const WHATSAPP_TEMPLATE_LANG =
      process.env.WHATSAPP_TEMPLATE_LANG || "en_US";
    const resolvedMode = options.mode || WHATSAPP_MESSAGE_MODE;

    if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.error("❌ WhatsApp API credentials missing");
      console.error(`Phone ID: ${WHATSAPP_PHONE_ID ? "✓" : "✗"}`);
      console.error(`Access Token: ${WHATSAPP_ACCESS_TOKEN ? "✓" : "✗"}`);
      return { success: false, error: "WhatsApp API not configured" };
    }

    const url = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`;

    // Remove + sign from phone number for API (convert +8801304855386 to 8801304855386)
    const phoneForAPI = recipientPhoneNumber.replace(/^\+/, "");

    const payload =
      resolvedMode === "template"
        ? {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneForAPI,
            type: "template",
            template: {
              name: WHATSAPP_TEMPLATE_NAME,
              language: {
                code: WHATSAPP_TEMPLATE_LANG,
              },
            },
          }
        : {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: phoneForAPI,
            type: "text",
            text: {
              body: message,
            },
          };

    console.log(
      `📤 Sending WhatsApp ${resolvedMode} message to: ${recipientPhoneNumber}`,
    );
    console.log(`📞 Phone for API: ${phoneForAPI}`);
    console.log(`🔗 URL: ${url}`);

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      `✅ WhatsApp ${resolvedMode} sent successfully to ${recipientPhoneNumber}`,
    );
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
 * @param {object} userData - User info {username, phone}
 * @returns {Promise<object>}
 */
export const sendSOSWhatsApp = async (recipientPhoneNumber, userData) => {
  const locationText = userData.location
    ? `📍 Location: https://www.google.com/maps?q=${userData.location.latitude},${userData.location.longitude}`
    : "📍 Location: Not available";

  const sosMessage = `🚨 *EMERGENCY SOS ALERT* 🚨\n\n*${userData.username}* needs immediate help!\n📞 Phone: ${
    userData.phone || "Not provided"
  }\n${locationText}\n\nPlease contact them immediately or call emergency services.\n\nTime: ${new Date().toLocaleString()}`;

  return sendWhatsAppMessage(recipientPhoneNumber, sosMessage, {
    mode: userData.mode,
  });
};
