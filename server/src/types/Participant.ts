interface Participant {
    nickname: string,
    producerTransportId: string,
    audio: boolean,
    video: boolean,
    sAudio: boolean,
    sVideo: boolean
}

export type {Participant}