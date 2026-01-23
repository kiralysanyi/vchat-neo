import { Socket } from "socket.io";

interface ExtendedSocket extends Socket {
    transportId?: string,
    meetid?: string,
    detachConsumer?: () => void,
    detachProducer?: () => void
}

export type {ExtendedSocket}