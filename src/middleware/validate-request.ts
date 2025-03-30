import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const validateUserRequest = (req: Request, res: Response, next: NextFunction): void => {
    const schema = Joi.object({
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        middlename: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    });

    const options = {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
    };

    const { error, value } = schema.validate(req.body, options);
    if (error) {
        res.status(400).json({ 
            message: 'Validation error',
            details: error.details.map(d => d.message) 
        });
    } else {
        req.body = value;
        next();
    }
};