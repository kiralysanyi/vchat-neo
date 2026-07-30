import express from "express"
import { ZITADEL_CLIENT_ID, ZITADEL_DOMAIN } from "./config";

const authRouter = express.Router();

authRouter.get("/config", (req, res) => {
    if (ZITADEL_CLIENT_ID == null || ZITADEL_DOMAIN == null) {
        return res.status(404).json({
            message: "Not found"
        })
    }
    res.json({
        zitadel_domain: ZITADEL_DOMAIN,
        zitadel_client_id: ZITADEL_CLIENT_ID
    })
})

export { authRouter }