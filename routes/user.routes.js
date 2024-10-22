import { Router } from "express";
import { registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,updateAccountDetails,deleteUser,getAllUsers } from "../controllers/user.controller.js";
import { upload } from '../middleware/multer.middleware.js'
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()
router.route('/register').post(upload.single('profilePhoto'),registerUser)
router.route('/login').post(loginUser)   
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route("/change-password").patch(verifyJWT,changeCurrentPassword)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/:id").delete(verifyJWT,deleteUser)
router.route("/getUserDetails").get(verifyJWT,getAllUsers)


export default router