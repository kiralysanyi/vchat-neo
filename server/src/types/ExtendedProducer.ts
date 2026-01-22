import { Producer } from "mediasoup/node/lib/types";

interface ExtendedProducer {
    transportId: string,
    producers: Record<number, Producer>
}

export type {ExtendedProducer}