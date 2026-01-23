import { Device } from "mediasoup-client"
import type { AppData, Consumer, MediaKind, RtpParameters, Transport, TransportOptions } from "mediasoup-client/types"
import type { Socket } from "socket.io-client"

const transports: Record<string, Transport> = {}

const closeAllTransport = () => {
    for (let i in transports) {
        transports[i].close();
        delete transports[i];
    }
}

const createSendTransport = (socket: Socket, device: Device, onCreateTransport: (transport: Transport) => void): Promise<(stream: MediaStream, payloadId: number) => Promise<void>> => {
    return new Promise((resolve) => {
        socket.emit("createProducerTransport", {}, async (params: TransportOptions<AppData>) => {
            const transport = device.createSendTransport(params);
            transports[transport.id] = transport;
            transport.on("connect", ({ dtlsParameters }, cb) => {
                socket.emit("connectProducerTransport", { dtlsParameters }, cb);
            });

            onCreateTransport(transport)

            // return addStream function
            resolve(async (stream, payloadId) => {
                transport.once("produce", ({ kind, rtpParameters }, cb) => {
                    socket.emit("produce", { kind, rtpParameters, payloadId }, cb);
                });

                const track = stream.getTracks()[0];

                const producer = await transport.produce({
                    track: track
                })

                // if track ended, close the producer
                track.onended = () => {
                    console.log("Stream ended, closing producer");
                    producer.close();
                    socket.emit("pclose", transport.id, payloadId);
                }
            });
        })
    });
}

const createRecvTransport = (socket: Socket, device: Device): Promise<(transportId: string, payloadId: number, onClose: Function) => Promise<{stream: MediaStream, close: Function}>> => {
    return new Promise((resolve) => {
        socket.emit("createConsumerTransport", {}, (params: TransportOptions<AppData>) => {
            console.log("Creating transport")
            const transport = device.createRecvTransport(params);
            transports[transport.id] = transport;
            console.log("Transport created: ", transport)

            transport.on("connect", ({ dtlsParameters }, cb) => {
                console.log("Transport connecting")
                socket.emit("connectConsumerTransport", { dtlsParameters }, cb);
            });

            // return consume function

            const consumers: Record<string, Consumer> = {};

            socket.on("conclose", (consumerId: string) => {
                if (consumers[consumerId]) {
                    consumers[consumerId].close()
                    delete consumers[consumerId];
                    console.log("Consumer closed because producer closed", consumerId)
                }
            })

            resolve((transportId: string, payloadId: number, onClose: Function) => {
                return new Promise((resolveStream) => {
                    console.log("Consume stream:", transportId, payloadId)
                    
                    socket.emit("consume", { rtpCapabilities: device.rtpCapabilities, payloadId, transportId },
                        async (data: { error: any; id: string; producerId: string; kind: MediaKind; rtpParameters: RtpParameters; }) => {
                            if (data.error) {
                                return console.error(data.error)
                            }

                            console.log("Attaching consumer")
                            const consumer = await transport.consume({
                                id: data.id,
                                producerId: data.producerId,
                                kind: data.kind,
                                rtpParameters: data.rtpParameters,
                            });

                            consumers[consumer.id] = consumer;

                            console.log("attached consumer")

                            consumer.on("@close", () => {
                                onClose();
                            })

                            resolveStream({stream: new MediaStream([consumer.track]), close: () => {
                                consumer.close();
                            }})
                        });
                })
            })
        })
    })
}

export { createSendTransport, createRecvTransport, closeAllTransport }