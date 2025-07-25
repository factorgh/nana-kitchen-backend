import { Shippo } from "shippo";
import dotenv from "dotenv";
dotenv.config();

const shippoClient   = new Shippo({apiKeyHeader: process.env.SHIPPO_API_KEY_TEST}); 
export default shippoClient;
