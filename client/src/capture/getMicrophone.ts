import checkDevice from "./checkDevice"

const getMicrophone = async (): Promise<MediaStream | null> => {
    return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                autoGainControl: true,
                noiseSuppression: true
            }, video: false
        }).then((stream) => {
            resolve(stream)
        }).catch(() => {
            resolve(null)
        })
    })

}

const checkMicrophone = async () => {
    const data = await checkDevice()
    return data.hasAudioDevice;
}

export { getMicrophone, checkMicrophone };