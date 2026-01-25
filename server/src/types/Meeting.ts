import { Router } from "mediasoup/node/lib/RouterTypes"
import { Participant } from "./Participant"
import { ExtendedProducer } from "./ExtendedProducer"

interface Meeting {
    id: string,
    participants: Record<string, Participant>,
    description?: string,
    router: Router,
    producerTransports: Record<string, ExtendedProducer>,
    password?: string,
    timeout: any
}

export type { Meeting }