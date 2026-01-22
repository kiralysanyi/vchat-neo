import { Socket } from "socket.io";

interface ExtendedSocket extends Socket {
    transportId?: string,
    detachConsumer?: () => void,
    detachProducer?: () => void
}

export type {ExtendedSocket}