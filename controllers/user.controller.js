import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../cloudinary.js";


const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // console.log("refreshToken ",refreshToken)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error(
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = async (req, res) => {
  // console.log('Received file:', req.file); 
  const { name, email, password } = req.body;
  if ([name, email, password].some((field) => field.trim() === "")) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existedUser = await User.findOne({ email });
  if (existedUser) {
    return res.status(400).json({ error: "User with email already exists" });
  }
  let profilePhotoLocalPath;
    if (req.file && req.file.path) {
      profilePhotoLocalPath = req.file.path;
    }
  if (!profilePhotoLocalPath) {
    return res.status(400).json({ error: "Profile is required" });
  }
  const profilePhoto = await uploadOnCloudinary(profilePhotoLocalPath);
  // console.log(profilePhotoLocalPath)
  // console.log(profilePhoto.url ," url")
  const user = await User.create({
    name,
    email,
    password,
    profilePhoto: profilePhoto?.url || "",
    isActive: true,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    return res
      .status(400)
      .json({ error: "Something went wrong while registering the user" });
  }

  return res
    .status(201)
    .json({ message: "User registered successfully", createdUser });
}

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User does not exist" });
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res.status(400).json({ error: "Invalid user credentials" });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      message: "User logged in Successfully",
      user: loggedInUser,
      accessToken,
      refreshToken,
    });
};

const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
        isActive: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ message: "User logged out" });
};


const refreshAccessToken = async (req, res) => {
  // console.log(req.cookies)
  const incomingRefreshToken =
    req.cookies.refreshToken ;
  // console.log(incomingRefreshToken)
  if (!incomingRefreshToken) {
    return res.status(401).json({ error: "Unauthorized request" });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    // console.log(user)

    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res
        .status(401)
        .json({ error: "Refresh token is expired or used" });
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json({ message: "Access token refreshed", accessToken, refreshToken: newRefreshToken });

  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token !" });
  }
};

const changeCurrentPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    return res.status(400).json({ error: "Invalid old password" });
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ message: "Password changed successfully" });
};

const updateAccountDetails = async (req,res) => {
  const {name,email} = req.body
  if(!name || !email){
      return res.status(400).json({error: "All fields are required"})
  }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set: {
              name,
              email
          }
      },
      {new:true}
  ).select("-password")

  return res
  .status(200)
  .json({message:"Account details updated successfully",user})
}

const deleteUser = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const userId = req.params.id; 

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong while deleting the user" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const users = await User.find().select("-password -refreshToken");
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong while retrieving users" });
  }
};

export {
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  registerUser,
  deleteUser,
  getAllUsers
};
