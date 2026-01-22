import { Socket } from "socket.io";

interface ExtendedSocket extends Socket {
    transportId?: string
}

export type {ExtendedSocket}