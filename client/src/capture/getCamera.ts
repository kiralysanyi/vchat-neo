import checkDevice from "./checkDevice"

const getCamera = async (): Promise<MediaStream | null> => {
    return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then((stream) => {
            resolve(stream)
        }).catch(() => {
            resolve(null)
        })
    })
}

const checkCamera = async () => {
    const data = await checkDevice()
    return data.hasVideoDevice;
}

export {getCamera, checkCamera};