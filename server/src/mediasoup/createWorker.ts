import * as mediasoup from "mediasoup"

const createWorker = async () => {
    const worker = await mediasoup.createWorker()
    worker.on("died", () => {
        console.error("Mediasoup worker process died")
        process.abort();
    })

    return worker;    
}

export default createWorker;