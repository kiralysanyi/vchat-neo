
import express from "express";
import http from "http"
import { Server } from "socket.io";
import { createWorker } from "mediasoup";
import createRouter from "./mediasoup/createRouter";
import { PORT } from "./config";
import producerHandler from "./mediasoup/producerHandler";
import { ExtendedProducer } from "./types/ExtendedProducer";
import consumerHandler from "./mediasoup/consumerHandler";
import { ExtendedSocket } from "./types/ExtendedSocket";
import cors from "cors";
import { Meeting } from "./types/Meeting";
import * as fs from "fs";
import roomHandler from "./mediasoup/roomHandler";

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

const meetings: Record<string, Meeting> = {};

app.use(cors({ origin: "*" }))

createWorker().then(async (worker) => {
    io.on("connection", async (socket: ExtendedSocket) => {
        //meeting related stuff

        socket.on("prepare", (mId: string) => {
            if (!meetings[mId]) {
                return;
            }
            const router = meetings[mId].router;

            roomHandler(router, socket, meetings, mId);

            // handle rtpcapabilities request
            const onGetCapabilities = (_: any, cb: any) => {
                console.log("GetCapabilities")
                cb(router.rtpCapabilities)
            }

            socket.on("getCapabilities", onGetCapabilities);

            socket.once("join", (meetingId: string, transportId: string, nickname) => {
                if (meetings[meetingId] == undefined) {
                    console.error("Meeting not found: ", meetingId)
                    return;
                }

                socket.meetid = meetingId;

                socket.join(meetings[meetingId].id);

                socket.to(meetings[meetingId].id).emit("newJoined", {
                    nickname: nickname,
                    producerTransportId: transportId
                })

                const onAddStream = (payloadId: number) => {
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
                    socket.to(meetings[meetingId].id).emit("newProducer", transportId, payloadId)
                }

                socket.on("addstream", onAddStream)

                const onConsumeReady = () => {
                    if (meetings[meetingId]) {
                        for (let i in meetings[meetingId].participants) {
                            meetings[meetingId].participants[i].audio && socket.emit("newProducer", meetings[meetingId].participants[i].producerTransportId, 1);
                            meetings[meetingId].participants[i].video && socket.emit("newProducer", meetings[meetingId].participants[i].producerTransportId, 2);
                            meetings[meetingId].participants[i].sVideo && socket.emit("newProducer", meetings[meetingId].participants[i].producerTransportId, 3);
                            meetings[meetingId].participants[i].sAudio && socket.emit("newProducer", meetings[meetingId].participants[i].producerTransportId, 4);
                        }
                    }
                }

                socket.on("consumeReady", onConsumeReady)
                const onLeave = () => {
                    socket.off("addstream", onAddStream)
                    socket.off("consumeReady", onConsumeReady)
                    socket.to(meetings[meetingId].id).emit("participantLeft", transportId)
                    delete meetings[meetingId].participants[transportId];
                }

                socket.emit("participants", meetings[meetingId].participants)

                meetings[meetingId].participants[transportId] = {
                    nickname: nickname,
                    producerTransportId: transportId,
                    audio: false,
                    video: false,
                    sAudio: false,
                    sVideo: false
                }

                socket.once("disconnect", onLeave)
                socket.once("leave", onLeave)
            })

            socket.emit("serverReady");
        })



        // detach handlers if any
        socket.on("disconnect", () => {
            if (socket.detachConsumer) {
                console.log("Detaching consumer handler from", socket.id)
                socket.detachConsumer();
            }

            if (socket.detachProducer) {
                console.log("Detaching producer handler from", socket.id)
                socket.detachProducer();
            }
        })

        console.log("Connected socket")
    })


    // create meeting
    app.post("/api/meeting/:id", async (req, res) => {
        const id = req.params.id;

        if (id == "join" || id.includes(' ')) {
            return res.status(400).json({
                error: "Invalid id"
            })
        }

        if (meetings[id]) {
            return res.status(409).json({
                error: "Meeting exists"
            })
        }

        meetings[id] = {
            id: id,
            participants: {},
            producerTransports: {},
            router: await createRouter(worker)
        }

        return res.status(201).json({
            message: "Created"
        })
    })

    //get meeting info

    app.get("/api/meeting/:id", (req, res) => {
        const meeting = meetings[req.params.id];

        if (meeting == undefined) {
            return res.status(404).json({
                error: "Not found"
            })
        }

        return res.json({
            id: meeting.id,
            participants: meeting.participants
        })
    })

    // handle non existent pages

    // host client if available
    if (fs.existsSync("./public")) {
        console.log("Hosting client")
        app.use(express.static("./public"))
    }

    app.use((req, res) => {
        res.redirect("/")
    })

    server.listen(PORT, () => {
        console.log('listening on *:' + PORT);
    });
})

