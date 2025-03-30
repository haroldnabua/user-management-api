import { DataSource } from "typeorm";
import { User } from "./entities/Users";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "",
    database: "user_db",
    entities: [User],
    synchronize: true,
    logging: true,
});

// Function to ensure database exists
async function initializeDatabase() {
    try {
        // First connect without specifying the database
        const adminDataSource = new DataSource({
            type: "mysql",
            host: "localhost",
            port: 3306,
            username: "root",
            password: "",
        });

        await adminDataSource.initialize();
        
        // Create database if it doesn't exist
        await adminDataSource.query(`CREATE DATABASE IF NOT EXISTS user_db`);
        await adminDataSource.destroy();
        
        console.log("Database verified/created");
    } catch (error) {
        console.error("Error creating database:", error);
        throw error;
    }
}

// Modified initialize function
export async function initializeAppDataSource() {
    try {
        await initializeDatabase();
        await AppDataSource.initialize();
        console.log("Data Source has been initialized!");
        return AppDataSource;
    } catch (error) {
        console.error("Error during Data Source initialization:", error);
        throw error;
    }
}