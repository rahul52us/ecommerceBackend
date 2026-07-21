import { Request, Response } from 'express';
import GlobalConfig from '../schemas/globalConfig/GlobalConfig';
import { initCronJobs } from '../scripts/cronJobs';
import mongoose from 'mongoose';

export const getGlobalConfig = async (req: Request, res: Response) => {
  try {
    let config = await GlobalConfig.findOne();
    if (!config) {
      config = await GlobalConfig.create({});
    }
    return res.status(200).json({ success: true, data: config });
  } catch (error: any) {
    console.error('Error fetching global config:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateGlobalConfig = async (req: Request, res: Response) => {
  try {
    const { paymentQrCode, globalLogo, cronTime } = req.body;

    let config = await GlobalConfig.findOne();
    if (!config) {
      config = new GlobalConfig({});
    }

    if (paymentQrCode !== undefined) config.paymentQrCode = paymentQrCode;
    if (globalLogo !== undefined) config.globalLogo = globalLogo;
    if (cronTime !== undefined) {
      config.cronTime = cronTime;
    }

    await config.save();

    // Restart cron jobs with new time if it changed
    if (cronTime !== undefined) {
      initCronJobs();
    }

    return res.status(200).json({ success: true, data: config, message: 'Global Config updated successfully' });
  } catch (error: any) {
    console.error('Error updating global config:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
