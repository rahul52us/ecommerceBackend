import express from "express";
import authenticate from "../modules/config/authenticate";
import {
  createUserservice,
  getCountDesignationStatusService,
  getTotalUsersService,
  updateUserProfileService,
  updateDocumentService,
  updateCompanyDetailsService,
  getUserRoleUser,
  getManagersEmploysService,
  getManagerUsersCountsService,
  getUserInfoWithManagerService,
  getUserInfoWithManagerActionService,
  updatePermissionsService,
  updateStaffPermissionsService,
  getManagersOfUserService,
  getRoleCountOfCompanyService,
  getCompanyDetailsByIdService,
  getCompanyDetailsByUserIdService,
  getAllUserService,
  getUserByNameService,
  deleteUserService,
  createAdminUserservice,
  getReferredPatientsService,
  updateAdminProfileService,
  updateAdminStatusService,
  updateAdminPasswordService,
  updateUserPasswordService,
  updatePersonalDetailsService
} from "../services/employe/user.service";

const router = express.Router();

router.post("/create", authenticate, createUserservice);
router.post("/admin/create", authenticate, createAdminUserservice);
router.put("/admin/profile/:id", authenticate, updateAdminProfileService);
router.put("/admin/status/:id", authenticate, updateAdminStatusService);
router.put("/admin/password/:id", authenticate, updateAdminPasswordService);
router.put("/password/:id", authenticate, updateUserPasswordService);
router.put("/personal-details/:id", authenticate, updatePersonalDetailsService);
router.put("/profile/:id", authenticate, updateUserProfileService);
router.delete("/profile/:id", authenticate, deleteUserService);
router.get('/details/:id',authenticate,getCompanyDetailsByIdService)
router.get("/:_id", getUserByNameService);
router.get('/companydetails/:id',authenticate,getCompanyDetailsByUserIdService)
router.post("/", authenticate, getAllUserService);
router.get("/managers/:id", authenticate, getManagersEmploysService);
router.post("/total/count", authenticate, getTotalUsersService);
router.get("/designation/count", authenticate, getCountDesignationStatusService);
router.put('/companyDetails/:id',authenticate,updateCompanyDetailsService)
router.put('/updateDocuments/:id',authenticate,updateDocumentService)
router.put('/permissions/:id',authenticate,updatePermissionsService)
router.put('/update-permissions/:id',authenticate,updateStaffPermissionsService)
router.get('/users/roles',authenticate,getUserRoleUser)
router.post('/managers/Users/count',authenticate,getManagerUsersCountsService)
router.post('/info/Subordinate',getUserInfoWithManagerService)
router.get('/info/Subordinate/:id',getUserInfoWithManagerActionService)
router.get('/getManagers/:userId', getManagersOfUserService)
router.get('/get/roles/count',authenticate,getRoleCountOfCompanyService)
router.get('/referred-patients/:id', authenticate, getReferredPatientsService)

export default router;