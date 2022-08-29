import {
  findStream,
  getDiscordUser,
  revokeSubscription,
  saveNotification,
  saveStream,
  updateStream
} from "./db";
import { sendOffline, sendOnline } from "./discord";
import { twitch } from "./twitch";

export const handleStreamOnline = async (event) => {
  const stream = await twitch.streams.getStreamByUserId(
    event.broadcaster_user_id
  );
  if (!stream) {
    console.log(`Stream for ${event.broadcaster_user_name} not found.`);
    return;
  }
  const discordUser = await getDiscordUser(event.broadcaster_user_id);
  const streamer = await stream.getUser();
  await saveStream(stream, streamer);
  const game = await stream.getGame();
  const message = await sendOnline(discordUser, stream, streamer, game);
  await saveNotification(stream.id, message);
};

export const handleStreamOffline = async (event) => {
  const findStreamResult = await findStream(event.broadcaster_user_id);
  if (!findStreamResult) {
    console.log(
      `Stream for ${event.broadcaster_user_name} not found in database.`
    );
    return;
  }

  await updateStream(findStreamResult.id);

  if (findStreamResult.Notification.length === 0) {
    console.log(`No notification saved for stream.`);
    return;
  }
  const [notif] = findStreamResult.Notification;
  const { data } = await twitch.videos.getVideosByUser(
    event.broadcaster_user_id,
    { limit: 1, orderBy: "time" }
  );
  const [video] = data;
  if (!video) {
    console.log(`Video for ${event.broadcaster_user_name} not found.`);
    return;
  }
  const discordUser = await getDiscordUser(event.broadcaster_user_id);
  await sendOffline(notif, discordUser, video);
};

export const handleRevokeSubscription = async (subscription) => {
  console.log(
    `Revoking ${subscription.type} subscription for twitch user ${subscription.condition.broadcaster_user_id}`
  );
  await revokeSubscription(subscription.id);
};
