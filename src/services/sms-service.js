/**
 * Sends an OTP SMS. Behavior depends entirely on whether MSG91_AUTH_KEY
 * is set in your environment:
 *
 *   - Not set (default today): logs the OTP to the server console
 *     instead of sending a real text. This lets you build and test the
 *     entire login flow right now, end to end, with zero SMS cost and
 *     no MSG91 account.
 *
 *   - Set: sends a real SMS through MSG91's Send SMS API. When you sign
 *     up for MSG91, double check the exact request shape against your
 *     account's current API docs and your approved sender ID / DLT
 *     template (required for transactional SMS in India), the fields
 *     below (sender, route, template) are the common defaults but your
 *     account's configuration may require adjusting them.
 */
const sendOtpSms = async (phone, otp) => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const message = `Your House of Mahalaxmi verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`;

    if (!authKey) {
        console.log(`\n[DEV MODE - no MSG91_AUTH_KEY set] OTP for ${phone}: ${otp}\n`);
        return { success: true, devMode: true };
    }

    const senderId = process.env.MSG91_SENDER_ID || "MHLXMI";

    try {
        const response = await fetch("https://control.msg91.com/api/v5/flow/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authkey: authKey,
            },
            body: JSON.stringify({
                sender: senderId,
                route: "4",
                country: "91",
                sms: [
                    {
                        message,
                        to: [phone],
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("MSG91 send failed:", response.status, errorText);
            return { success: false, devMode: false };
        }

        return { success: true, devMode: false };
    } catch (error) {
        console.error("MSG91 request error:", error.message);
        return { success: false, devMode: false };
    }
};

module.exports = { sendOtpSms };