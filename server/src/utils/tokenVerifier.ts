import { JwksClient } from "jwks-rsa";
import { ZITADEL_CLIENT_ID, ZITADEL_DOMAIN } from "../config";
import https from "https"
import jwt from "jsonwebtoken"
const client = new JwksClient({
    jwksUri: `${ZITADEL_DOMAIN}/oauth/v2/keys`,
    cache: true,
    rateLimit: true,
    // Keep requestAgent if using self-signed certs in local dev
    requestAgent: new https.Agent({ rejectUnauthorized: false })
});

// Helper function to dynamically retrieve signing key from JWKS
function getZitadelPublicKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

const tokenVerifier = (token: string): Promise<jwt.JwtPayload | undefined> => {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            getZitadelPublicKey,
            {
                issuer: ZITADEL_DOMAIN as string,
                audience: ZITADEL_CLIENT_ID as string,
                algorithms: ["RS256"]
            },
            (err, decoded) => {
                if (err) {
                    console.error("Socket authentication failed:", err.message);
                    return reject(new Error("Authentication error: Invalid or expired token"));
                }

                // Attach user payload (claims) to socket instance for downstream handlers
                resolve(decoded as jwt.JwtPayload)
            }
        );
    })

}

export default tokenVerifier