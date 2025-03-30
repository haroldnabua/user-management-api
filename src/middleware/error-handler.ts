import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): void => {
    if (typeof err === "string") {
        const is404 = err.toLowerCase().endsWith("not found");
        const statusCode = is404 ? 404 : 400;
        res.status(statusCode).json({ message: err });
        return;
    }

    if (err instanceof Error) {
        res.status(500).json({ message: err.message });
        return;
    }

    res.status(500).json({ message: "An unknown error occurred" });
};