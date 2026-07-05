import express from "express";
import {
  createCompany,
  createOrganisationCompany,
  filterCompany,
  getCompanyDetails,
  updatedCompanyDetails,
  updateCompanyPreferences,
  updateOrganisationCompany,
  updateCompanyLogo,
  updateCompanySubscription,
  updateCompanySubscriptionHistory,
  getCompanySubscription,
} from "../modules/organisation/Company";
import { getCompanyCountService, getCompanyDetailsByNameService, getCompanyPoliciesService, getHolidayService, getIndividualPolicyService, getOrganisationsCompanyService, getWorkLocationservice, getWorkTimingService, updateCompanyPolicyService, updateHolidayExcelService, updateHolidayService, updateWorkLocationExcelService, updateWorkLocationService, updateWorkTimingService } from "../services/company/company.service";
import authenticate from "../modules/config/authenticate";
const router = express.Router();

router.post("/create", createCompany);
router.post('/update', authenticate, updatedCompanyDetails)
router.post('/updateOperatingHours', authenticate, updateCompanyPreferences)
router.get('/:company', getCompanyDetails)
router.post('/single/create', authenticate, createOrganisationCompany)
router.put('/policy', authenticate, updateCompanyPolicyService)
router.put('/logo', authenticate, updateCompanyLogo)
router.put('/:id', authenticate, updateOrganisationCompany)
router.put('/subscription/update', authenticate, updateCompanySubscription)
router.put('/subscription/history/update', authenticate, updateCompanySubscriptionHistory)
router.get('/subscription/:id', authenticate, getCompanySubscription)
router.get('/count', authenticate, getCompanyCountService)
router.get('/policy', authenticate, getIndividualPolicyService)
router.get('/companies', authenticate, getOrganisationsCompanyService)
router.get("/search", filterCompany);
router.get('/details', getCompanyDetailsByNameService)
router.get('/policies', authenticate, getCompanyPoliciesService)
router.get('/policy/holidays', authenticate, getHolidayService)
router.get('/policy/workLocations', authenticate, getWorkLocationservice)
router.get('/policy/workTiming', authenticate, getWorkTimingService)
router.put('/policy/holidays', authenticate, updateHolidayService)
router.put('/policy/holidays/excel', authenticate, updateHolidayExcelService)
router.put('/policy/workTiming', authenticate, updateWorkTimingService)
router.put('/policy/workLocation', authenticate, updateWorkLocationService)
router.put('/policy/workLocations/excel', authenticate, updateWorkLocationExcelService)

export default router;