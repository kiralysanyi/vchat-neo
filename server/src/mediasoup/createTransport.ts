import { Router } from "mediasoup/node/lib/RouterTypes";

const createTransport = async (router: Router, listenIps: string[]) => {
    const transport = await router.createWebRtcTransport({
        listenIps: listenIps,
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        enableSctp: true,
        numSctpStreams: { OS: 1024, MIS: 1024 },
    });

    return {
        transport,
        params: {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
        }
    };
}

export default createTransport;