import { io } from "socket.io-client";
import config from "./config";

const socket = io(config.serverUrl)

if (import.meta.env.DEV == true) {
    (window as any).socket = socket;
}

export default socket;