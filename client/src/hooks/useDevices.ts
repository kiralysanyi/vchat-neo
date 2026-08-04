import { useEffect, useState } from "react"

const useDevices = () => {
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<MediaDeviceInfo | null>(null);
    const [selectedAudioDevice, setSelectedAudioDevice] = useState<MediaDeviceInfo | null>(null);
    const [pastCheck, setPastCheck] = useState(false);
    const [checkError, setCheckError] = useState<string>();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            let nocam = false;
            let nomic = false;
            // initial permission request
            try {
                let stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
                stream.getTracks().forEach(t => t.stop());
            } catch (error) {
                console.error(error);
                nocam = true;
            }


            try {
                let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                stream.getTracks().forEach(t => t.stop());
            } catch (error) {
                console.error(error);
                nomic = true;
            }

            if (nocam == true && nomic == true) {
                setCheckError("No permission");
            }

            setPastCheck(true)
        })()
    }, [])

    useEffect(() => {
        if (loaded) {
            console.log("Saving device config")
            localStorage.setItem("sad", JSON.stringify(selectedAudioDevice));
            localStorage.setItem("svd", JSON.stringify(selectedVideoDevice));
            return;
        }
        console.log("Loading device config")

        const savedAudioDev = localStorage.getItem("sad");
        const savedVideoDev = localStorage.getItem("svd");

        if (savedAudioDev != null && savedAudioDev != "null") {
            try {
                const i = JSON.parse(savedAudioDev);
                setSelectedAudioDevice(i);
                setLoaded(true);
            } catch (error) {
                console.error("Invalid audio device info: ", error);
                setCheckError("Invalid audio device info");
            }
        }

        if (savedVideoDev != null && savedAudioDev != "null") {
            try {
                const i = JSON.parse(savedVideoDev);
                setSelectedVideoDevice(i);
                setLoaded(true);
            } catch (error) {
                console.error("Invalid video device info: ", error)
                setCheckError("Invalid video device info");
            }
        }

        setLoaded(true);
    }, [loaded, selectedAudioDevice, selectedVideoDevice])

    useEffect(() => {
        if (!pastCheck) {
            return;
        }

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
    }, [pastCheck])

    return { videoDevices, audioDevices, selectedAudioDevice, selectedVideoDevice, setSelectedAudioDevice, setSelectedVideoDevice, pastCheck, checkError }
}

export default useDevices