import { useEffect, useRef } from "react"

const StreamPlayer = ({ stream, volume }: { stream: MediaStream, volume?: number }) => {
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

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume ? volume : 1
        }
    }, [volume, audioRef]);

    return <div className={`player ${type == "audio" && "hidden"}`}>
        {type == "video" && <video autoPlay ref={videoRef}></video>}
        {type == "audio" && <audio autoPlay ref={audioRef}></audio>}
    </div>
}

export default StreamPlayer