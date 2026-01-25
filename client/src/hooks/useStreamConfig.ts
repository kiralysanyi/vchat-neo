import { useEffect, useState } from "react";

const useStreamConfig = () => {
    const [loaded, setLoaded] = useState(false)
    const [fps, setFps] = useState<number>(30);
    const [codec, setCodec] = useState<"vp8" | "vp9" | "av1" | "h264" | string>("vp9");
    const [highBitrate, setHighBitrate] = useState(false)

    // load from localstorage
    useEffect(() => {
        const savedFps = localStorage.getItem("fps");
        const savedCodec = localStorage.getItem("codec");
        const savedHighBitrate = localStorage.getItem("highBitrate");


        if (savedFps) setFps(parseInt(savedFps))
        if (savedCodec) { setCodec(savedCodec) }
        if (savedHighBitrate) { setHighBitrate(savedHighBitrate == "true") }

        setLoaded(true)
    }, [])


    // save changes
    useEffect(() => {
        if (!loaded) {
            return;
        }

        localStorage.setItem("fps", fps.toString())
        localStorage.setItem("codec", codec)
        localStorage.setItem("highBitrate", `${highBitrate}`)
    }, [loaded, fps, codec, highBitrate])

    return {
        fps, setFps,
        codec, setCodec,
        highBitrate,
        setHighBitrate
    }
}

export default useStreamConfig;