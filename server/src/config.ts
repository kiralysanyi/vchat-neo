import { config } from "dotenv";
import isDev from "./utils/isDev";
config();

const PORT = process.env.PORT ? process.env.PORT : "8080"
const LISTEN_IPS = process.env.LISTEN_IPS ? process.env.LISTEN_IPS.split(";") : ["127.0.0.1"]
const WORKERS = process.env.WORKERS ? parseInt(process.env.WORKERS) : 1
const SERVERPASS = process.env.SERVERPASS ? process.env.SERVERPASS : undefined
const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL ? parseInt(process.env.CLEANUP_INTERVAL) : 60
const ENABLE_API = process.env.ENABLE_API ? process.env.ENABLE_API === "true" : false
const ZITADEL_DOMAIN = process.env.ZITADEL_DOMAIN ? process.env.ZITADEL_DOMAIN : null
const ZITADEL_CLIENT_ID = process.env.ZITADEL_CLIENT_ID ? process.env.ZITADEL_CLIENT_ID : null
const ZITADEL_USE_ROLES = process.env.ZITADEL_USE_ROLES === "true" ? true : false
// this only needed to be specified in dev setups and non container environments
const ROOMSTORE = process.env.ROOMSTORE ? process.env.ROOMSTORE : "/rooms.json"

if (isDev()) {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
}


export { PORT, LISTEN_IPS, WORKERS, SERVERPASS, CLEANUP_INTERVAL, ENABLE_API, ZITADEL_CLIENT_ID, ZITADEL_DOMAIN, ZITADEL_USE_ROLES, ROOMSTORE }