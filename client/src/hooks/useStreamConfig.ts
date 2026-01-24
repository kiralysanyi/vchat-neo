import { useEffect, useState } from "react";

const useStreamConfig = () => {
    const [loaded, setLoaded] = useState(false)
    const [fps, setFps] = useState<number>(30);
    const [codec, setCodec] = useState<"vp8" | "vp9" | "av1" | "h264" | string>("vp9");

    // load from localstorage
    useEffect(() => {
        const savedFps = localStorage.getItem("fps");
        const savedCodec = localStorage.getItem("codec");

        if (savedFps) setFps(parseInt(savedFps))
        if (savedCodec) { setCodec(savedCodec) }

        setLoaded(true)
    }, [])


    // save changes
    useEffect(() => {
        if (!loaded) {
            return;
        }

        localStorage.setItem("fps", fps.toString())
        localStorage.setItem("codec", codec)
    }, [loaded, fps, codec])

    return {
        fps, setFps,
        codec, setCodec
    }
}

export default useStreamConfig;