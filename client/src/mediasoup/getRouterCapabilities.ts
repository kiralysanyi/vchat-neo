import type { RtpCapabilities } from "mediasoup-client/types"
import config from "../config"

const getRouterCapabilities = (): Promise<RtpCapabilities> => {
    return new Promise((resolve) => {
        fetch(config.serverUrl + "/api/router/capabilities", { method: "GET", headers: { "Content-Type": "application/json" } }).then(async (response) => {
            const data = await response.json();
            resolve(data.rtpCapabilities)
        })
    })
}

export default getRouterCapabilities;