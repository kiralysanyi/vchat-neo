import { useEffect, useRef, useState } from "react"
import getRouterCapabilities from "../mediasoup/getRouterCapabilities"
import { Device } from "mediasoup-client"
import { createRecvTransport } from "../mediasoup/utils"
import socket from "../socket"

const TestConsume = () => {
    const [transportid, setTransportid] = useState("")
    const [device, setDevice] = useState<Device | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)

    const consume = () => {
        console.log("Consume blyat", device)
        if (device) {
            createRecvTransport(socket, device).then((getstream) => {
                console.log("Transport ready")
                getstream(transportid, 3, () => {
                    // consumer closed
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                    }
                }).then((stream) => {
                    console.log("Got stream: ", stream)
                    stream.getTracks()[0].onended = () => {
                        console.log("Stream ended")
                    }
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
            })
        }
    }

    useEffect(() => {
        getRouterCapabilities().then(async (capabilities) => {
            const dev = new Device();
            console.log(dev.handlerName)
            await dev.load({ routerRtpCapabilities: capabilities })
            console.log(dev.rtpCapabilities, capabilities, dev.loaded)
            setDevice(dev)
        })
    }, [])
    return <>
        <video ref={videoRef} controls autoPlay></video>
        <input type="text" placeholder="transportId" value={transportid} onChange={(ev) => { setTransportid(ev.target.value.trim()) }} />
        <button onClick={consume}>Consume</button>
    </>
}

export default TestConsume;