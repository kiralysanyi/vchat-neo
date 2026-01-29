import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getCamera } from "../capture/getCamera";
import { getMicrophone } from "../capture/getMicrophone";
import type { Participant } from "../types/Participant";
import StreamPlayer from "../components/StreamPlayer";
import { getScreen, checkScreenSupport } from "../capture/getScreen";
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, CameraIcon, ComputerDesktopIcon, MicrophoneIcon, PhoneArrowDownLeftIcon, SpeakerWaveIcon, UserCircleIcon, UserGroupIcon, XCircleIcon } from "@heroicons/react/24/outline";
import useClient from "../hooks/useClient";
import socket from "../socket";
import useStreamConfig from "../hooks/useStreamConfig";
import getCodecOption from "../utils/getCodecOption";
import useWakeLock from "../hooks/useWakeLock";
import DefaultClientView from "../components/DefaultClientView";
import ImmersiveClientView from "../components/ImmersiveClientView";

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
        hasAudio, hasVideo,
        viewedParticipant, setViewedParticipant,
        closeRef,
        getStreamRef,
        sendStream,
        screenStream, setScreenStream,
        passError, password, setPassword, authenticate
    } = useClient();

    const streamOptions = useStreamConfig();

    const navigate = useNavigate();
    const params = useParams();

    const [showScreenOptions, setShowScreenOptions] = useState(false);


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

    // produce screen stream
    useEffect(() => {
        if (screenStream && sendStream) {
            const vid = screenStream.getVideoTracks()[0]
            const audio = screenStream.getAudioTracks()[0]
            console.log(vid, audio)
            const { codec, codecOptions } = getCodecOption(streamOptions.codec, streamOptions.highBitrate)
            sendStream(new MediaStream([vid]), 3, codec, codecOptions).then(() => {
                console.log("Added screen video")
                socket.emit("addstream", 3)
                if (audio) {
                    sendStream(new MediaStream([audio]), 4, {
                        kind: 'audio',
                        mimeType: 'audio/opus',
                        clockRate: 48000,
                        channels: 2,
                        preferredPayloadType: 111,
                    }, { opusDtx: false, opusFec: true, opusMaxAverageBitrate: 128000, opusNack: true, opusStereo: true }).then(() => {
                        console.log("Added screen audio")

                        socket.emit("addstream", 4)
                    })
                }
            })
        }

        return () => { }
    }, [screenStream, sendStream, streamOptions]);


    const toggleScreen = async () => {
        if (screenStream) {
            screenStream.getTracks().forEach((track) => {
                track.stop();
                track.onended ? track.onended(new Event("ended")) : null
            })
            setScreenStream(null);
        } else {
            setShowScreenOptions(true)
        }
    }

    const startStream = async () => {
        setShowScreenOptions(false)
        try {
            const stream = await getScreen(streamOptions.fps);
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

    const viewStream = (p: Participant) => {
        setStreamVolume(1)
        if (p.streaming == true && getStreamRef.current != undefined) {
            // get screen video
            getStreamRef.current(p.producerTransportId, 3, () => {
                // onclose
                setViewedParticipant(null)
            }).then(({ stream, close }) => {
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

            if (p.streamingAudio == true) {
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
    }

    //hide controls in stream viewer
    const [hideControls, setHideControls] = useState(false)

    useEffect(() => {
        let timeout = setTimeout(() => {
            setHideControls(true)
        }, 3000);

        const onMove = () => {
            clearTimeout(timeout);
            setHideControls(false);
            timeout = setTimeout(() => {
                setHideControls(true)
            }, 3000);
        }

        window.addEventListener("mousemove", onMove);

        return () => {
            window.removeEventListener("mousemove", onMove)
        }
    }, [])

    //wakelock
    useWakeLock();

    //fullscreen viewer
    const viewerRef = useRef<HTMLDivElement>(null)
    const [fullscreen, setFullscreen] = useState(false)

    useEffect(() => {
        if (viewerRef.current) {
            if (fullscreen) {
                viewerRef.current.requestFullscreen()
            } else {
                document.exitFullscreen();
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
    }, [fullscreen])

    const [linkCopied, setLinkCopied] = useState(false)

    const copyLink = () => {
        navigator.clipboard.writeText(location.protocol + "//" + location.host + "/meeting/join/" + params.id)

        setLinkCopied(true);

        setTimeout(() => {
            setLinkCopied(false)
        }, 2000);
    }

    const [immersiveViewEnabled, setImmersiveViewEnabled] = useState(false);

    useEffect(() => {
        setImmersiveViewEnabled(window.innerWidth > 1000)
        const onResize = () => {
            setImmersiveViewEnabled(window.innerWidth > 1000)
        }
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
        }
    });

    return (
        <div className="page flex flex-col">
            {/* Header */}
            <div className="header">
                <span>
                    <UserGroupIcon width={24} height={24} /> {params.id}
                </span>
                <span>
                    <UserCircleIcon width={24} height={24} /> {Object.keys(participants).length + 1}
                </span>
                <button className={`ml-auto ${linkCopied && "btn-green"}`} onClick={copyLink}>Copy link</button>
            </div>
            {/* Play audio */}
            {Object.values(participants).map(p => (
                p.microphoneStream && <StreamPlayer key={p.producerTransportId} stream={p.microphoneStream} />
            ))}

            {/* Participants view */}
            {immersiveViewEnabled && getStreamRef.current ? <ImmersiveClientView closeRef={closeRef} getStreamRef={getStreamRef} nickname={nickname} participants={participants} cameraStream={cameraStream} /> : <DefaultClientView nickname={nickname} participants={participants} viewStream={viewStream} cameraStream={cameraStream} />}
            {/* Screenshare view */}
            {viewedParticipant && <div className="screenviewer" ref={viewerRef}>
                {!hideControls &&
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
                    </button>}
                {viewedParticipant.screenStream && <StreamPlayer stream={viewedParticipant.screenStream} />}
                {viewedParticipant.screenAudioStream && <StreamPlayer volume={streamVolume} stream={viewedParticipant.screenAudioStream} />}
                {!hideControls &&
                    <div className="fixed bottom-0 left-0 p-2 rounded-full bg-black/20 flex flex-row gap-2 align-middle w-full">
                        <SpeakerWaveIcon className="my-auto" width={20} height={20} />
                        <input type="range" min={0} max={1} step={0.1} value={streamVolume} onChange={(ev) => setStreamVolume(parseFloat(ev.target.value))} />
                        <button className="ml-auto" onClick={() => setFullscreen(!fullscreen)}>
                            {!fullscreen ? <ArrowsPointingOutIcon width={20} height={20} /> : <ArrowsPointingInIcon width={20} height={20} />}
                        </button>
                    </div>}
            </div>}

            {/* Dock */}
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

            {/* Screenshare setup */}
            {showScreenOptions && <div className="screenoptions">
                <div className="options-container">
                    <h1>Set up screenshare</h1>
                    <div className="form-group">
                        <label htmlFor="codec">Codec</label>
                        <select name="codec" id="codec" value={streamOptions.codec} onChange={(ev) => { streamOptions.setCodec(ev.target.value) }}>
                            <option value="VP9">VP9</option>
                            <option value="VP8">VP8</option>
                            <option value="AV1">AV1 (best quality but may increase cpu usage drastically)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="fps">Framerate</label>
                        <select name="fps" id="fps" value={streamOptions.fps} onChange={(ev) => { streamOptions.setFps(parseInt(ev.target.value)) }}>
                            <option value="15">15</option>
                            <option value="24">24</option>
                            <option value="30">30</option>
                            <option value="60">60</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="high-bitrate">Increase bitrate</label>
                        <input type="checkbox" checked={streamOptions.highBitrate} onChange={(ev) => streamOptions.setHighBitrate(ev.target.checked)} />
                    </div>

                    <button onClick={() => setShowScreenOptions(false)}>Cancel</button>
                    <button onClick={startStream}>Start</button>
                </div>
            </div>}

            {/* Password modal */}
            {passError && <div className="fixed top-0 left-0 w-full h-full z-40 bg-gray-900 flex flex-col justify-center align-middle p-3 gap-2">
                <h1>{passError}</h1>
                <div className="form-group mr-auto gap-2 w-96 max-w-full">
                    <input value={password} onChange={(ev) => setPassword(ev.target.value)} type="password" placeholder="Password" />
                    <button onClick={authenticate}>Join</button>
                </div>
            </div>}

            {/* Reconnect display */}
            {!connected && <div className="fixed top-0 left-0 w-full h-full z-50 bg-gray-900 flex flex-col justify-center align-middle p-3 gap-2">
                <h1>Disconnected from server</h1>
                <h2 className="text-2xl">Connecting</h2>
                <div className="loader"></div>
            </div>}
        </div>
    );
};

export default MeetingClient;