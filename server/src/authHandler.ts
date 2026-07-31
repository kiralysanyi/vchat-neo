import express, { RequestHandler } from "express"
import { ZITADEL_CLIENT_ID, ZITADEL_DOMAIN, ZITADEL_USE_ROLES } from "./config";
import { expressjwt, GetVerificationKey } from "express-jwt";
import JwksRsa from "jwks-rsa";
import https from "https"
import isDev from "./utils/isDev";
import tokenVerifier from "./utils/tokenVerifier";

const authRouter = express.Router();

async function getRoles(token: string) {
    const data = await tokenVerifier(token);
    if (!data) {
        throw new Error("No token data")
    }

    const rolesClaim = data["urn:zitadel:iam:org:project:roles"];
    const roles = rolesClaim ? Object.keys(rolesClaim) : [];
    return roles;
}

authRouter.get("/config", (req, res) => {
    if (ZITADEL_CLIENT_ID == null || ZITADEL_DOMAIN == null) {
        return res.status(404).json({
            message: "Not found"
        })
    }
    res.json({
        zitadel_domain: ZITADEL_DOMAIN,
        zitadel_client_id: ZITADEL_CLIENT_ID,
        zitadel_use_roles: ZITADEL_USE_ROLES
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

// Check if create role exists
const role_createCheckMiddleware: RequestHandler = async (req, res, next) => {
    if (ZITADEL_USE_ROLES == false) {
        return next();
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    try {
        const roles = await getRoles(token);
        if (roles.includes("meet_create")) {
            return next()
        } else {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }
    } catch (error) {
        console.error(error)
        return res.status(401).json({
            message: "Unauthorized"
        })
    }
}


export { authRouter, checkJwt, role_createCheckMiddleware, getRoles }