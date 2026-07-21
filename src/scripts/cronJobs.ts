import cron from 'node-cron';
import Appointment from '../schemas/appointments/appointments.schema';
import RecallAppointment from '../schemas/recall-appointment/recallAppointment.schema';
import User from '../schemas/User/User';
import Company from '../schemas/company/Company';

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

// We have removed checkUpcomingAppointments as per your request to only send at 7:00 AM daily.


// Send morning reminders for all of today's appointments
const sendTodayReminders = async () => {
  try {
    console.log("Sending morning reminders for today's appointments...");
    const now = new Date();

    // Get the start and end of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Query for scheduled appointments
    const appointments = await Appointment.find({
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
        console.log(`[Cron Morning] Sending reminder to ${patientName} at ${patient.mobileNumber} for ${friendlyTimeStr}`);
        await sendWhatsAppReminder(patient.mobileNumber, params, 'appointment_reminder');
      }
    }
  } catch (error) {
    console.error("Error in sendTodayReminders cron:", error);
  }
};

// Send morning reminders for today's recalls
const sendTodayRecalls = async () => {
  try {
    console.log("Sending morning reminders for today's recalls...");
    const now = new Date();
    
    // Get the start and end of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Query for scheduled recalls (using 'pending' status by default, adjust if needed)
    const recalls = await RecallAppointment.find({
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

        // Note: You may need to change 'recall_reminder' to the actual BhashSMS template name
        // and adjust the params list according to what the template expects.
        const params = `${patientName},${dateStr}`;
        console.log(`[Cron Morning] Sending recall reminder to ${patientName} at ${patient.mobileNumber}`);
        await sendWhatsAppReminder(patient.mobileNumber, params, 'recall_reminder');
      }
    }
  } catch (error) {
    console.error("Error in sendTodayRecalls cron:", error);
  }
};

export const initCronJobs = () => {
  // Run every day at 7:00 AM
  cron.schedule('0 7 * * *', () => {
    sendTodayReminders();
    sendTodayRecalls();
  });

  console.log("CRON jobs initialized. System will send reminders at 7:00 AM for today's appointments and recalls.");
};
