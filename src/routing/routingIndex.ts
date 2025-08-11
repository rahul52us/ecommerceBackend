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

const importRoutings = (app: any) => {
  app.use("/api/auth", userRouting);
  app.use('/api/contact',contactRouting)
  app.use('/api/notification',notificationRouting)
  app.use('/api/file',fileRouting)
  app.use('/api/dashboard',dashboardRouting)
  app.use('/api/booking',bookingRouting)
  app.use('/api/appointments',bookAppointmentRouting)
  app.use("/api/company", companyOrganisation);
  app.use("/api/User", UserRouting);
  app.use('/api/token',tokenRouting);
  app.use("/api/testimonial", testimonialRouting);
  app.use("/api/event", eventRouting);
  app.use("/api/blog", blogRouting);
  app.use("/api/student", StudentRouting);
  app.use("/api/trip", TripRouting);
};

export default importRoutings;