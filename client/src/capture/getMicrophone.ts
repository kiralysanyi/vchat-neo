const getMicrophone = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false})
    return stream;
}

export default getMicrophone;