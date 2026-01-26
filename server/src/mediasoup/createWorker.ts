import * as mediasoup from "mediasoup"

const createWorker = async () => {
    const worker = await mediasoup.createWorker({logLevel: "debug"});
    worker.on("died", () => {
        console.error("Mediasoup worker process died")
        process.abort();
    })

    worker.on("@failure", (err) => {
        console.error("Worker failure:", err)
    })

    return worker;
}

export default createWorker;