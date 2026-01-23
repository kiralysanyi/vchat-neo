interface Participant {
    nickname: string,
    producerTransportId: string,
    cameraStream?: MediaStream,
    microphoneStream?: MediaStream,
    screenStream?: MediaStream,
    screenAudioStream?: MediaStream,
    self?: boolean
}

export type { Participant };