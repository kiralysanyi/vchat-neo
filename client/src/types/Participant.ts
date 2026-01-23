interface Participant {
    nickname: string,
    producerTransportId: string,
    cameraStream?: MediaStream,
    microphoneStream?: MediaStream,
    screenStream?: MediaStream,
    screenAudioStream?: MediaStream,
    self?: boolean,
    streaming?: boolean
}

export type { Participant };