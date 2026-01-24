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
        let sending = false;
        socket.emit("createProducerTransport", {}, async (params: TransportOptions<AppData>) => {
            const transport = device.createSendTransport(params);
            transports[transport.id] = transport;
            transport.on("connect", ({ dtlsParameters }, cb) => {
                socket.emit("connectProducerTransport", { dtlsParameters }, cb);
            });

            transport.on("produce", ({ kind, rtpParameters, appData }, cb) => {
                console.log("Produce: ", appData)
                socket.emit("produce", { kind, rtpParameters, appData }, cb);
            });

            onCreateTransport(transport)

            // return addStream function
            resolve(async (stream, payloadId) => {
                return new Promise((done) => {
                    const send = async () => {
                        // if currently sending, return and try again later
                        if (sending == true) {
                            return setTimeout(() => {
                                send()
                            }, 200);
                        }

                        sending = true;

                        const track = stream.getTracks()[0];

                        const producer = await transport.produce({
                            track: track,
                            appData: {
                                payloadId: payloadId
                            }
                        })

                        // if track ended, close the producer
                        track.onended = () => {
                            console.log("Stream ended, closing producer");
                            producer.close();
                            socket.emit("pclose", transport.id, payloadId);
                        }

                        sending = false;

                        // stream sent, task resolved
                        done();
                    }

                    send();
                })
            });
        })
    });
}

const createRecvTransport = (socket: Socket, device: Device, onCreateTransport: (transport: Transport) => void): Promise<(transportId: string, payloadId: number, onClose: Function) => Promise<{ stream: MediaStream, close: Function }>> => {
    return new Promise((resolve) => {
        socket.emit("createConsumerTransport", {}, (params: TransportOptions<AppData>) => {
            console.log("Creating transport")
            const transport = device.createRecvTransport(params);
            transports[transport.id] = transport;
            console.log("Transport created: ", transport)
            onCreateTransport(transport)

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
                    socket.emit("consume", { rtpCapabilities: device.rtpCapabilities, payloadId, transportId },
                        async (data: { error: any; id: string; producerId: string; kind: MediaKind; rtpParameters: RtpParameters; }) => {
                            if (data.error) {
                                return console.error(data.error)
                            }

                            const consumer = await transport.consume({
                                id: data.id,
                                producerId: data.producerId,
                                kind: data.kind,
                                rtpParameters: data.rtpParameters,
                            });

                            consumers[consumer.id] = consumer;


                            consumer.on("@close", () => {
                                onClose();
                            })

                            const onConClose = (consumerId: string) => {
                                if (consumerId == consumer.id) {
                                    onClose();
                                }
                            }


                            socket.on("conclose", onConClose)

                            resolveStream({
                                stream: new MediaStream([consumer.track]), close: () => {
                                    consumer.close();
                                }
                            })
                        });
                })
            })
        })
    })
}

export { createSendTransport, createRecvTransport, closeAllTransport }