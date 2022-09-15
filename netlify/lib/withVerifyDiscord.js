import { verifyKey } from "discord-interactions";
const CLIENT_PUBLIC_KEY = process.env.CLIENT_PUBLIC_KEY;

const withVerifyDiscord = (handler) => {
  return async (event, context) => {
    const signature = event.headers["x-signature-ed25519"];
    const timestamp = event.headers["x-signature-timestamp"];
    const isValidRequest = await verifyKey(
      event.body,
      signature,
      timestamp,
      CLIENT_PUBLIC_KEY
    );

    if (!isValidRequest) {
      console.log(`Provided signature does not match computed signature.`);
      return { statusCode: 401, body: "Bad request signature." };
    }

    return handler(event, context);
  };
};

export default withVerifyDiscord;
