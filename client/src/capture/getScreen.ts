const getScreen = async (fps?: number): Promise<MediaStream | null> => {
    if (!fps) {
        fps = 15
    }
    console.log("Capture with fps: ", fps)
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: false,
                autoGainControl: false,
                noiseSuppression: false,
                channelCount: 2
            }, video: {
                frameRate: fps
            }
        });
        return stream;
    } catch (error) {
        console.error("Error capturing screen:", error);
        return null;
    }
}

const checkScreenSupport = () => {
    if (navigator.mediaDevices.getDisplayMedia == undefined) {
        return false
    } else {
        return true
    }
}

export { getScreen, checkScreenSupport };