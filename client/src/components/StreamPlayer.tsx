import { useEffect, useRef } from "react"

const StreamPlayer = ({ stream, volume }: { stream: MediaStream, volume?: number }) => {
    const type = stream.getTracks()[0].kind
    const videoRef = useRef<HTMLVideoElement>(null)
    const bgRef = useRef<HTMLVideoElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    useEffect(() => {
        if (videoRef.current && bgRef.current) {
            videoRef.current.srcObject = stream;
            bgRef.current.srcObject = stream;
        }
    }, [videoRef, bgRef, stream])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.srcObject = stream;
        }
    }, [audioRef, stream])

    useEffect(() => {
        if (audioRef.current) {
            console.log("Change volume: ", volume)
            audioRef.current.volume = volume != undefined ? volume : 1
        }
    }, [volume, audioRef]);

    return <div className={`player ${type == "audio" && "hidden"}`}>
        {type == "video" && <video className="player-bg" playsInline autoPlay muted ref={bgRef}></video>}
        {type == "video" && <video autoPlay playsInline ref={videoRef}></video>}
        {type == "audio" && <audio autoPlay playsInline ref={audioRef}></audio>}
    </div>
}

export default StreamPlayer