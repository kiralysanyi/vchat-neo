import { ArrowsPointingInIcon, ArrowsPointingOutIcon, CameraIcon, ChevronDownIcon, ChevronUpIcon, Cog6ToothIcon, ComputerDesktopIcon, MicrophoneIcon, PhoneArrowDownLeftIcon } from "@heroicons/react/24/outline";
import StreamPlayer from "./StreamPlayer";
import type { Participant } from "../types/Participant";
import { useEffect, useRef, useState } from "react";
import { checkScreenSupport } from "../capture/getScreen";
import { useNavigate } from "react-router";
import { checkCamera } from "../capture/getCamera";
import { checkMicrophone } from "../capture/getMicrophone";

interface PropsType {
    cameraStream: MediaStream | null,
    microphoneStream: MediaStream | null,
    screenStream: MediaStream | null,
    nickname: string | null,
    participants: Record<string, Participant>,
    getStreamRef: React.RefObject<((transportId: string, payloadId: number, onClose: Function) => Promise<{
        stream: MediaStream;
        close: Function;
    }>) | undefined>,
    closeRef: React.RefObject<{
        closeVid: Function | undefined;
        closeAudio: Function | undefined;
    }>,
    toggleCamera: () => void,
    toggleMicrophone: () => void,
    toggleScreen: () => void,
    setParticipants: React.Dispatch<React.SetStateAction<Record<string, Participant>>>
}

