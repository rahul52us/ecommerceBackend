import cron from 'node-cron';
import Appointment from '../schemas/appointments/appointments.schema';
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

// Check for upcoming appointments (8 hours from now)
const checkUpcomingAppointments = async () => {
  try {
    console.log("Checking for appointments 8 hours from now...");
    const now = new Date();
    
    // 8 hours from now
    const targetStart = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    // 8 hours and 15 minutes from now
    const targetEnd = new Date(now.getTime() + (8 * 60 + 15) * 60 * 1000);

    // Get the date strings for the target appointmentDate
    const startOfDay = new Date(targetStart.getFullYear(), targetStart.getMonth(), targetStart.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Query for scheduled appointments
    const appointments = await Appointment.find({
      status: 'scheduled',
      appointmentDate: { $gte: startOfDay, $lt: endOfDay }
    }).populate('patient').populate('primaryDoctor').populate('company');

    for (const appt of appointments) {
      if (!appt.startTime) continue;

      // Extract hours and minutes from 24-hour format (e.g. "14:30")
      const [hoursStr, minutesStr] = appt.startTime.split(":");
      if (!hoursStr || !minutesStr) continue;

      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);

      const appointmentTimestamp = new Date(appt.appointmentDate);
      appointmentTimestamp.setHours(hours, minutes, 0, 0);

      // Check if the appointment time falls within our 15-minute window 8 hours from now
      if (appointmentTimestamp >= targetStart && appointmentTimestamp < targetEnd) {
        const patient: any = appt.patient;
        const doctor: any = appt.primaryDoctor;
        const company: any = appt.company;

        if (patient && patient.mobileNumber) {
          const patientName = patient.name || 'Patient';
          // Format date as DD-MMM-YYYY (e.g. 18-Jul-2026) to match the strict WhatsApp template approval
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const day = appointmentTimestamp.getDate().toString().padStart(2, '0');
          const month = months[appointmentTimestamp.getMonth()];
          const year = appointmentTimestamp.getFullYear();
          const dateStr = `${day}-${month}-${year}`;
          // Format time into a friendly 12-hour AM/PM string for the WhatsApp message
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          const friendlyTimeStr = `${displayHours.toString().padStart(2, '0')}:${minutesStr} ${period}`;

          const params = `${patientName},${dateStr},${friendlyTimeStr}`;
          console.log(`[Cron] Sending reminder to ${patientName} at ${patient.mobileNumber} for ${friendlyTimeStr}`);
          await sendWhatsAppReminder(patient.mobileNumber, params, 'appointment_reminder');
        }
      }
    }
  } catch (error) {
    console.error("Error in checkUpcomingAppointments cron:", error);
  }
};

export const initCronJobs = () => {
  // Run every 15 minutes in the background
  cron.schedule('*/15 * * * *', () => {
    checkUpcomingAppointments();
  });
  console.log("CRON jobs initialized. System will send reminders 8 hours before appointments.");
};
