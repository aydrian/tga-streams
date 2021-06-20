import { CourierClient } from "@trycourier/courier";
import { createEmbed } from "./discord";

const courier = CourierClient();

export async function sendOnline(streamer) {
  const embed = await createEmbed(streamer);

  const { messageId } = await courier.send({
    event: "TGA_STREAMER_ONLINE",
    recipientId: "CHANNEL_GOING_LIVE",
    data: {
      streamer,
      embed
    }
  });
  console.log(
    `Online notification for ${streamer.name} sent. Message ID: ${messageId}.`
  );
  return messageId;
}

export async function sendOffline(streamer) {
  const { messageId } = await courier.send({
    eventId: "TGA_STREAMER_OFFLINE",
    recipientId: "CHANNEL_GOING_LIVE",
    data: {
      streamer,
      discord: {
        replyId: streamer.online
      }
    }
  });
  console.log(
    `Offline notification for ${streamer.name} sent. Message ID: ${messageId}.`
  );
  return messageId;
}

export async function discordAlert(type, message) {
  const { messageId } = await courier.send({
    eventId: "TGA_ALERT",
    recipientId: "CHANNEL_BOT_TESTING",
    data: {
      type,
      message
    }
  });
  return messageId;
}
