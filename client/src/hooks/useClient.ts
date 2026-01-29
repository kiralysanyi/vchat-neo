import { Device } from "mediasoup-client";
import type { ProducerCodecOptions, RtpCapabilities, RtpCodecCapability, Transport } from "mediasoup-client/types";
import config from "../config";
import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { checkCamera, getCamera } from "../capture/getCamera";
import { checkMicrophone, getMicrophone } from "../capture/getMicrophone";
import { createRecvTransport, createSendTransport } from "../mediasoup/utils";
import { DataContext } from "../providers/DataProvider";
import socket from "../socket";
import type { Participant } from "../types/Participant";
import getCodecOption from "../utils/getCodecOption";

const useClient = () => {
    const {
        cameraStream,
        joined,
        microphoneStream,
        setMicrophoneStream,
        setCameraStream,
        nickname
    } = useContext(DataContext);

    const navigate = useNavigate();
    const params = useParams();

    document.title = "Meeting - " + params.id

    const [participants, setParticipants] = useState<Record<string, Participant>>({});
    const [device, setDevice] = useState<Device | null>(null);
    const [sendStream, setSendStream] = useState<((stream: MediaStream, payloadId: number, codec?: RtpCodecCapability, codecOptions?: ProducerCodecOptions) => Promise<void>) | null>(null);
    const [connected, setConnected] = useState(socket.connected);
    const getStreamRef = useRef<(transportId: string, payloadId: number, onClose: Function) => Promise<{ stream: MediaStream, close: Function }>>(undefined)

    const [sendTransport, setSendTransport] = useState<Transport>()
    const [recvTransport, setRecvTransport] = useState<Transport>()

    const [hasAudio, setHasAudio] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);

    const [viewedParticipant, setViewedParticipant] = useState<Participant | null>(null);
    const closeRef = useRef<{ closeVid: Function | undefined, closeAudio: Function | undefined }>({ closeVid: undefined, closeAudio: undefined });
    const [transportId, setTransportId] = useState<string>()

    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    const [password, setPassword] = useState("");
    const [passError, setPassError] = useState<string>();
    const [authenticated, setAuthenticated] = useState(false);

    const [initialized, setInitialized] = useState(false);

    // handle auth
    const authenticate = () => {
        socket.emit("prepare", params.id, password)
    }

    useEffect(() => {
        const onAuthNeeded = () => {
            if (password.length > 0) {
                authenticate();
            } else {
                setPassError("Password required to join")
            }
        }

        const onWrongPass = () => {
            setPassError("Wrong password")
        }

        const onReady = () => {
            setAuthenticated(true);
            setPassError(undefined);
        }



        socket.on("auth_required", onAuthNeeded)
        socket.on("wrong_pass", onWrongPass)

        socket.on("serverReady", onReady)

        const onInitialized = () => {
            setInitialized(true);
            console.log("Server reported that everything is ready")
        }

        socket.on("initialized", onInitialized)
        return () => {
            socket.off("auth_required", onAuthNeeded)
            socket.off("wrong_pass", onWrongPass)
            socket.off("serverReady", onReady)
            socket.off("initialized", onInitialized)
        }
    }, [password])

    // check device
    useEffect(() => {
        checkCamera().then((has) => {
            setHasVideo(has)
        })

        checkMicrophone().then((has) => {
            setHasAudio(has)
        })
    }, [])

    // 1. Navigation Guard
    useEffect(() => {
        if (connected) {
            fetch(config.serverUrl + "/api/meeting/" + params.id, { method: "GET", headers: { "Content-Type": "application/json" } }).then(async (res) => {
                if (res.status != 200) {
                    console.error("Meeting does not exist")
                    navigate("/")
                }
            })
        }

        if (!joined) {
            navigate("/meeting/join/" + params.id);
        }

    }, [joined, navigate, params.id, connected]);

    // 2. Setup Device
    useEffect(() => {
        if (!connected || !authenticated) return;

        let isMounted = true;
        const dev = new Device();

        socket.emit("getCapabilities", {}, async (capabilities: RtpCapabilities) => {
            if (!isMounted) return;
            await dev.load({ routerRtpCapabilities: capabilities });
            setDevice(dev);
        })

        return () => { isMounted = false; };
    }, [connected, authenticated]);

    // 3. Handle Receiving Streams
    useEffect(() => {
        if (!device || !authenticated || !initialized) return;

        let getStreamFunc: any;

        createRecvTransport(socket, device, (transport) => {
            setRecvTransport(transport)
        }).then((getstream) => {
            console.log("Ready to consume")
            getStreamFunc = getstream;
            getStreamRef.current = getstream;
            socket.emit("consumeReady");
        });

        const onNewProducer = async (transportId: string, payloadId: number) => {
            if (!getStreamFunc || !connected) return;

            const { stream } = await getStreamFunc(transportId, payloadId, () => {
                // On Close: Remove stream from participant
                setParticipants(prev => {
                    const updated = { ...prev };
                    if (!updated[transportId]) return prev; // Guard against unknown participant

                    // Map payload IDs to specific stream properties
                    if (payloadId === 1) updated[transportId].cameraStream = undefined;
                    if (payloadId === 2) updated[transportId].microphoneStream = undefined;
                    if (payloadId === 3) updated[transportId].streaming = false;
                    if (payloadId === 3) updated[transportId].screenStream = undefined;
                    if (payloadId === 4) updated[transportId].screenAudioStream = undefined;
                    if (payloadId === 4) updated[transportId].streamingAudio = undefined;

                    return { ...updated };
                });
            });
            console.log("Add consumer: ", transportId, payloadId)
            setParticipants(prev => {
                const updated = { ...prev };
                if (!updated[transportId]) return prev; // Guard against unknown participant

                // Map payload IDs to specific stream properties
                if (payloadId === 1) updated[transportId].cameraStream = stream;
                if (payloadId === 2) updated[transportId].microphoneStream = stream;
                // Only report that screenshare available
                if (payloadId === 3) updated[transportId].streaming = true;
                if (payloadId === 4) updated[transportId].streamingAudio = true;

                return { ...updated };
            });
        };

        console.log("Attach newProducer listener")
        socket.on("newProducer", onNewProducer);

        return () => {
            console.log("Detach newProducer")
            socket.off("newProducer", onNewProducer);
        };
    }, [device, authenticated, initialized]);


    // 4. Setup Send Transport
    useEffect(() => {
        if (!device || !authenticated) return;
        createSendTransport(socket, device, (transport) => {
            console.log("Send transport created");
            setTransportId(transport.id);
            setSendTransport(transport)
        }).then((sendstream) => {
            setSendStream(() => sendstream);
        });
    }, [device, authenticated]);

    // 5. Produce Local Streams (Camera/Mic)

    useEffect(() => {
        if (cameraStream && sendStream && sendTransport) {
            const { codec, codecOptions } = getCodecOption("VP8")
            sendStream(cameraStream, 1, codec, codecOptions).then(() => {
                console.log("Sending camera stream")
                socket.emit("addstream", 1)
            })
        }
    }, [cameraStream, sendStream, sendTransport]);

    useEffect(() => {
        if (microphoneStream && sendStream && sendTransport) {
            sendStream(microphoneStream, 2, {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
                preferredPayloadType: 111,
                parameters: {
                    'maxaveragebitrate': 16000,
                    'usedtx': 1,
                    'useinbandfec': 1
                }
            }).then(() => {
                console.log("Sending microphone stream")
                socket.emit("addstream", 2)
            })
        }
    }, [microphoneStream, sendStream, sendTransport]);



    // 6. Participant Sync
    useEffect(() => {
        if (!transportId && !connected) {
            return;
        }

        const onLeft = (transportId: string) => {
            setParticipants(prev => {
                const { [transportId]: deletedItem, ...remaining } = prev;
                return remaining;
            });
        }

        socket.on("participantLeft", onLeft)
        socket.on("participants", (data: Record<string, Participant>) => setParticipants(data));
        socket.on("newJoined", (data: Participant) => {
            setParticipants(prev => ({ ...prev, [data.producerTransportId]: data }));
        });

        socket.emit("join", params.id, transportId, nickname);

        return () => {
            socket.off("participantLeft", onLeft);
            socket.off("participants");
            socket.off("newJoined");
            socket.emit("leave");
        };
    }, [params.id, transportId, connected]);

    // handle disconnect
    useEffect(() => {
        const onDisconnect = () => {
            sendTransport?.close()
            recvTransport?.close()
            setSendTransport(undefined);
            setRecvTransport(undefined);
            setDevice(null);
            setTransportId(undefined);
            setSendStream(null);
            setConnected(false);
            setParticipants({});
            setAuthenticated(false);
            setInitialized(false);
        }

        const onConnect = () => {
            setConnected(true);
        }

        socket.on("connect", onConnect)

        socket.on("disconnect", onDisconnect)

        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
        }
    }, [sendTransport, recvTransport])

    const camRef = useRef<MediaStream | null>(null)
    const micRef = useRef<MediaStream | null>(null)
    const screenRef = useRef<MediaStream | null>(null)

    useEffect(() => { camRef.current = cameraStream }, [cameraStream])
    useEffect(() => { micRef.current = microphoneStream }, [microphoneStream])
    useEffect(() => { screenRef.current = screenStream }, [screenStream])

    // close all transports on leave

    // bridge states to ref
    const bRef = useRef({ sendTransport, recvTransport });

    useEffect(() => {
        bRef.current = { sendTransport, recvTransport };
    }, [sendTransport, recvTransport])

    useEffect(() => {
        // When the component unmounts, React runs the 
        // cleanup function from the LAST successful render.
        return () => {
            console.log("Closing streams and transports");
            [screenRef, camRef, micRef].forEach((ref) => {
                ref.current?.getTracks().forEach((track) => {
                    track.onended?.(new Event("ended"));
                    track.stop();
                });
            });

            // These will now be the CURRENT values from state/props
            bRef.current.recvTransport?.close();
            bRef.current.sendTransport?.close();
        };
    }, []);

    // restart streams on rejoin
    useEffect(() => {
        if (!connected) {
            return
        }

        if (camRef.current != null) {
            getCamera().then((stream) => {
                setCameraStream?.(stream)
            })
        }

        if (micRef.current != null) {
            getMicrophone().then((stream) => {
                setMicrophoneStream?.(stream)
            })
        }

        if (screenRef.current != null) {
            setScreenStream?.(null)
        }
    }, [connected])

    // initiate start sequence
    useEffect(() => {
        if (!connected || !joined) {
            return;
        }

        socket.emit("prepare", params.id)
    }, [connected, joined])


    return {
        cameraStream,
        joined,
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
    }
}

export default useClient;