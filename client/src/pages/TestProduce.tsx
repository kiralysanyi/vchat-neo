import { useEffect, useState } from "react";
import getScreen from "../capture/getScreen";
import { createSendTransport } from "../mediasoup/utils";
import socket from "../socket";
import { Device } from "mediasoup-client";
import getRouterCapabilities from "../mediasoup/getRouterCapabilities";

const TestProduce = () => {
    const [transportid, setTransportid] = useState("")
    const [device, setDevice] = useState<Device | null>(null)

    const produce = async () => {
        const stream = await getScreen();

        if (device) {
            const addstream = await createSendTransport(socket, device, (transport) => {
                setTransportid(transport.id)
            })

            addstream(stream, 3)
        }
    }

    useEffect(() => {
        getRouterCapabilities().then(async (capabilities) => {
            const dev = new Device();
            console.log(dev.handlerName)
            await dev.load({routerRtpCapabilities: capabilities})
            console.log(dev.rtpCapabilities, capabilities, dev.loaded)
            setDevice(dev)
        })
    }, [])

    return <>
        <h2>TransportID: {transportid}</h2>
        <button onClick={produce}>Produce</button>
    </>
}

export default TestProduce;