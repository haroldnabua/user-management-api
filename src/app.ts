import express from "express";
import userRoutes from "./routes/user.routes";
import { initializeAppDataSource } from "./data-source";
import { errorHandler } from "./middleware/error-handler";

const app = express();
const port = 3000;

app.use(express.json());

initializeAppDataSource()
    .then(() => {
        console.log("Database connected");
        
        app.use('/users', userRoutes);
        app.use(errorHandler);

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    })
    .catch(error => {
        console.log("Database connection failed", error);
    });