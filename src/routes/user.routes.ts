import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/Users";
import { validateUserRequest } from "../middleware/validate-request";
import * as bcrypt from 'bcrypt';

const router = Router();
const userRepository = AppDataSource.getRepository(User);

router.post('/', validateUserRequest, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firstname, lastname, middlename, email, password } = req.body;
        
        const user = userRepository.create({ firstname, lastname, middlename, email, password });
        await userRepository.save(user);
        
        res.status(201).json({
            ...user,
            password: user.password
        });
    } catch (error) {
        next(error);
    }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userRepository.find();
        res.json(users); // Returns all users with hashed passwords
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: "Invalid user ID" });
        
        const user = await userRepository.findOneBy({ id });
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.json(user);
    } catch (error) {
        next(error);
    }
});

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

router.put('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const { firstname, lastname, middlename, email, password } = req.body;

        const userToUpdate = await userRepository.findOneBy({ id });
        if (!userToUpdate) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update only provided fields
        userToUpdate.firstname = firstname ?? userToUpdate.firstname;
        userToUpdate.lastname = lastname ?? userToUpdate.lastname;
        userToUpdate.middlename = middlename ?? userToUpdate.middlename;
        userToUpdate.email = email ?? userToUpdate.email;

        if (password) {
            userToUpdate.password = await bcrypt.hash(password, 10); // Hash the updated password
        }

        await userRepository.save(userToUpdate);
        res.status(200).json({ message: "User updated successfully", user: userToUpdate });
    } catch (error) {
        next(error);
    }
});



export default router;