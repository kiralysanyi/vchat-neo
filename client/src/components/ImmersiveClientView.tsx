import { ArrowsPointingInIcon, ArrowsPointingOutIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import StreamPlayer from "./StreamPlayer";
import type { Participant } from "../types/Participant";
import { useEffect, useRef, useState } from "react";

interface PropsType {
    cameraStream: MediaStream | null,
    nickname: string | null,
    participants: Record<string, Participant>,
    getStreamRef: React.RefObject<((transportId: string, payloadId: number, onClose: Function) => Promise<{
        stream: MediaStream;
        close: Function;
    }>) | undefined>,
    closeRef: React.RefObject<{
        closeVid: Function | undefined;
        closeAudio: Function | undefined;
    }>
}

const ImmersiveClientView = ({ cameraStream, nickname, participants, getStreamRef, closeRef }: PropsType) => {
    const [selectedP, setSelectedP] = useState<string>();
    const [viewedStream, setViewedStream] = useState<MediaStream>();
    const [sAudioStream, setSAudioStream] = useState<MediaStream>();
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null)

    // show/hide audio controls on mouse move
    useEffect(() => {
        let timeout: number;
        const onMove = () => {
            timeout != undefined && clearTimeout(timeout);
            setShowControls(true);
            timeout = setTimeout(() => {
                setShowControls(false);
            }, 2000);
        };
        window.addEventListener("mousemove", onMove);

        return () => {
            window.removeEventListener("mousemove", onMove);
        }
    }, [])

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

    return <>
        {/* Streams / participants */}
        <div className="immersive-view" ref={elementRef}>
            <div className="participant-view" style={{ height: (isFullscreen && !showControls && viewedStream) ? "100%" : "70%" }}>
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
            <div className={`${(viewedStream != undefined && !showControls && isFullscreen) ? "opacity-0" : "opacity-100"} participants-bar`}>
                <div className="participant-preview">
                    {cameraStream && <StreamPlayer stream={cameraStream} />}
                    <span className="name">{nickname} (You)</span>
                </div>
                {Object.values(participants).map(p => (
                    <div key={p.producerTransportId} className="participant-preview" onClick={() => { viewParticipant(p.producerTransportId) }}>
                        {p.cameraStream && <StreamPlayer stream={p.cameraStream} />}
                        {p.streaming && <span onClick={(e) => {
                            e.stopPropagation();
                            viewStream(p)
                        }} className="view">
                            <ComputerDesktopIcon width={28} height={28} />
                        </span>}
                        <span className="name">{p.nickname}</span>
                        <span className="options"></span>
                    </div>
                ))}
            </div>
        </div></>
}

export default ImmersiveClientView;