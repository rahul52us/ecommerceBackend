import userRouting from "./User";
import companyOrganisation from "./company.routing";
import tokenRouting from "./token/token.routing";
import testimonialRouting from "./testimonial";
import blogRouting from "./blog/blog";
import StudentRouting from "./userTypes/student";
import TripRouting from "./trips/trip.routing";
import UserRouting from "./users.routing";
import contactRouting from "./contact.routing";
import fileRouting from "./file.routing";
import bookingRouting from "./bookingDetails/bookingDetails.routing";
import bookAppointmentRouting from "./bookAppointment/bookAppointment";
import dashboardRouting from "./dashboard/dashboard.routing";
import eventRouting from './event/event.routing'
import notificationRouting from './notification/notification.routing'
import labRouting from "./lab/lab.routing";
import masterRouting from "./masters/master.routing";
import doctorAppointmentRouting from "./doctorAppointment/doctorAppointment.routing";
import chairsRouting from "./chairs/chairs.routing";
import treatmentRouting from "./treatment/treatment.routing";
import recallAppointmentRouting from "./recallAppointment/recallAppointment.routing";
import reportRouting from "./reports/reporting.routing";
import dealerRouting from "./dealer/dealer.routing";
import labDoctorRouting from "./labDoctor/labDoctor.routing";
import labWorkRouting from "./labWork/labWork.routing";
import labWorkHierarchyRouting from "./labWork/labWorkHierarchy.routing";
import procedureRouting from "./procedure/procedure.routing";
import labWorkStatusRouting from "./labWork/labWorkStatus.routing";
import workDoneRouting from "./workDone/workDone.routing";
import prescriptionRouting from "./prescription/prescription.routing";


const importRoutings = (app: any) => {
  app.use("/api/auth", userRouting);
  app.use('/api/contact', contactRouting)
  app.use('/api/notification', notificationRouting)
  app.use('/api/file', fileRouting)
  app.use('/api/lab', labRouting)
  app.use('/api/dashboard', dashboardRouting)
  app.use('/api/booking', bookingRouting)
  app.use('/api/appointments', bookAppointmentRouting)
  app.use("/api/company", companyOrganisation);
  app.use("/api/User", UserRouting);
  app.use('/api/token', tokenRouting);
  app.use("/api/testimonial", testimonialRouting);
  app.use("/api/event", eventRouting);
  app.use("/api/blog", blogRouting);
  app.use("/api/student", StudentRouting);
  app.use("/api/trip", TripRouting);
  app.use('/api/masters', masterRouting)
  app.use('/api/doctor/appointment', doctorAppointmentRouting)
  app.use('/api/chairs', chairsRouting);
  app.use('/api/toothTreatment', treatmentRouting)
  app.use('/api/recall-appointment', recallAppointmentRouting)
  app.use('/api/report', reportRouting)
  app.use('/api/dealer', dealerRouting)
  app.use('/api/lab-doctor', labDoctorRouting)
  app.use('/api/lab-work', labWorkRouting)
  app.use('/api/lab-work-hierarchy', labWorkHierarchyRouting)

  app.use('/api/lab-work-status', labWorkStatusRouting)
  app.use('/api/procedure', procedureRouting)
  app.use('/api/workDone', workDoneRouting)
  app.use('/api/prescription', prescriptionRouting)
};


export default importRoutings;