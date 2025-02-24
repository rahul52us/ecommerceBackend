import { Request, Response, NextFunction } from "express";

const createUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        
    } catch (error) {
        next(error);
    }
}

export { 
    createUser
}