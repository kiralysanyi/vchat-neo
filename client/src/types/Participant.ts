interface Participant {
    nickname: string,
    producerTransportId: string,
    cameraStream?: MediaStream,
    microphoneStream?: MediaStream,
    screenStream?: MediaStream,
    screenAudioStream?: MediaStream,
    self?: boolean,
    streaming?: boolean,
    streamingAudio?: boolean,
    volume?: number
}

export type { Participant };