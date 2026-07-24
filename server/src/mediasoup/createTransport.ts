import { Router } from "mediasoup/node/lib/RouterTypes";
import { TransportListenIp } from "mediasoup/node/lib/TransportTypes";

const createTransport = async (
    router: Router, 
    listenIps: (string | TransportListenIp)[]
) => {
    const formattedListenIps: TransportListenIp[] = listenIps.map((entry) => {
        if (typeof entry === "string") {
            // Check if string contains a colon to determine if it's IPv6
            const isIPv6 = entry.includes(":");

            return {
                ip: isIPv6 ? "::" : "0.0.0.0", // Use '::' for IPv6 wildcard, '0.0.0.0' for IPv4
                announcedIp: entry !== "0.0.0.0" && entry !== "::" ? entry : undefined,
            };
        }
        return entry;
    });

    const transport = await router.createWebRtcTransport({
        listenIps: formattedListenIps,
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
};

export default createTransport;