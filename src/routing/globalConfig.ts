import express from 'express';
import { getGlobalConfig, updateGlobalConfig } from '../controller/globalConfig';
import authenticate from '../modules/config/authenticate'; 
import { Request, Response, NextFunction } from 'express';

const router = express.Router();

const checkSuperAdmin = (req: any, res: Response, next: NextFunction) => {
  const user = req.bodyData;
  if (user && (user.role === 'superAdmin' || user.role === 'superadmin' || user.userType === 'superAdmin' || user.userType === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Forbidden. Superadmin access required.' });
  }
};

// Allow all authenticated users to read global config
router.get('/', authenticate, getGlobalConfig);

// Only allow superadmin to update global config
router.put('/', authenticate, checkSuperAdmin, updateGlobalConfig);

export default router;
