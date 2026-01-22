import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import config from "../config";
import { DataContext } from "../providers/DataProvider";
import getCamera from "../capture/getCamera";
import getMicrophone from "../capture/getMicrophone";

const Join = () => {
    const [meetingInfo, setMeetingInfo] = useState<{ id: string, participants: Record<string, {}> } | null>(null)
    const params = useParams();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const navigate = useNavigate();

    const {
        cameraStream,
        setCameraStream,
        microphoneStream,
        setMicrophoneStream,
        joined,
        setJoined
    } = useContext(DataContext)

    useEffect(() => {
        fetch(config.serverUrl + "/api/meeting/" + params.id, { method: "GET", headers: { "Content-Type": "application/json" } }).then(async (res) => {
            if (res.status == 200) {
                const info = await res.json();
                setMeetingInfo(info)
            }
        })
    }, [])

    const join = () => {
        if (setJoined) {
            setJoined(true)
            navigate("/meeting/" + params.id)
        }
    }

    const toggleCamera = () => {
        if (cameraStream) {
            //disable
            cameraStream.getTracks().forEach(track => track.stop())
            if (setCameraStream) {
                setCameraStream(null)
            }
        } else {
            // enable
            getCamera().then((stream) => {
                if (setCameraStream) {
                    setCameraStream(stream)
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }

    const toggleMicrophone = () => {
        if (microphoneStream) {
            //disable
            microphoneStream.getTracks().forEach(track => track.stop())
            if (setMicrophoneStream) {
                setMicrophoneStream(null)
            }
        } else {
            // enable
            getMicrophone().then((stream) => {
                if (setMicrophoneStream) {
                    setMicrophoneStream(stream)
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }

    return <div className="page">
        <div className="mx-auto my-auto flex flex-row gap-4">
            <div className="flex flex-col gap-4">
                <h1>{params.id}</h1>
                {meetingInfo ? <span>Participants: {Object.keys(meetingInfo.participants).length}</span> : ""}
                <div className="flex flex-row gap-4">
                    <button onClick={toggleCamera}>{cameraStream ? "Disable Camera" : "Enable camera"}</button>
                    <button onClick={toggleMicrophone}>{microphoneStream ? "Disable Microphone" : "Enable Microphone"}</button>
                </div>
                <button onClick={join}>Join</button>
            </div>
            <video ref={videoRef} autoPlay className="bg-black" width={400} height={300}></video>
        </div>
    </div>
}

export default Join;