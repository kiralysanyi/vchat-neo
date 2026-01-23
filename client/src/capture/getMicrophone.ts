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

export default getMicrophone;