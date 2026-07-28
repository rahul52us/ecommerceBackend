import dotenv from 'dotenv'

dotenv.config()

let baseURL : string
let baseDashURL : string

if(process.env.NODE_ENV === "production"){
    baseURL = process.env.FRONTEND_BASE_PROD_URL || process.env.FRONTEND_BASE_URL || "http://localhost:3000"
    baseDashURL = `${baseURL}/dashboard`
}
else {
    baseURL = process.env.FRONTEND_BASE_DEV_URL || process.env.FRONTEND_BASE_URL || "http://localhost:3000"
    baseDashURL = `${baseURL}/dashboard`
}

export {baseURL, baseDashURL}