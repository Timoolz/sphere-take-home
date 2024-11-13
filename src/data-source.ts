import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Currencies, Rates, Transfers } from './entities';
import dotenv from 'dotenv';



dotenv.config();
const isDev = process.env.NODE_ENV === 'development';

const SqlDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME, // Database should already be created on server
  synchronize: true, // Automatically synchronize schema (Ideally should be set to false for production  and generate migrations manually)
  logging: isDev,  
  entities: [
    Rates,
    Currencies,
    Transfers,  
  ],
  subscribers: [],
  migrations: [],
});

export default SqlDataSource;
