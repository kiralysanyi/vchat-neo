import checkDevice from "./checkDevice"

const getMicrophone = async (): Promise<MediaStream | null> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                autoGainControl: true,
                noiseSuppression: true
            }, video: false
        });
        return stream;
    } catch (error) {
        console.error("Error accessing microphone:", error);
        return null;
    }
}

const checkMicrophone = async () => {
    const data = await checkDevice()
    return data.hasAudioDevice;
}

export { getMicrophone, checkMicrophone };