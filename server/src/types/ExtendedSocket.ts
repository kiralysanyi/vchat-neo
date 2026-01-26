import { Socket } from "socket.io";

interface ExtendedSocket extends Socket {
    transportId?: string,
    meetid?: string,
    joinState?: "joined" | "preparing" | "idle",
    detachConsumer?: () => void,
    detachProducer?: () => void
}

export type {ExtendedSocket}