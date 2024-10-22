import { User } from "../models/user.model.js";
import jwt from 'jsonwebtoken';

export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized request - no token found" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized request - invalid token" });
    }

    req.user = user; 
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized request - error in token verification", error: error.message });
  }
};