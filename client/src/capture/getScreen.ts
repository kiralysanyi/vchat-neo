const getScreen = async (fps?: number): Promise<MediaStream | null> => {
    if (!fps) {
        fps = 15
    }
    console.log("Capture with fps: ", fps)
    return new Promise((resolve) => {
        navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false,
                channelCount: 2
            }, video: {
                frameRate: fps
            }
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