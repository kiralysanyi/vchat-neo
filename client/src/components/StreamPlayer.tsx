import { useEffect, useRef } from "react"

const StreamPlayer = ({ stream }: { stream: MediaStream }) => {
    const type = stream.getTracks()[0].kind
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [videoRef, stream])

    return <div className="player">
        {type == "video" ? <video autoPlay ref={videoRef}></video> : ""}
    </div>
}

export default StreamPlayer