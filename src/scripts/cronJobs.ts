import cron from 'node-cron';
import Appointment from '../schemas/appointments/appointments.schema';
import RecallAppointment from '../schemas/recall-appointment/recallAppointment.schema';
import GlobalConfig from '../schemas/globalConfig/GlobalConfig';

// Function to send BhashSMS WhatsApp message
const sendWhatsAppReminder = async (
  phone: string,
  params: string, // e.g. "Rahul,12-Aug,10:00 AM,Dr. Smith,Clinic"
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

// Send reminders for all of today's appointments for a specific company
const sendTodayReminders = async (companyId: any) => {
  try {
    console.log("Sending reminders for today's appointments...");
    const now = new Date();

    // Get the start and end of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Query for scheduled appointments
    const appointments = await Appointment.find({
      company: companyId,
      status: 'scheduled',
      appointmentDate: { $gte: startOfDay, $lt: endOfDay }
    }).populate('patient').populate('primaryDoctor').populate('company');

    for (const appt of appointments) {
      if (!appt.startTime) continue;

      const [hoursStr, minutesStr] = appt.startTime.split(":");
      if (!hoursStr || !minutesStr) continue;

      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      const appointmentTimestamp = new Date(appt.appointmentDate);
      appointmentTimestamp.setHours(hours, minutes, 0, 0);

      const patient: any = appt.patient;

      if (patient && patient.mobileNumber) {
        const patientName = patient.name || 'Patient';
        // Format date as DD-MMM-YYYY
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = appointmentTimestamp.getDate().toString().padStart(2, '0');
        const month = months[appointmentTimestamp.getMonth()];
        const year = appointmentTimestamp.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        // Format time into a friendly 12-hour AM/PM string
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const friendlyTimeStr = `${displayHours.toString().padStart(2, '0')}:${minutesStr} ${period}`;

        const params = `${patientName},${dateStr},${friendlyTimeStr}`;
        console.log(`[Cron Reminder] Sending reminder to ${patientName} at ${patient.mobileNumber} for ${friendlyTimeStr}`);
        await sendWhatsAppReminder(patient.mobileNumber, params, 'appointment_reminder');
      }
    }
  } catch (error) {
    console.error("Error in sendTodayReminders cron:", error);
  }
};

// Send reminders for today's recalls for a specific company
const sendTodayRecalls = async (companyId: any) => {
  try {
    console.log("Sending reminders for today's recalls...");
    const now = new Date();

    // Get the start and end of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Query for scheduled recalls
    const recalls = await RecallAppointment.find({
      company: companyId,
      status: 'pending',
      recallDate: { $gte: startOfDay, $lt: endOfDay }
    }).populate('patient');

    for (const recall of recalls) {
      const patient: any = recall.patient;

      if (patient && patient.mobileNumber) {
        const patientName = patient.name || 'Patient';

        // Format date as DD-MMM-YYYY
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = startOfDay.getDate().toString().padStart(2, '0');
        const month = months[startOfDay.getMonth()];
        const year = startOfDay.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        const params = `${patientName},${dateStr}`;
        console.log(`[Cron Reminder] Sending recall reminder to ${patientName} at ${patient.mobileNumber}`);
        await sendWhatsAppReminder(patient.mobileNumber, params, 'recall_reminder');
      }
    }
  } catch (error) {
    console.error("Error in sendTodayRecalls cron:", error);
  }
};

let currentCronTask: cron.ScheduledTask | null = null;

import Company from '../schemas/company/Company';

export const initCronJobs = async () => {
  if (currentCronTask) {
    currentCronTask.stop();
    console.log("Stopped previous CRON job.");
  }

  currentCronTask = cron.schedule('0,30 * * * *', async () => {
    const now = new Date();
    // Use local time for matching if we assume server timezone is the same as the user timezone
    const currentHourStr = now.getHours().toString().padStart(2, '0');
    const currentMinuteStr = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${currentHourStr}:${currentMinuteStr}`;

    try {
      const activeCompanies = await Company.find({ is_active: true });
      for (const company of activeCompanies) {
        if (company.whatsappConfig?.enabled) {
          const reminderTime = company.whatsappConfig.reminderTime || '07:00';
          if (reminderTime === timeStr) {
            console.log(`[Cron Reminder] Triggering reminders for company ${company.company_name} at ${timeStr}`);
            await sendTodayReminders(company._id);
            await sendTodayRecalls(company._id);
          }
        }
      }
    } catch (error) {
      console.error("Error in per-company reminder cron:", error);
    }
  });

  // CRON Job for cleaning up old database exports (runs daily at midnight)
  cron.schedule('0 0 * * *', () => {
    try {
      const fs = require('fs');
      const path = require('path');
      const downloadsDir = path.join(__dirname, '../../public/downloads');

      if (fs.existsSync(downloadsDir)) {
        console.log(`[Cron Cleanup] Checking for old database exports...`);
        const files = fs.readdirSync(downloadsDir);
        const now = Date.now();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

        files.forEach((file: string) => {
          if (file.endsWith('.zip')) {
            const filePath = path.join(downloadsDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > twoDaysMs) {
              fs.unlinkSync(filePath);
              console.log(`[Cron Cleanup] Deleted old export file: ${file}`);
            }
          }
        });
      }
    } catch (err) {
      console.error("[Cron Cleanup] Error cleaning up old exports:", err);
    }
  });

  console.log(`CRON jobs initialized. System will send reminders based on per-company configuration, and cleanup old exports at midnight.`);
};
