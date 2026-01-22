import { Participant } from "./Participant"

interface Meeting {
    id: string,
    participants: Record<string, Participant>,
    description?: string
}

export type { Meeting }