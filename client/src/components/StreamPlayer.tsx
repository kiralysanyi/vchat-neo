import { useEffect, useRef } from "react"

const StreamPlayer = ({ stream }: { stream: MediaStream }) => {
    const type = stream.getTracks()[0].kind
    const videoRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [videoRef, stream])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.srcObject = stream;
        }
    }, [audioRef, stream])

    return <div className={`player ${type == "audio" && "hidden"}`}>
        {type == "video" && <video autoPlay ref={videoRef}></video>}
        {type == "audio" && <audio autoPlay ref={audioRef}></audio>}
    </div>
}

export default StreamPlayer