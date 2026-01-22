import { useContext, useEffect, useRef } from "react";
import { DataContext } from "../providers/DataProvider";
import { useNavigate, useParams } from "react-router";

const MeetingClient = () => {
    const { cameraStream, joined } = useContext(DataContext)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        if (!joined) {
            navigate("/meeting/join/" + params.id)
        }
    })

    useEffect(() => {
        if (cameraStream) {
            if (videoRef.current) {
                videoRef.current.srcObject = cameraStream;
            }
        }
    }, [cameraStream])

    return <div className="page">
        <video ref={videoRef} autoPlay></video>
    </div>
}

export default MeetingClient;