
import express from "express";
import http from "http"
import { Server } from "socket.io";
import createRouter from "./mediasoup/createRouter";
import { CLEANUP_INTERVAL, ENABLE_API, PORT, SERVERPASS } from "./config";
import { ExtendedSocket } from "./types/ExtendedSocket";
import cors from "cors";
import { Meeting } from "./types/Meeting";
import * as fs from "fs";
import roomHandler from "./mediasoup/roomHandler";
import createWorkers from "./mediasoup/createWorkers";
import createApiHandler from "./api_external/router";

const app = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

const meetings: Record<string, Meeting> = {};

const cleanMeeting = (mId: string) => {
    if (!meetings[mId]) {
        return;
    }

    if (Object.keys(meetings[mId].participants).length > 0) {
        meetings[mId].timeout = setTimeout(() => {
            cleanMeeting(mId)
        }, (60 * 1000) * CLEANUP_INTERVAL)
        return;
    }

    meetings[mId].router.close();
    delete meetings[mId];
}

app.use(cors({ origin: "*" }))
app.use(express.json())

createWorkers().then(async (workers) => {
    io.on("connection", async (socket: ExtendedSocket) => {
        //meeting related stuff

        socket.on("prepare", (mId: string, password?: string) => {
            if (socket.joinState) {
                if (socket.joinState != "idle") {
                    console.error("Prepare declined because socket is already in state: ", socket.joinState)
                    return
                }
            }

            socket.joinState = "preparing"


            if (!meetings[mId]) {
                socket.joinState = "idle"
                return;
            }

            if (socket.detachConsumer) {
                console.log("Detaching consumer handler from", socket.id)
                socket.detachConsumer();
            }

            if (socket.detachProducer) {
                console.log("Detaching producer handler from", socket.id)
                socket.detachProducer();
            }

            if (meetings[mId].password) {
                if (!password) {
                    socket.emit("auth_required")
                    socket.joinState = "idle"
                    return;
                }

                if (meetings[mId].password != password) {
                    socket.emit("wrong_pass")
                    socket.joinState = "idle"
                    return;
                }
            }

            // room cleaning reset
            clearTimeout(meetings[mId].timeout)
            meetings[mId].timeout = setTimeout(() => {
                cleanMeeting(mId)
            }, (60 * 1000) * CLEANUP_INTERVAL)

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

                if (meetings[meetingId].participants[transportId] != undefined) {
                    console.error("Transport conflict, aborting join")
                    if (socket.detachConsumer) {
                        socket.detachConsumer()
                    }

                    if (socket.detachProducer) {
                        socket.detachProducer();
                    }
                    return;
                }

                socket.meetid = meetingId;

                socket.join(meetings[meetingId].id);

                socket.emit("participants", meetings[meetingId].participants)

                meetings[meetingId].participants[transportId] = {
                    nickname: nickname,
                    producerTransportId: transportId,
                    audio: false,
                    video: false,
                    sAudio: false,
                    sVideo: false
                }

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
                    console.log("Consume ready")
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
                    socket.joinState = "idle";
                    console.log("Socket left", socket.id, new Date().toISOString())
                    console.log("==========================")
                    // room cleaning reset
                    clearTimeout(meetings[mId].timeout)
                    meetings[mId].timeout = setTimeout(() => {
                        cleanMeeting(mId)
                    }, (60 * 1000) * CLEANUP_INTERVAL)

                    socket.off("addstream", onAddStream)
                    socket.off("consumeReady", onConsumeReady)
                    socket.to(meetings[meetingId].id).emit("participantLeft", transportId)
                    socket.leave(meetingId)
                    delete meetings[meetingId].participants[transportId];
                    socket.off("disconnect", onLeave)
                    socket.off("leave", onLeave)

                    if (socket.detachConsumer) {
                        console.log("Detaching consumer handler from", socket.id)
                        socket.detachConsumer();
                    }

                    if (socket.detachProducer) {
                        console.log("Detaching producer handler from", socket.id)
                        socket.detachProducer();
                    }
                }

                socket.on("disconnect", onLeave)
                socket.on("leave", onLeave)

                console.log("Send initialized signal")
                socket.joinState = "joined"
                socket.emit("initialized")
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

            socket.removeAllListeners()
        })

        console.log("Connected socket")
    })

    // todo: add actual load balancing
    let lastSelectedWorker = 0;

    // create meeting
    app.post("/api/meeting/:id", async (req, res) => {
        const id = req.params.id;
        const password = req.body.password ? req.body.password : undefined;
        const srvPass = req.body.srvPass ? req.body.srvPass : undefined;

        if (id == "join" || /[^\w-]/.test(id)) {
            return res.status(400).json({
                error: "Invalid id"
            })
        }

        if (id.length < 5) {
            return res.status(400).json({
                error: "Id has to be at least 5 characters"
            })
        }

        if (SERVERPASS != undefined) {
            if (SERVERPASS != srvPass) {
                return res.status(401).json({
                    error: "Wrong password"
                })
            }
        }

        if (meetings[id]) {
            return res.status(409).json({
                error: "Meeting exists"
            })
        }

        // select worker to use
        lastSelectedWorker++;
        if (lastSelectedWorker > workers.length - 1) {
            lastSelectedWorker = 0;
        }

        meetings[id] = {
            id: id,
            participants: {},
            producerTransports: {},
            router: await createRouter(workers[lastSelectedWorker]),
            password: password,
            timeout: setTimeout(() => {
                cleanMeeting(id)
            }, (60 * 1000) * CLEANUP_INTERVAL)
        }

        return res.status(201).json({
            message: "Created"
        })
    })

    app.get("/api/needsauth", (req, res) => {
        if (SERVERPASS != undefined) {
            return res.json({
                required: true
            })
        } else {
            return res.json({
                required: false
            })
        }
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
            participants: meeting.participants,
            external: meeting.external == true
        })
    })

    // handle non existent pages

    if (ENABLE_API == true) {
        app.use("/api/external", createApiHandler(meetings, workers, cleanMeeting));
        console.log("External api enabled")
    }

    // host client if available
    if (fs.existsSync("./public")) {
        console.log("Hosting client")
        app.use(express.static("./public"))
    }

    app.use((req, res) => {
        res.sendFile("index.html", { root: "./public" })
    })

    server.listen(PORT, () => {
        console.log('listening on *:' + PORT);
    });
})

