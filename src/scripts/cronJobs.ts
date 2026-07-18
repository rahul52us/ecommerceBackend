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

    // Get today's and tomorrow's date strings to query by appointmentDate
    const startOfDay = new Date(targetStart.getFullYear(), targetStart.getMonth(), targetStart.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Query for scheduled appointments
    const appointments = await Appointment.find({
      status: 'scheduled',
      appointmentDate: { $gte: startOfDay, $lt: endOfDay }
    }).populate('patient').populate('primaryDoctor').populate('company');

    for (const appt of appointments) {
      if (!appt.startTime) continue; // Skip if no start time

      // Parse startTime (assuming HH:MM AM/PM format)
      // e.g. "10:30 AM" or "02:00 PM"
      const [timeMatch, time, modifier] = appt.startTime.match(/(\d+:\d+)\s*(AM|PM)/i) || [];
      if (!timeMatch) continue;

      let [hours, minutes] = time.split(':').map(Number);
      if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;

      const appointmentTimestamp = new Date(appt.appointmentDate);
      appointmentTimestamp.setHours(hours, minutes, 0, 0);

      // Check if the appointment time falls within our 15-minute window 8 hours from now
      if (appointmentTimestamp >= targetStart && appointmentTimestamp < targetEnd) {
        const patient: any = appt.patient;
        const doctor: any = appt.primaryDoctor;
        const company: any = appt.company;

        if (patient && patient.mobileNumber) {
          const patientName = patient.name || 'Patient';
          const dateStr = appointmentTimestamp.toISOString().split('T')[0];
          const timeStr = appt.startTime;
          
          const doctorName = doctor ? doctor.name : 'Doctor';
          const companyName = company ? company.name || company.companyName : 'Clinic';
          
          const params = `${patientName},${dateStr},${timeStr},${doctorName},${companyName}`;
          await sendWhatsAppReminder(patient.mobileNumber, params, 'appointment_reminder');
        }
      }
    }
  } catch (error) {
    console.error("Error in checkUpcomingAppointments cron:", error);
  }
};

// Export the init function to start the cron
export const initCronJobs = () => {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    checkUpcomingAppointments();
  });
  console.log("CRON jobs initialized.");
};
