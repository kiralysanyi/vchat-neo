import { useEffect, useState } from "react"

const useDevices = () => {
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<MediaDeviceInfo | null>(null);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<MediaDeviceInfo | null>(null);

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (loaded) {
            localStorage.setItem("sad", JSON.stringify(selectedAudioDevice));
            localStorage.setItem("svd", JSON.stringify(selectedVideoDevice));
            return;
        }

        const savedAudioDev = localStorage.getItem("sad");
        const savedVideoDev = localStorage.getItem("svd");

        if (savedAudioDev != null && savedAudioDev != "null") {
            try {
                const i = JSON.parse(savedAudioDev);
                setSelectedAudioDevice(i);
                setLoaded(true);
            } catch (error) {
                console.error("Invalid audio device info: ", error)
            }
        }

        if (savedVideoDev != null && savedAudioDev != "null") {
            try {
                const i = JSON.parse(savedVideoDev);
                setSelectedVideoDevice(i);
                setLoaded(true);
            } catch (error) {
                console.error("Invalid video device info: ", error)
            }
        }

        setLoaded(true);
    }, [loaded, selectedAudioDevice, selectedVideoDevice])

    navigator.mediaDevices.enumerateDevices().then((devinfo) => {
        const audioArray: MediaDeviceInfo[] = [];
        const videoArray: MediaDeviceInfo[] = [];
        for (let i in devinfo) {
            let dev = devinfo[i];
            if (dev.kind == "audioinput") {
                audioArray.push(dev);
            }

            if (dev.kind == "videoinput") {
                videoArray.push(dev)
            }
        }

        setVideoDevices(videoArray);
        setAudioDevices(audioArray);

        if (selectedAudioDevice == null && audioArray.length > 0 && loaded) {
            setSelectedAudioDevice(audioArray[0])
        }

        if (selectedVideoDevice == null && videoArray.length > 0 && loaded) {
            setSelectedVideoDevice(videoArray[0])
        }
    })

    return { videoDevices, audioDevices, selectedAudioDevice, selectedVideoDevice, setSelectedAudioDevice, setSelectedVideoDevice }
}

export default useDevices