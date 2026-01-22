const getCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({audio: false, video: true})
    return stream;
}

export default getCamera;