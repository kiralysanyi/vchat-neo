import { Worker } from "mediasoup/node/lib/types"
import { WORKERS } from "../config"
import { createWorker } from "mediasoup"

const createWorkers = async () => {
    const workers: Worker[] = []
    for (let index = 0; index < WORKERS; index++) {
        workers.push(await createWorker())
    }

    return workers;
}

export default createWorkers;