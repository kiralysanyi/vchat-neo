import checkDevice from "./checkDevice"

const getMicrophone = async (): Promise<MediaStream | null> => {
    const saved = localStorage.getItem("sad");
    if (saved == null || saved == "null") {
        throw new Error("No device config found!")
    }
    const deviceId = JSON.parse(saved).deviceId;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                autoGainControl: true,
                noiseSuppression: true,
                deviceId: { exact: deviceId }
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