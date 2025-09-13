import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async(req,res)=>{
      //get user details
      //validation-not empty
      //check if already exists:username or email
      //check for images or avatar
      //upload to cloudinary,avatar
      //create user object-create entry in db
      //remove password and refresh token feild from response
      //check for user creation
      //return res 
      const {fullName,email,username,password}=req.body
      console.log("email: ",email);
      
      
  
})
export {registerUser,}