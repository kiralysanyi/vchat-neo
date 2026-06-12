import checkDevice from "./checkDevice"

const getCamera = async (): Promise<MediaStream | null> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false, video: {
                width: { max: 1280, ideal: 1280, min: 800 },
                height: { max: 720, ideal: 720, min: 600 },
                frameRate: { exact: 15, ideal: 15, max: 15 }
            }
        });
        return stream;
    } catch (error) {
        console.error("Error accessing the camera: ", error);
        return null;
    }
}

const checkCamera = async () => {
    const data = await checkDevice()
    return data.hasVideoDevice;
}

export { getCamera, checkCamera };