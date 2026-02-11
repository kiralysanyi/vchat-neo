import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import config from "../config";
import { DataContext } from "../providers/DataProvider";
import { checkCamera, getCamera } from "../capture/getCamera";
import { checkMicrophone, getMicrophone } from "../capture/getMicrophone";

const Join = () => {
    const [meetingInfo, setMeetingInfo] = useState<{ id: string, participants: Record<string, {}> } | null>(null)
    const params = useParams();
    document.title = "Join - " + params.id;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const navigate = useNavigate();

    const {
        cameraStream,
        setCameraStream,
        microphoneStream,
        setMicrophoneStream,
        setJoined,
        setNickname
    } = useContext(DataContext)

    const [newNickname, setNewNickname] = useState("");

    const [hasAudio, setHasAudio] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);

    const [newMeet, setNewMeet] = useState(false);
    const [password, setPassword] = useState("");

    const [error, setError] = useState<string>()
    const [serverPass, setServerPass] = useState("");
    const [authNeeded, setAuthNeeded] = useState(false);

    useEffect(() => {
        const savedNickname = localStorage.getItem("nickname");
        if (savedNickname) {
            setNewNickname(savedNickname)
        }

        fetch(config.serverUrl + "/api/meeting/" + params.id, { method: "GET", headers: { "Content-Type": "application/json" } }).then(async (res) => {
            if (res.status == 200) {
                const info = await res.json();
                setMeetingInfo(info)
            } else {
                setNewMeet(true);
                // check if auth needed
                fetch(config.serverUrl + "/api/needsauth", { method: "GET", headers: { "Content-type": "application/json" } }).then(async (res) => {
                    let data = await res.json()
                    if (data.required == true) {
                        setAuthNeeded(true)
                    }
                })
            }
        })

        // check device
        checkCamera().then((has) => {
            setHasVideo(has)
        })

        checkMicrophone().then((has) => {
            setHasAudio(has)
        })
    }, [])

    const join = () => {
        if (newNickname.length < 4) {
            setError("Nickname should be at least 4 characters long")
            return;
        }

        localStorage.setItem("nickname", newNickname);

        if (newMeet) {
            const body: Record<string, string> = {}
            if (password.length > 0) {
                body.password = password;
            }

            body.srvPass = serverPass;

            fetch(config.serverUrl + "/api/meeting/" + params.id, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }).then(async (res) => {
                const data = await res.json();
                if (res.status == 201) {
                    //created
                    if (setNickname) {
                        setNickname(newNickname)
                    }

                    if (setJoined) {
                        setJoined(true)
                        navigate("/meeting/client/" + params.id)
                    }
                } else {
                    console.error("Failed to create room", data)
                    if (res.status == 401) {
                        return setError("Wrong server password")
                    }

                    setError(data.error)
                }
            })
        } else {
            if (setNickname) {
                setNickname(newNickname)
            }

            if (setJoined) {
                setJoined(true)
                navigate("/meeting/client/" + params.id)
            }
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

    // password manager workaround, we dont want that garbage here
    const [inpType, setInpType] = useState("text")


    return <div className="page">
        <div className="mx-auto my-auto flex flex-col-reverse gap-4 sm:flex-row">
            <div className="flex flex-col gap-4">
                <h1>{params.id}</h1>
                {error && <span className="bg-red-900 p-3">{error}</span>}
                {meetingInfo ? <span>Participants: {Object.keys(meetingInfo.participants).length}</span> : ""}
                <div className="flex flex-row gap-4">
                    {hasVideo && <button onClick={toggleCamera}>{cameraStream ? "Disable Camera" : "Enable camera"}</button>}
                    {hasAudio && <button onClick={toggleMicrophone}>{microphoneStream ? "Disable Microphone" : "Enable Microphone"}</button>}
                </div>
                <div className="form-group">
                    <label htmlFor="nickname">Nickname</label>
                    <input type="text" name="nickname" id="nickname" autoComplete="off" value={newNickname} onChange={(ev) => { setNewNickname(ev.target.value) }} />
                </div>
                {newMeet && <div className="form-group">
                    <label htmlFor="password">Set password (leave empty for none)</label>
                    <input value={password} onChange={(ev) => setPassword(ev.target.value)} onFocus={() => setInpType("password")} autoComplete="off" type={inpType} id="password" name="password" placeholder="Password" />
                </div>}
                {authNeeded && <div className="form-group">
                    <label htmlFor="srvPass">Server password (required to create meeting)</label>
                    <input type={inpType} onFocus={() => setInpType("password")} id="srvPass" name="srvPass" autoComplete="off" value={serverPass} onChange={(ev) => setServerPass(ev.target.value)} />
                </div>}
                <button onClick={join}>{newMeet ? "Create" : "Join"}</button>
            </div>
            <video ref={videoRef} autoPlay className="bg-black joinPreview"></video>
        </div>
    </div>
}

export default Join;