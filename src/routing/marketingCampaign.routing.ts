import express, { Request, Response } from 'express';
import MarketingCampaign from '../schemas/marketingCampaign/MarketingCampaign.schema';
import User from '../schemas/User/User';

const router = express.Router();

// List all campaigns
router.get('/', async (req: Request, res: Response) => {
  try {
    const campaigns = await MarketingCampaign.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
});

// Get companies (admins) for campaign assignment
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const activeAdmins = await User.find({ is_active: true, role: 'admin' }).populate('company');
    const companies = activeAdmins.map((admin: any) => {
      return {
        label: admin.company?.companyName || admin.name,
        value: admin.company?._id || admin._id
      };
    }).filter(c => c.value);
    
    // Deduplicate
    const uniqueCompanies = Array.from(new Map(companies.map(item => [item.value.toString(), item])).values());
    
    res.status(200).json({ success: true, data: uniqueCompanies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
});

// Create a new campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const { templateName, scheduledDates, audience, company } = req.body;
    
    if (!templateName || !scheduledDates || !Array.isArray(scheduledDates) || scheduledDates.length === 0) {
      return res.status(400).json({ success: false, message: 'templateName and at least one scheduledDate are required' });
    }

    const existingCampaign = await MarketingCampaign.findOne({ templateName: { $regex: new RegExp(`^${templateName.trim()}$`, 'i') } });
    if (existingCampaign) {
      return res.status(400).json({ success: false, message: 'A campaign with this template name already exists' });
    }

    const campaign = new MarketingCampaign({
      templateName,
      scheduledDates,
      audience: audience || ['patient'],
      company: company || []
    });

    await campaign.save();
    res.status(201).json({ success: true, data: [campaign] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a campaign
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { templateName, scheduledDates, audience, company } = req.body;
    
    if (!templateName || !scheduledDates || !Array.isArray(scheduledDates) || scheduledDates.length === 0) {
      return res.status(400).json({ success: false, message: 'templateName and at least one scheduledDate are required' });
    }

    const existingCampaign = await MarketingCampaign.findOne({ 
      templateName: { $regex: new RegExp(`^${templateName.trim()}$`, 'i') },
      _id: { $ne: id }
    });

    if (existingCampaign) {
      return res.status(400).json({ success: false, message: 'A campaign with this template name already exists' });
    }

    const updatedCampaign = await MarketingCampaign.findByIdAndUpdate(
      id,
      { templateName, scheduledDates, audience: audience || ['patient'], company: company || [] },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedCampaign });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a campaign
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await MarketingCampaign.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
});

export default router;
