import Joi from "joi";

const UserValidation = Joi.object({
    name: Joi.string()
        .min(3)
        .max(50)
        .pattern(/^[a-zA-Z]+([ '-][a-zA-Z]+)*$/, "alphabets with optional spaces, hyphens, and apostrophes")
        .required()
        .messages({
            "string.min": "Name must have a minimum length of {#limit}",
            "string.max": "Name should not exceed a maximum length of {#limit}",
            "string.pattern.name": "Name can only contain alphabets, spaces, hyphens, and apostrophes",
            "any.required": "Name is required",
        }),
    email: Joi.string()
        .email({ tlds: { allow: true } })
        .min(6)
        .max(254)
        .optional()
        .messages({
            "string.email": "Invalid email format.",
            "string.min": "Email must be at least {#limit} characters long.",
            "string.max": "Email cannot exceed {#limit} characters.",
            "any.required": "Email is required.",
        }),
    mobile_no: Joi.string()
        .regex(/^\+91[6-9]\d{9}$/, "Indian mobile number")
        .required()
        .messages({
            "string.pattern.name": "Invalid Indian mobile number format. Use +91 followed by 10 digits.",
            "any.required": "Mobile number is required.",
        }),
    pic: Joi.string()
        .uri({ scheme: ["http", "https"] })
        .required()
        .messages({
            "string.uri": "Invalid image URL format. Must start with http:// or https://.",
        }),
    gender: Joi.string()
        .valid("male", "female", "others")
        .insensitive()
        .trim()
        .optional()
        .messages({
            "any.only": "Invalid gender. Must be one of 'male', 'female', or 'others'.",
            "string.empty": "Gender cannot be empty if provided.",
        }),
    bio: Joi.string()
        .min(5)
        .max(200)
        .trim()
        .optional()
        .messages({
            "string.min": "Bio must have a minimum length of {#limit} characters.",
            "string.max": "Bio cannot exceed a maximum length of {#limit} characters.",
            "string.empty": "Bio cannot be empty if provided.",
        }),
    is_active: Joi.boolean()
        .default(false)
        .messages({
            "boolean.base": "is_active must be a boolean value (true or false).",
        }),
    type: Joi.string()
        .valid("user", "admin", "super-admin")
        .insensitive()
        .default("user")
        .trim()
        .required()
        .messages({
            "any.only": "Invalid type. Must be one of 'user', 'admin' or 'vendor'.",
            "any.required": "Type is required.",
        }),
    password: Joi.string()
        .min(8)
        .max(50)
        .pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            "password"
        )
        .trim()
        .optional()
        .messages({
            "string.min": "Password must have a minimum length of {#limit}.",
            "string.max": "Password cannot exceed a maximum length of {#limit}.",
            "string.pattern.name":
                "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
            "any.required": "Password is required.",
        }),
});

export { UserValidation };