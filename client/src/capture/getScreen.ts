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

const checkScreenSupport = () => {
    if (navigator.mediaDevices.getDisplayMedia == undefined) {
        return false
    } else {
        return true
    }
}

export {getScreen, checkScreenSupport};