import withVerifyTwitch from "../lib/withVerifyTwitch";
import {
  handleRevokeSubscription,
  handleStreamOffline,
  handleStreamOnline
} from "../lib/eventHandlers";
import { hasProcessed, saveMessage } from "../lib/db";

async function twitchHandler(event, _context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed"
    };
  }

  const messageId = event.headers["twitch-eventsub-message-id"];
  try {
    const dontContinue = await hasProcessed(messageId);
    if (dontContinue) {
      console.log(`Already processed message-id: ${messageId}`);
      return {
        statusCode: 200
      };
    }
  } catch (ex) {
    console.log(`An error occurred looking up message-id: ${messageId}`, ex);
  }

  const body = JSON.parse(event.body);
  const messageType = event.headers["twitch-eventsub-message-type"];
  if (messageType === "webhook_callback_verification") {
    return {
      statusCode: 200,
      body: body.challenge
    };
  } else if (messageType === "revocation") {
    const { subscription } = body;
    await handleRevokeSubscription(subscription);
  } else if (messageType === "notification") {
    const {
      event,
      subscription: { type }
    } = body;

    console.log(
      `Receiving ${type} request for ${event.broadcaster_user_name} (${messageId}):  `,
      event
    );

    if (type === "stream.online") {
      await handleStreamOnline(event);
    } else if (type === "stream.offline") {
      await handleStreamOffline(event);
    }
  }

  try {
    await saveMessage(messageId, messageType, body);
  } catch (ex) {
    console.log(`An error occured saving message-id: ${messageId}`, ex);
  }

  return {
    statusCode: 200
  };
}

export const handler = withVerifyTwitch(twitchHandler);
