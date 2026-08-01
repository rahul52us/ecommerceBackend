export const handleErrorMessage = (message: string, data: any, statusCode: number, success: boolean): Promise<any> => {
    return new Promise((resolve, reject) => {
      resolve({
        message,
        data,
        statusCode,
        success
      });
    });
  };

export const generateError = (message : any, status : number) => {
    let errorMessage = message;
    if (Array.isArray(message) && message.length > 0 && message[0].message) {
        errorMessage = message[0].message;
    } else if (typeof message === "object" && message !== null && message.message) {
        errorMessage = message.message;
    } else if (typeof message === "object" && message !== null) {
        try { errorMessage = JSON.stringify(message); } catch (e) {}
    }
    
    const validationError : any = new Error(errorMessage);
    validationError['data'] = errorMessage
    validationError["statusCode"] = status
    return validationError;
};


export const generateValidationError = (messages: any[], status: number) => {
  const errorData = messages.map(obj => ({
    message: obj.message,
    details: obj.context,
  }));
  const validationError: any = new Error("Validation error");
  validationError["data"] = errorData;
  validationError["statusCode"] = status;
  return validationError;
};
