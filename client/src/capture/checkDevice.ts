const checkDevice = async (): Promise<{ hasAudioDevice: boolean, hasVideoDevice: boolean }> => {
    let hasVideoDevice = false;
    let hasAudioDevice = false;

    if (navigator.mediaDevices.getUserMedia == undefined) {
        return {
            hasAudioDevice,
            hasVideoDevice
        }
    }

    if (navigator.mediaDevices.enumerateDevices == undefined) {
        return {
            hasAudioDevice,
            hasVideoDevice
        }
    }

    const devInfo = await navigator.mediaDevices.enumerateDevices()

    devInfo.forEach((info) => {
        if (info.kind == "videoinput" && !hasVideoDevice) {
            hasVideoDevice = true
        }

        if (info.kind == "audioinput" && !hasAudioDevice) {
            hasAudioDevice = true
        }
    })

    return {
        hasAudioDevice,
        hasVideoDevice
    }
}

export default checkDevice;