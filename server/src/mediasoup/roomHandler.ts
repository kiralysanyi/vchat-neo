import { Router } from "mediasoup/node/lib/RouterTypes";
import { ExtendedSocket } from "../types/ExtendedSocket";
import { ExtendedProducer } from "../types/ExtendedProducer";
import { Meeting } from "../types/Meeting";
import consumerHandler from "./consumerHandler";
import producerHandler from "./producerHandler";

const roomHandler = (router: Router, socket: ExtendedSocket, meetings: Record<string, Meeting>, meetingId: string) => {
    // attach handlers
    producerHandler(router, socket, meetings[meetingId].producerTransports, (transportId) => {
        socket.on("disconnect", () => {
            delete meetings[meetingId].producerTransports[transportId];
        })
    }, (transportId, payloadId) => {
        // new stream
        if (meetingId) {
            if (meetings[meetingId]) {
                switch (payloadId) {
                    case 1:
                        meetings[meetingId].participants[transportId].audio = true;
                        break;

                    case 2:
                        meetings[meetingId].participants[transportId].video = true;
                        break;

                    case 3:
                        meetings[meetingId].participants[transportId].sVideo = true;
                        break;

                    case 4:
                        meetings[meetingId].participants[transportId].sAudio = true;
                        break;

                    default:
                        break;
                }
            }
        }
    }, (transportId: string, payloadId: number) => {
        // stream removed

        if (meetingId) {
            if (meetings[meetingId] && meetings[meetingId].participants[transportId]) {
                switch (payloadId) {
                    case 1:
                        meetings[meetingId].participants[transportId].audio = false;
                        break;

                    case 2:
                        meetings[meetingId].participants[transportId].video = false;
                        break;

                    case 3:
                        meetings[meetingId].participants[transportId].sVideo = false;
                        break;

                    case 4:
                        meetings[meetingId].participants[transportId].sAudio = false;
                        break;

                    default:
                        break;
                }
            }
        }
    });

    consumerHandler(router, socket, meetings[meetingId].producerTransports, (transportId, accept, deny) => {
        accept();
    })
}

export default roomHandler