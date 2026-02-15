import express from "express";
import { Meeting } from "../types/Meeting";
import { randomUUID } from "crypto";
import { Worker } from "mediasoup/node/lib/WorkerTypes";
import createRouter from "../mediasoup/createRouter";
import { CLEANUP_INTERVAL } from "../config";

// TODO: implement api keys
const createApiHandler = (meetings: Record<string, Meeting>, workers: Worker[], cleanMeeting: (mId: string) => void) => {
    const externalApiRouter = express.Router();

    let lastSelectedWorker = 0;
    externalApiRouter.post("/meeting", async (req, res) => {
        const { key } = req.body;
        if (key === undefined || key.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "key field required"
            })
        }

        lastSelectedWorker++;
        if (lastSelectedWorker > workers.length - 1) {
            lastSelectedWorker = 0;
        }

        const uid = randomUUID();
        if (meetings[uid] != undefined) {
            console.log("Meeting exists with id: ", uid)
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            })
        }

        meetings[uid] = {
            id: uid,
            participants: {},
            producerTransports: {},
            router: await createRouter(workers[lastSelectedWorker]),
            timeout: setTimeout(() => {
                cleanMeeting(uid)
            }, (60 * 1000) * CLEANUP_INTERVAL),
            description: "Created by external API",
            external: true,
            password: key
        }

        return res.status(201).json({
            success: true,
            id: uid
        })
    })

    return externalApiRouter;
}

export default createApiHandler;