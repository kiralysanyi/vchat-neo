import express, { RequestHandler } from "express"
import { ZITADEL_CLIENT_ID, ZITADEL_DOMAIN } from "./config";
import { expressjwt, GetVerificationKey } from "express-jwt";
import JwksRsa from "jwks-rsa";
import https from "https"
import isDev from "./utils/isDev";

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

const checkJwt = expressjwt({
    secret: JwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${ZITADEL_DOMAIN}/oauth/v2/keys`,
        requestAgent: new https.Agent({
            rejectUnauthorized: !isDev()
        })
    }) as GetVerificationKey,

    // Validate the audience and issuer
    audience: ZITADEL_CLIENT_ID ? ZITADEL_CLIENT_ID : "", // Or your ZITADEL Project ID
    issuer: ZITADEL_DOMAIN ? ZITADEL_DOMAIN : "",
    algorithms: ['RS256']
});


export { authRouter, checkJwt }