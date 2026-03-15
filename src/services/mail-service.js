const nodemailer = require("nodemailer");
require('dotenv').config();

// ==========================================
// 1. CONFIGURATION
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const BRAND_CONFIG = {
    name: "Jivan",
    url: "https://jivan.website",
    address: "Bhadrak, Odisha",
    supportEmail: "support@jivan.website"
};

// ==========================================
// 2. UI/UX TEMPLATES (Senior Dev Level)
// ==========================================

/**
 * TEMPLATE A: STANDARD ADMIN
 * Vibe: Clean, Modern, Medical/Tech, Approachable.
 * Use case: General announcements, newsletters, user onboardings.
 */
const getAdminTemplate = (name, otp) => {
    return `<!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="x-apple-disable-message-reformatting">
            <title>Verify your identity</title>

            <!-- Dark Mode Support -->
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">

            <!-- Web Font -->
            <!--[if !mso]><!-->
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <!--<![endif]-->

            <!-- CSS Reset & Styles -->
            <style>
                html, body { margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important; font-family: 'Inter', Helvetica, Arial, sans-serif; }
                * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
                div[style*="margin: 16px 0"] { margin: 0 !important; }
                table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
                table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
                img { -ms-interpolation-mode:bicubic; }
                a { text-decoration: none; }

                /* Mobile Styles */
                @media screen and (max-width: 600px) {
                    .email-container { width: 100% !important; }
                    .otp-box { font-size: 32px !important; letter-spacing: 8px !important; padding: 20px !important; }
                    .p-mobile { padding: 40px 24px !important; }
                }

                /* Dark Mode Styles */
                @media (prefers-color-scheme: dark) {
                    .dark-bg { background-color: #1a1a1a !important; }
                    .dark-card { background-color: #2d2d2d !important; }
                    .dark-text { color: #ffffff !important; }
                    .dark-subtext { color: #aaaaaa !important; }
                    .dark-otp-bg { background-color: #383838 !important; border-color: #444444 !important; }
                    .dark-otp-text { color: #00b894 !important; }
                }
            </style>
        </head>
        <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f4f6f8;" class="dark-bg">
            <center style="width: 100%; background-color: #f4f6f8;" class="dark-bg">
            
            <!-- Visually Hidden Preheader -->
            <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
                Your JIVAN verification code is {{otp}}.
            </div>

            <!-- Email Body -->
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto;" class="email-container">
                
                <!-- Spacing -->
                <tr><td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td></tr>

                <!-- Logo Section -->
                <tr>
                    <td align="center" style="padding-bottom: 30px;">
                        <span style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-weight: 800; font-size: 24px; color: #1f2937; letter-spacing: -0.02em;" class="dark-text">
                            JIVAN<span style="color: #00b894;">.</span>
                        </span>
                    </td>
                </tr>

                <!-- Main Card -->
                <tr>
                    <td style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);" class="dark-card">
                        
                        <!-- Accent Line -->
                        <div style="height: 6px; background-color: #00b894; width: 100%;"></div>

                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                                <td style="padding: 50px 40px;" class="p-mobile">
                                    
                                    <!-- Headline -->
                                    <h1 style="margin: 0 0 16px 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: 700; color: #111827; text-align: center; letter-spacing: -0.02em;" class="dark-text">
                                        Confirm your email
                                    </h1>

                                    <!-- Intro -->
                                    <p style="margin: 0 0 32px 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 24px; color: #6b7280; text-align: center;" class="dark-subtext">
                                        Hello ${name},<br>
                                        Please enter the code below to sign in to <strong>JIVAN</strong>.
                                    </p>

                                    <!-- OTP Module -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td align="center">
                                                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; text-align: center; display: inline-block; min-width: 220px;" class="dark-otp-bg">
                                                    <!-- Monospace font for the code to ensure unambiguous character reading -->
                                                    <span class="otp-box dark-otp-text" style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 700; color: #111827; letter-spacing: 12px; line-height: 1; display: block;">${otp}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Expiry Note -->
                                    <p style="margin: 32px 0 0 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;" class="dark-subtext">
                                        This code will expire in 10 minutes. <br>If you didn't request this, you can safely ignore this email.
                                    </p>

                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding: 30px; text-align: center;">
                        <p style="margin: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #9ca3af;" class="dark-subtext">
                            &copy; ${new Date().getFullYear()} JIVAN Medical. All rights reserved.<br>
                            123 Innovation Drive, Tech City, TC 90210
                        </p>
                    </td>
                </tr>

            </table>
            
            <!-- Spacing -->
            <div style="height: 40px; line-height: 40px;">&nbsp;</div>
            
            </center>
        </body>
    </html>`;
};

