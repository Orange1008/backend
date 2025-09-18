import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"
import { error } from "console";

const generateAccessAndRefreshTokens=async(userId)=>{
   try {
      const user=await User.findById(userId)
      const accessToken=user.generateAccessToken()
      const refreshToken=user.generateRefreshToken()
      user.refreshToken=refreshToken
      await user.save({validateBeforeSave:false})
      return {accessToken,refreshToken}
   } catch (error) {
      throw new ApiError(500,"Something went wrong while generating refresh and access token")
      
   }
}
const registerUser = asyncHandler(async(req,res)=>{
      // res.status(200).json({
      // message:"first post request"
      // })
      // get user details
      // validation-not empty
      // check if already exists:username or email
      // check for images or avatar
      // upload to cloudinary,avatar
      // create user object-create entry in db
      // remove password and refresh token field from response
      // check for user creation
      // return res 
      console.log("FILES RECEIVED:", req.files);
console.log("BODY RECEIVED:", req.body);

      const {fullName,email,username,password}=req.body
      console.log("email:",email);
      // if(fullName===""){
      //       throw new ApiError(400,"fullname is required")
      // }
      if([fullName,email,username,password].some((field)=>field?.trim()==="")) {
            throw new ApiError(400,"All field are required")
      }

      const existedUser= await User.findOne({
            $or:[{username},{email}]
      })

      if(existedUser){
         throw new ApiError(409,"User with email or password already exists")
      }
      
      const avatarLocalPath=req.files?.avatar[0]?.path;
      //const coverImageLocalPath=req.files?.coverImage[0]?.path;

      let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


      if(!avatarLocalPath){
         throw new ApiError(400,"Avatar file is required")
      }
      
      const avatar= await uploadOnCloudinary(avatarLocalPath)
      const coverImage=await uploadOnCloudinary(coverImageLocalPath)
   if(!avatar){
      throw new ApiError(400,"Avatar is required")
   }
    const user= await User.create({
      fullName,
      avatar:avatar.url,
      coverImage:coverImage?.url||"",
      email,
      password,
      username:username

   })
  const createdUser=await User.findById(user._id).select(
      "-password -refreshToken"
  )

  if(!createdUser){
      throw new ApiError(500,"Something went wrong while registering user")
   }

   return res.status(201).json(
      new ApiResponse(200,createdUser,"User registerd succesfully")
   )
})



const logInUser=asyncHandler(async(req,res)=>{
//req body->data
//username or email
//find the user
//password check
//access and refresh token
//send cookie
const{email,username,password}=req.body
if(!(username||email)){
   throw new ApiError(400,"username or email is required")
}
   const user=await User.findOne({
      $or:[{username},{email}]
   })
if(!user){
   throw new ApiError(404,"User does not exists")
}
const isPasswordValid=await user.isPasswordCorrect(password)
if(!isPasswordValid){
   throw new ApiError(401,"Username or password is invalid")
}
const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
const option={
   httpOnly:true,
   secure:true
}
return res
.status(200)
.cookie("accessToken",accessToken,option)
.cookie("refreshToken",refreshToken,option)
.json(
   new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},
      "User logged In Successfully"
   )
)

})




const logOutUser=asyncHandler(async(req,res)=>{
User.findByIdAndUpdate(
   req.user._id,{
$set:{
   refreshToken:undefined
}
   },
   {
      new:true
   }
)
const option={
   httpOnly:true,
   secure:true
}
return res
.status(200)
.clearCookie("accessToken",option)
.clearCookie("refreshToken",option)
.json(new ApiResponse(200,{},"User logged out"))
})


const refreshAccessToken =asyncHandler(async(req,res)=>{
  const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken
  if(!incomingRefreshToken){
   throw new ApiError(401,"Unauthorized request")
  }
  try {
   const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 const user=await User.findById(decodedToken?._id)
 if(!user){
    throw new ApiError(401,"Invalid refresh token")
   }
   if(incomingRefreshToken!=user?.refreshToken){
    throw new ApiError(401,"Refresh token is expired or used")
   }
   const option={
    httpOnly:true,
    secure:true
   }
   const{accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
   return res
   .status(200)
   .cookie("accessToken",accessToken,option)
   .cookie("refreshToken",newrefreshToken,option)
   .json(
    new ApiResponse(
       200,
       {accessToken,refreshToken:newrefreshToken},
       "Access token refreshed successfully"
 
    )
   )
 
  } catch (error) {
   throw new ApiError(401,error?.message||
      "Invalid refresh token"
   )
   
  }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
    throw new ApiError(401,"Invalid old password")
   }
   user.password=newPassword
   await user.save({validateBeforeSave:false})
   return res
   .status(200)
   .json(new ApiResponse(
      200,
      {},
      "password changed succesfully"
   ))
})
const getCurrentUser=asyncHandler(async(req,res)=>{
   return res
   .status(200)
   .json(200,req.user,"Current user fetched succesfully")
})

const updtateAccountDetails=asyncHandler(async(req,res)=>{
   const {fullName,email}=req.body
   if(!(fullName||email)){
      throw new ApiError(400,"All feilds are required")
   }
   const user=await User.findByIdAndUpdate(req.user?._id,{
      $set:{
         fullName,
         email:email
      }
   },{new:true}).select("-password")
   return res
   .status(400)
   .json(new ApiResponse(200,user,"Account details updated succesfully "))
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
   const avatarLocalPath=req.file?.path
   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is missing")
   }
   const avatar=await uploadOnCloudinary(avatarLocalPath)
   if(!avatar){
      throw new ApiError(400,"Error while uploading on avatar")
   }
   const user=await User.findByIdAndUpdate(req.user?._id,{
      $set:{
         avatar:avatar.url
      }
   },{new:true}).select("-password")
   return res
   .status(200)
   .json(
      new ApiResponse(200,user,"Avatar image updated successfully")
   )
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
   const CoverImageLocalPath=req.file?.path
   if(!CoverImageLocalPath){
      throw new ApiError(400,"Cover Image file is missing")
   }
   const coverImage=await uploadOnCloudinary(CoverImageLocalPath)
   if(!coverImage){
      throw new ApiError(400,"Error while uploading coverImage")
   }
   const user=await User.findByIdAndUpdate(req.user?._id,{
      $set:{
         coverImage:coverImage.url
      }
   },{new:true}).select("-password")
   return res
   .status(200)
   .json(
      new ApiResponse(200,user,"Cover image updated successfully")
   )
})

export {registerUser,logInUser,logOutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updtateAccountDetails,updateUserAvatar,updateUserCoverImage}