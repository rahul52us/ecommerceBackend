import express from "express";
import authenticate from "../../modules/config/authenticate";
import { 
  createDealerItemservice, 
  createDealerService, 
  deleteDealerItem, 
  deleteDealerService, 
  getDealerItems, 
  getDealerServices, 
  updateDealerService, 
  updateDealerLineItems 
} from "../../services/dealer/dealer.service";

const dealerRouting = express.Router();
dealerRouting.post("/create", authenticate, createDealerService);
dealerRouting.put("/:id", authenticate, updateDealerService);
dealerRouting.post('/item/create', authenticate, createDealerItemservice);
dealerRouting.post("/get", authenticate, getDealerServices);
dealerRouting.post("/items/get", authenticate, getDealerItems);
dealerRouting.put('/item/:id', authenticate, updateDealerLineItems);
dealerRouting.delete('/:id', authenticate, deleteDealerService);
dealerRouting.delete('/item/:id', authenticate, deleteDealerItem);

export default dealerRouting;
