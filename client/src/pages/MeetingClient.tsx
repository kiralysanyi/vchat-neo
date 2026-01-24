import { useState } from "react";
import { useNavigate } from "react-router";
import { getCamera } from "../capture/getCamera";
import { getMicrophone } from "../capture/getMicrophone";
import type { Participant } from "../types/Participant";
import StreamPlayer from "../components/StreamPlayer";
import { getScreen, checkScreenSupport } from "../capture/getScreen";
import { CameraIcon, ComputerDesktopIcon, MicrophoneIcon, PhoneArrowDownLeftIcon, XCircleIcon } from "@heroicons/react/24/outline";
import useClient from "../hooks/useClient";

const MeetingClient = () => {
    const [streamVolume, setStreamVolume] = useState(1);

    const {
        cameraStream,
        microphoneStream,
        setMicrophoneStream,
        setCameraStream,
        nickname,
        participants, setParticipants,
        connected,
        screenStream, setScreenStream,
        hasAudio, hasVideo,
        viewedParticipant, setViewedParticipant,
        closeRef,
        getStreamRef
    } = useClient();

    const navigate = useNavigate();


    // UI Handlers
    const toggleCamera = async () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => {
                track.stop();
                track.onended ? track.onended(new Event("ended")) : null
            });

            setCameraStream?.(null);
        } else {
            try {
                const stream = await getCamera();
                setCameraStream?.(stream);
            } catch (e) { console.error(e); }
        }
    };

    const toggleMicrophone = async () => {
        if (microphoneStream) {
            microphoneStream.getTracks().forEach((track) => {
                track.stop();
                track.onended ? track.onended(new Event("ended")) : null
            });
            setMicrophoneStream?.(null);
        } else {
            try {
                const stream = await getMicrophone();
                setMicrophoneStream?.(stream);
            } catch (e) { console.error(e); }
        }
    };


    const toggleScreen = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach((track) => {
                track.stop();
                track.onended ? track.onended(new Event("ended")) : null
            })
            setScreenStream(null);
        } else {
            try {
                const stream = await getScreen();
                if (stream) {
                    stream.getVideoTracks()[0].addEventListener("ended", () => {
                        setScreenStream(null)
                    })
                }
                setScreenStream(stream)
            } catch (e) {
                console.error(e)
            }
        }
    }

    const viewStream = (p: Participant) => {
        setStreamVolume(1)
        if (p.streaming == true && getStreamRef.current != undefined) {
            // get screen video
            getStreamRef.current(p.producerTransportId, 3, () => { }).then(({ stream, close }) => {
                closeRef.current.closeVid = close
                setParticipants(prev => {
                    const updated = { ...prev };
                    if (!updated[p.producerTransportId]) return prev; // Guard against unknown participant

                    updated[p.producerTransportId].screenStream = stream

                    return { ...updated };
                });
                setViewedParticipant(p)
            })

            // get screen audio

            getStreamRef.current(p.producerTransportId, 4, () => { }).then(({ stream, close }) => {
                closeRef.current.closeAudio = close
                setParticipants(prev => {
                    const updated = { ...prev };
                    if (!updated[p.producerTransportId]) return prev; // Guard against unknown participant

                    updated[p.producerTransportId].screenAudioStream = stream

                    return { ...updated };
                });
                setViewedParticipant(p)
            })
        }
    }


    return (
        <div className="page flex flex-col">
            <div className="streams-container">
                <div className="participant border p-2">
                    {cameraStream && <StreamPlayer stream={cameraStream} />}
                    <span className="name">{nickname} (You)</span>
                </div>
                {Object.values(participants).map(p => (
                    <div key={p.producerTransportId} className="participant border p-2">
                        {p.cameraStream && <StreamPlayer stream={p.cameraStream} />}
                        {p.microphoneStream && <StreamPlayer stream={p.microphoneStream} />}
                        {p.streaming && <span onClick={() => {
                            viewStream(p)
                        }} className="view">
                            <ComputerDesktopIcon width={32} height={32} />
                        </span>}
                        <span className="name">{p.nickname}</span>
                    </div>
                ))}
            </div>
            {viewedParticipant && <div className="screenviewer">
                <button className="fixed top-0 right-0 z-10 opacity-25" onClick={() => {
                    setViewedParticipant(null)
                    if (closeRef.current.closeVid) {
                        closeRef.current.closeVid()
                    }
                    if (closeRef.current.closeAudio) {
                        closeRef.current.closeAudio()
                    }
                }}>
                    <XCircleIcon width={32} height={32} />
                </button>
                {viewedParticipant.screenStream && <StreamPlayer stream={viewedParticipant.screenStream} />}
                {viewedParticipant.screenAudioStream && <StreamPlayer volume={streamVolume} stream={viewedParticipant.screenAudioStream} />}
            </div>}
            <div className="dock">
                {hasVideo && <button className={cameraStream ? "btn-red" : ""} onClick={toggleCamera}>
                    <CameraIcon width={32} height={32} />
                </button>}
                {hasAudio && <button className={microphoneStream ? "btn-red" : ""} onClick={toggleMicrophone}>
                    <MicrophoneIcon width={32} height={32} />
                </button>}
                {checkScreenSupport() && <button className={screenStream ? "btn-red" : ""} onClick={toggleScreen}>
                    <ComputerDesktopIcon width={32} height={32} />
                </button>}
                <button className="btn-red" onClick={() => {
                    navigate("/")
                }}>
                    <PhoneArrowDownLeftIcon width={32} height={32} />
                </button>
            </div>
        </div>
    );
};

export default MeetingClient;