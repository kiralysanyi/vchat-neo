const getScreen = async (): Promise<MediaStream | null> => {
    return new Promise((resolve) => {
        navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false,
                channelCount: 2
            }, video: true
        }).then((stream) => {
            resolve(stream)
        }).catch(() => {
            resolve(null)
        })
    })
}

export default getScreen;