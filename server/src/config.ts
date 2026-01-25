import { config } from "dotenv";
config();

const PORT = process.env.PORT ? process.env.PORT : "8080"
const LISTEN_IPS = process.env.LISTEN_IPS ? process.env.LISTEN_IPS.split(";") : ["127.0.0.1"]
const WORKERS = process.env.WORKERS ? parseInt(process.env.WORKERS) : 1
const SERVERPASS = process.env.SERVERPASS ? process.env.SERVERPASS : undefined
const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL ? parseInt(process.env.CLEANUP_INTERVAL) : 60

console.log("Config: ", PORT, LISTEN_IPS, WORKERS)

export { PORT, LISTEN_IPS, WORKERS, SERVERPASS, CLEANUP_INTERVAL }