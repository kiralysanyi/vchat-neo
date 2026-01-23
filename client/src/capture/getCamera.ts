const getCamera = async (): Promise<MediaStream | null> => {
    return new Promise((resolve) => {
        navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then((stream) => {
            resolve(stream)
        }).catch(() => {
            resolve(null)
        })
    })
}

export default getCamera;