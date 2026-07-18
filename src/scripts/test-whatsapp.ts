import * as dotenv from "dotenv";
dotenv.config();

const sendWhatsAppReminder = async (
  phone: string,
  params: string,
  templateName: string = 'appointment_reminder'
) => {
  try {
    const user = process.env.BHASH_SMS_USER;
    const pass = process.env.BHASH_SMS_PASS;
    const sender = process.env.BHASH_SMS_SENDER;

    if (!user || !pass || !sender) {
      console.error("Missing BhashSMS credentials in environment variables.");
      return;
    }

    const url = new URL('https://bhashsms.com/api/sendmsgutil.php');
    url.searchParams.append('user', user);
    url.searchParams.append('pass', pass);
    url.searchParams.append('sender', sender);
    url.searchParams.append('phone', phone);
    url.searchParams.append('text', templateName);
    url.searchParams.append('priority', 'wa');
    url.searchParams.append('stype', 'normal');
    url.searchParams.append('Params', params);

    const response = await fetch(url.toString(), { method: 'GET' });
    const responseText = await response.text();
    console.log(`WhatsApp reminder sent to ${phone}. Response: ${responseText}`);
  } catch (error) {
    console.error(`Failed to send WhatsApp reminder to ${phone}:`, error);
  }
};

// sendWhatsAppReminder(
//     '8120758780',
//     'Rahul,18-Jul-2026,04:00 PM',
//     'appointment_reminder'
// ).then(() => {
//     console.log("Done");
//     process.exit(0);
// });
