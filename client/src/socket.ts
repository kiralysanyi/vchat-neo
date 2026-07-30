import { io } from "socket.io-client";
import config from "./config";

const socket = io(config.serverUrl)

socket.on("auth_error", () => {
    console.error("Socket auth failed!")
})

socket.on("auth_success", () => {
    console.log("Socket authenticated!")
})

socket.on("nickname", (nickname) => {
    localStorage.setItem("nickname", nickname)
})

if (import.meta.env.DEV == true) {
    (window as any).socket = socket;
}

export default socket;