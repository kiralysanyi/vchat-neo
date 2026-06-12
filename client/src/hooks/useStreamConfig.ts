import { useEffect, useMemo, useState } from "react";
import { isSafari } from "../utils/browser";

const useStreamConfig = () => {
    const [loaded, setLoaded] = useState(false)
    const [fps, setFps] = useState<number>(30);
    const [codec, setCodec] = useState<"VP8" | "VP9" | "AV1" | "AUTO" | string>("AUTO");
    const [highBitrate, setHighBitrate] = useState(false)

    // load from localstorage
    useEffect(() => {
        const savedFps = localStorage.getItem("fps");
        const savedCodec = localStorage.getItem("codec");
        const savedHighBitrate = localStorage.getItem("highBitrate");


        if (savedFps) setFps(parseInt(savedFps))
        if (savedCodec) { setCodec(savedCodec) }
        if (savedHighBitrate) { setHighBitrate(savedHighBitrate == "true") }

        if (isSafari()) {
            setCodec("auto")
        }

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

    return useMemo(() => ({
        fps, setFps,
        codec, setCodec,
        highBitrate,
        setHighBitrate
    }), [fps, codec, highBitrate])
}

export default useStreamConfig;