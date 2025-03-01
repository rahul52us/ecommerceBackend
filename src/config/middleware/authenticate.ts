import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { generateError, handleErrorMessage } from "../function";
import User from "../../schemas/User";

dotenv.config();

const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw generateError("Unauthorized User: No token provided", 401);
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY!!) as { userId: string };

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw generateError("Unauthorized User: User not found", 401);
    }

    if (!user.isActive) {
      throw generateError("Unauthorized User: Account is inactive", 403);
    }

    req.userId = decoded.userId;
    req.bodyData = user.toObject();

    next();
  } catch (err: any) {
    const error = generateError(`Authentication Error: ${err.message}`, err.status || 401);
    const errorMessage = await handleErrorMessage(error.message, error.data, error.statusCode, false);
    return res.status(error.statusCode).json(errorMessage);
  }
};

export default authenticate;