const ImmersiveClientView = ({ cameraStream, microphoneStream, screenStream, nickname, participants, getStreamRef, closeRef, toggleCamera, toggleMicrophone, toggleScreen, setParticipants }: PropsType) => {
    const [selectedP, setSelectedP] = useState<string>();
    const [viewedStream, setViewedStream] = useState<MediaStream>();
    const [sAudioStream, setSAudioStream] = useState<MediaStream>();
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    const [expandedView, setExpandedView] = useState(false);
    const [configuredP, setConfiguredP] = useState<Participant>();

    const navigate = useNavigate();

    // check devices

    const [hasAudio, setHasAudio] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);

    useEffect(() => {
        checkCamera().then((has) => {
            setHasVideo(has);
        })

        checkMicrophone().then((has) => {
            setHasAudio(has);
        })
    }, [])

    const [autoHide, setAutoHide] = useState(true);

    // show/hide audio controls on mouse move
    useEffect(() => {
        let timeout: number;
        const onMove = () => {
            timeout != undefined && clearTimeout(timeout);
            if (autoHide == false) {
                setShowControls(true);
            } else {
                setShowControls(true);
                timeout = setTimeout(() => {
                    setShowControls(false);
                }, 2000);
            }
        };
        window.addEventListener("mousemove", onMove);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener("mousemove", onMove);
        }
    }, [autoHide])

    const closeStream = () => {
        if (closeRef.current.closeVid) {
            closeRef.current.closeVid();
        }

        if (closeRef.current.closeAudio) {
            closeRef.current.closeAudio();
        }
    }

    useEffect(() => {
        if (Object.keys(participants).length > 0 && selectedP == undefined) {
            setSelectedP(Object.keys(participants)[0])
        }
    }, [participants])

    // Close stream viewer connection on layout switch
    useEffect(() => {
        closeStream();
        return () => {
            closeStream();
        }
    }, [])

    //handle fullscreen
    const goFullscreen = () => {
        elementRef.current?.requestFullscreen();
        setIsFullscreen(true)
    }

    const leaveFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        setIsFullscreen(false);
    }

    const toggleFullscreen = () => {
        isFullscreen ? leaveFullscreen() : goFullscreen();
    }

    useEffect(() => {
        return () => leaveFullscreen();
    }, [])

    const viewParticipant = (id: string) => {
        closeStream();
        setSelectedP(id);
        setViewedStream(undefined)
    }

    const viewStream = (p: Participant) => {
        closeStream();
        if (p.streaming == true && getStreamRef.current != undefined) {
            // get screen video
            getStreamRef.current(p.producerTransportId, 3, () => {
                // onclose
                setViewedStream(undefined)
                leaveFullscreen();
            }).then(({ stream, close }) => {
                closeRef.current.closeVid = close
                setViewedStream(stream)
                setSelectedP(p.producerTransportId);
            })

            // get screen audio

            if (p.streamingAudio == true) {
                getStreamRef.current(p.producerTransportId, 4, () => {
                    setSAudioStream(undefined)
                }).then(({ stream, close }) => {
                    closeRef.current.closeAudio = close
                    setSAudioStream(stream);
                })
            }
        }
    }

    const toggleExpandedView = () => {
        setExpandedView(!expandedView);
    }

    return <>
        {/* Streams / participants */}
        <div className="immersive-view" ref={elementRef}>
            {/* Play audio */}
            {Object.values(participants).map(p => (
                p.microphoneStream && <StreamPlayer volume={p.volume} key={p.producerTransportId} stream={p.microphoneStream} />
            ))}
            <div className="participant-view" onMouseEnter={() => setAutoHide(true)} style={{ height: (isFullscreen && !showControls && viewedStream) ? "100%" : "calc(80% - 5rem)" }}>
                {!viewedStream && (selectedP && participants[selectedP]) && ((participants[selectedP].cameraStream) && <StreamPlayer stream={participants[selectedP].cameraStream} />)}
                {viewedStream && <StreamPlayer stream={viewedStream} />}
                {(sAudioStream && showControls) && <div className="audio-control">
                    <input type="range" onChange={(ev) => setVolume(parseFloat(ev.target.value))} value={volume} max={1} min={0} step={0.1} />
                </div>}
                {(viewedStream && showControls) && <button className="fscreen-btn" onClick={toggleFullscreen}>
                    {!isFullscreen ? <ArrowsPointingOutIcon width={20} height={20} /> : <ArrowsPointingInIcon width={20} height={20} />}
                </button>}
                {sAudioStream && <StreamPlayer stream={sAudioStream} volume={volume} />}
            </div>
            <div className={`
                ${(viewedStream != undefined && !showControls && isFullscreen) ? "opacity-0" : "opacity-100"}
                participants-bar
                ${expandedView && "expanded-preview"}
                `} onMouseEnter={() => { setAutoHide(false) }} onMouseLeave={() => setAutoHide(true)}>
                <div className="expand-btn" onClick={toggleExpandedView}>
                    {expandedView ? <ChevronDownIcon width={24} height={24} /> : <ChevronUpIcon width={24} height={24} />}
                </div>
                <div className="participant-preview">
                    {cameraStream && <StreamPlayer stream={cameraStream} />}
                    <span className="name">{nickname} (You)</span>
                </div>
                {Object.values(participants).map(p => (
                    <div key={p.producerTransportId} className="participant-preview"
                        onMouseEnter={() => { setAutoHide(false) }} onMouseLeave={() => setAutoHide(true)}
                        onClick={() => { viewParticipant(p.producerTransportId); setExpandedView(false) }}>
                        {p.cameraStream && <StreamPlayer stream={p.cameraStream} />}
                        {p.streaming && <span onClick={(e) => {
                            e.stopPropagation();
                            viewStream(p)
                        }} className="view">
                            <ComputerDesktopIcon width={28} height={28} />
                        </span>}
                        <span className="name">{p.nickname}</span>
                        <span className="options" onClick={() => {
                            setConfiguredP(p);
                        }}>
                            <Cog6ToothIcon width={28} height={28} />
                        </span>
                    </div>
                ))}
            </div>
            {/* Dock */}
            <div className={`dock ${(isFullscreen && !showControls) && "dock-hidden"}`}
                onMouseEnter={() => { setAutoHide(false) }} onMouseLeave={() => setAutoHide(true)}
            >
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
        {configuredP && <div className="participant-options">
            <div className="settings-modal">
                <h1>Options for: {configuredP?.nickname}</h1>
                <div className="form-group">
                    <label htmlFor="vol">Volume</label>
                    <input value={configuredP.volume} onChange={(e) => {
                        if (configuredP) {
                            const newData = { ...participants };
                            newData[configuredP.producerTransportId].volume = parseFloat(e.target.value);
                            setParticipants(newData);
                        }
                    }} type="range" step={0.1} min={0} max={1} id="vol" name="vol" />
                </div>
                <button onClick={() => {
                    setConfiguredP(undefined);
                }}>Close</button>
            </div>
        </div>}
    </>
}

export default ImmersiveClientView;