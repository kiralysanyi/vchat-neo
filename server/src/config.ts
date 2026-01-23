import { config } from "dotenv";
config();

const PORT = process.env.PORT ? process.env.PORT : "8080"
const LISTEN_IPS = process.env.LISTEN_IPS ? process.env.LISTEN_IPS.split(";") : ["127.0.0.1"] 

console.log("Config: ", PORT, LISTEN_IPS)

export {PORT, LISTEN_IPS}