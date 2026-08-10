import userRouting from "./User";
import companyOrganisation from "./company.routing";
import tokenRouting from "./token/token.routing";
import UserRouting from "./users.routing";
import fileRouting from "./file.routing";
import dashboardRouting from "./dashboard/dashboard.routing";
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
import accountabilityRouting from "./accountability/accountability.routing";
import patientDocumentRouting from "./patientDocument/patientDocument.routing";
import doctorInventoryRouting from "./doctorInventory/doctorInventory.routing";
import oldDataRouting from "./oldData/oldData.routing";
import advertisementRouting from "./advertisement.routing";
import paymentRouting from "./payment/payment.routing";
import databaseCloneRouter from "./databaseClone/databaseClone.routing";
import globalConfigRouting from "./globalConfig";
import walletRouting from "./wallet/wallet.route";
import marketingCampaignRouting from "./marketingCampaign.routing";

const importRoutings = (app: any) => {
  app.use("/api/auth", userRouting);
  app.use("/api/advertisement", advertisementRouting);
  app.use('/api/notification', notificationRouting)
  app.use('/api/file', fileRouting)
  app.use('/api/lab', labRouting)
  app.use('/api/dashboard', dashboardRouting)
  app.use("/api/company", companyOrganisation);
  app.use("/api/User", UserRouting);
  app.use('/api/token', tokenRouting);
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
  app.use('/api/accountability', accountabilityRouting)
  app.use('/api/patient-documents', patientDocumentRouting)
  app.use('/api/doctor-inventory', doctorInventoryRouting)
  app.use('/api/old-data', oldDataRouting)
  app.use('/api/payment', paymentRouting)
  app.use('/api/database', databaseCloneRouter)
  app.use('/api/global-config', globalConfigRouting)
  app.use('/api/wallet', walletRouting)
  app.use('/api/marketing-campaign', marketingCampaignRouting)
};


export default importRoutings;