/**
 * TEMPLATE B: SUPER-ADMIN / EXECUTIVE
 * Vibe: Authoritative, High-Contrast, Urgent, "System Core".
 * Use case: Security alerts, financial updates, system-wide overrides.
 */
const getSuperAdminTemplate = (to, name) => {
    return `<!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="x-apple-disable-message-reformatting">
            <title>New User Registration</title>

            <!-- Dark Mode Support -->
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">

            <!-- Web Font -->
            <!--[if !mso]><!-->
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <!--<![endif]-->

            <!-- CSS Reset & Styles -->
            <style>
                html, body { margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important; font-family: 'Inter', Helvetica, Arial, sans-serif; }
                * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
                div[style*="margin: 16px 0"] { margin: 0 !important; }
                table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
                table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
                img { -ms-interpolation-mode:bicubic; }
                a { text-decoration: none; }

                /* Animation: Progressive Enhancement 
                (Works in Apple Mail, iOS, some Webmail. Ignored gracefully by Outlook) */
                @media screen {
                    .anim-fade-up {
                        animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        opacity: 0;
                        transform: translateY(15px);
                    }
                    .anim-delay-1 { animation-delay: 0.1s; }
                    .anim-delay-2 { animation-delay: 0.2s; }
                    
                    @keyframes fadeUp {
                        to { opacity: 1; transform: translateY(0); }
                    }
                }

                /* Mobile Styles */
                @media screen and (max-width: 600px) {
                    .email-container { width: 100% !important; }
                    .p-mobile { padding: 30px 20px !important; }
                    .data-row { display: block !important; width: 100% !important; margin-bottom: 15px !important; }
                    .data-label { margin-bottom: 5px !important; display: block !important; }
                }

                /* Dark Mode Styles */
                @media (prefers-color-scheme: dark) {
                    .dark-bg { background-color: #111111 !important; }
                    .dark-card { background-color: #1e1e1e !important; border: 1px solid #333333 !important; }
                    .dark-text { color: #ffffff !important; }
                    .dark-subtext { color: #999999 !important; }
                    .dark-label { color: #888888 !important; }
                    .dark-value { color: #eeeeee !important; background-color: #2a2a2a !important; }
                    .dark-btn { background-color: #00b894 !important; color: #ffffff !important; }
                    .dark-divider { border-color: #333333 !important; }
                }
            </style>
        </head>
        <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f4f6f8;" class="dark-bg">
            <center style="width: 100%; background-color: #f4f6f8;" class="dark-bg">
            
            <!-- Visually Hidden Preheader -->
            <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
                New registration: {{name}} ({{email}}) joined JIVAN.
            </div>

            <!-- Email Body -->
            <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto;" class="email-container">
                
                <!-- Spacing -->
                <tr><td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td></tr>

                <!-- Logo Section -->
                <tr>
                    <td align="center" style="padding-bottom: 24px;">
                        <div class="anim-fade-up">
                            <span style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-weight: 800; font-size: 20px; color: #1f2937; letter-spacing: -0.02em;" class="dark-text">
                                JIVAN<span style="color: #00b894;">.</span> <span style="font-weight: 400; color: #9ca3af; font-size: 16px;">| Admin</span>
                            </span>
                        </div>
                    </td>
                </tr>

                <!-- Main Card -->
                <tr>
                    <td>
                        <div class="anim-fade-up anim-delay-1">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7;" class="dark-card">
                            
                            <!-- Status Bar -->
                            <tr>
                                <td style="background-color: #ebfcf5; padding: 12px 30px; border-bottom: 1px solid #e1f7ed;" class="dark-card dark-divider">
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td valign="middle">
                                                <span style="display: inline-block; width: 8px; height: 8px; background-color: #00b894; border-radius: 50%; margin-right: 8px;"></span>
                                                <span style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; color: #00b894; text-transform: uppercase; letter-spacing: 0.5px;">New Signup</span>
                                            </td>
                                            <td align="right" valign="middle">
                                                <span style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; color: #6b7280;" class="dark-subtext">{{date}}</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <tr>
                                <td style="padding: 40px;" class="p-mobile">
                                    
                                    <!-- Headline -->
                                    <h2 style="margin: 0 0 24px 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600; color: #111827; letter-spacing: -0.01em;" class="dark-text">
                                        A new user has just registered.
                                    </h2>

                                    <!-- User Data Grid -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        
                                        <!-- Name Field -->
                                        <tr>
                                            <td style="padding-bottom: 16px;">
                                                <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;" class="dark-label">
                                                    Name
                                                </div>
                                                <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; color: #111827; background-color: #f9fafb; padding: 12px 16px; border-radius: 6px; border: 1px solid #f3f4f6;" class="dark-value">
                                                    ${name}
                                                </div>
                                            </td>
                                        </tr>

                                        <!-- Email Field -->
                                        <tr>
                                            <td style="padding-bottom: 24px;">
                                                <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;" class="dark-label">
                                                    Email Address
                                                </div>
                                                <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 16px; color: #111827; background-color: #f9fafb; padding: 12px 16px; border-radius: 6px; border: 1px solid #f3f4f6;" class="dark-value">
                                                    <a href="mailto:{{email}}" style="color: inherit; text-decoration: none;">${to}</a>
                                                </div>
                                            </td>
                                        </tr>

                                    </table>

                                    <!-- Action Button -->
                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                        <tr>
                                            <td style="padding-top: 10px;">
                                                <!--[if mso]>
                                                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="#" style="height:44px;width:160px;v-text-anchor:middle;" arcsize="10%" stroke="f" fillcolor="#111827">
                                                <w:anchorlock/>
                                                <center>
                                                <![endif]-->
                                                <a href="#" style="background-color: #111827; border-radius: 6px; color: #ffffff; display: inline-block; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500; line-height: 44px; text-align: center; text-decoration: none; width: 100%; -webkit-text-size-adjust: none; transition: background-color 0.2s;" class="dark-btn">
                                                    View User Profile
                                                </a>
                                                <!--[if mso]>
                                                </center>
                                                </v:roundrect>
                                                <![endif]-->
                                            </td>
                                        </tr>
                                    </table>

                                </td>
                            </tr>
                        </table>
                        </div>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="padding: 30px; text-align: center;">
                        <div class="anim-fade-up anim-delay-2">
                            <p style="margin: 0; font-family: 'Inter', Helvetica, Arial, sans-serif; font-size: 12px; line-height: 18px; color: #9ca3af;" class="dark-subtext">
                                This is an automated notification from JIVAN Admin System.<br>
                                &copy; ${new Date().getFullYear()} JIVAN Medical.
                            </p>
                        </div>
                    </td>
                </tr>

            </table>
            
            <!-- Spacing -->
            <div style="height: 40px; line-height: 40px;">&nbsp;</div>
            
            </center>
        </body>
    </html>`;
};

// ==========================================
// 3. MAIN FUNCTION
// ==========================================

/**
 * Sends an email with dynamic subject and template selection.
 * * @param {string} to - Recipient email
 * @param {string} subject - Email subject line
 * @param {string} htmlContent - The raw HTML body content/message
 * @param {string} senderRole - 'admin' | 'super-admin' (Determines UI)
 */
async function sendEmail(to, subject, name, otp, senderRole = 'admin') {

    let finalHtml;

    // 1. Select Structure based on Role
    if (senderRole === 'super-admin') {
        // Super admin gets the dark, authoritative high-priority template
        finalHtml = getSuperAdminTemplate(to, name);
    } else {
        // Standard admin gets the clean, white consumer-facing template
        finalHtml = getAdminTemplate(name, otp);
    }

    const mailOptions = {
        from: `"${BRAND_CONFIG.name} Alerts" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: finalHtml
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[${senderRole.toUpperCase()}] Email sent:`, info.response);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

module.exports = {
    sendEmail
};