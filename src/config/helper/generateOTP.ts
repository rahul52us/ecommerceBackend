import axios from "axios";

//generate otp
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtp = async (recipientNumber : string, otp : string) => {
    try
    {
      if(true){
        return {
          status : 'success',
          data : true
        }
      }
      else {
        const response = await axios.get(`https://2factor.in/API/V1/dca053f2-d8b9-11ef-8b17-0200cd936042/SMS/${recipientNumber}/${otp}/OTP1`)
        return {
          status : 'success',
          data : response
        }
      }
    }
    catch(err : any)
    {
      return {
        status : 'error',
        data : err.message
      }
    }
  }