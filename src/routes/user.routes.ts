import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/Users";
import { validateUserRequest } from "../middleware/validate-request";
import * as bcrypt from 'bcrypt';
import { Like } from "typeorm";

const router = Router();
const userRepository = AppDataSource.getRepository(User);

// Create a new user
router.post('/', validateUserRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firstname, lastname, middlename, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10); // Securely hash the password
        const user = userRepository.create({ firstname, lastname, middlename, email, password: hashedPassword });
        await userRepository.save(user);

        res.status(201).json({
            ...user,
            password: undefined // Exclude password from the response
        });
    } catch (error) {
        next(error);
    }
});

// List all users with pagination and filtering
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page = 1, limit = 10, firstname, email } = req.query;

        const [users, total] = await userRepository.findAndCount({
            where: {
                ...(firstname ? { firstname: Like(`%${firstname}%`) } : {}),
                ...(email ? { email: Like(`%${email}%`) } : {}),
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        });

        const sanitizedUsers = users.map(({ password, ...rest }) => rest);
        res.json({ users: sanitizedUsers, total, page: Number(page), limit: Number(limit) });
    } catch (error) {
        next(error);
    }
});

// Retrieve a user by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

        const user = await userRepository.findOneBy({ id });
        if (!user) return res.status(404).json({ message: "User not found" });

        const { password, ...sanitizedUser } = user;
        res.json(sanitizedUser);
    } catch (error) {
        next(error);
    }
});

// Verify a user's email and password
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await userRepository.findOneBy({ email });

        if (!user) return res.status(404).json({ message: "User not found" });

        const isValid = await bcrypt.compare(password, user.password);
        res.json({ isValid });
    } catch (error) {
        res.status(500).json({ message: "Error verifying password" });
    }
});

// Delete a user by ID
router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

        const result = await userRepository.delete({ id });
        if (result.affected === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
        next(error);
    }
});

// Update a user's information
router.put('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });

        const { firstname, lastname, middlename, email, password } = req.body;

        const userToUpdate = await userRepository.findOneBy({ id });
        if (!userToUpdate) return res.status(404).json({ message: "User not found" });

        userToUpdate.firstname = firstname ?? userToUpdate.firstname;
        userToUpdate.lastname = lastname ?? userToUpdate.lastname;
        userToUpdate.middlename = middlename ?? userToUpdate.middlename;
        userToUpdate.email = email ?? userToUpdate.email;

        if (password) {
            userToUpdate.password = await bcrypt.hash(password, 10); // Securely hash the updated password
        }

        await userRepository.save(userToUpdate);
        const { password: _, ...sanitizedUser } = userToUpdate;
        res.status(200).json({ message: "User updated successfully", user: sanitizedUser });
    } catch (error) {
        next(error);
    }
});

export default router;
