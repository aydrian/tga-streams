import axios from "axios";
import { twitch } from "./twitch";

const CHANNELS = {
  BOT_TESTING: "785256298203447296",
  GOING_LIVE: "775445396776288318"
};

export const createMessage = async (channelId, msgData) => {
  const { data } = await axios.post(
    `https://discord.com/api/channels/${channelId}/messages`,
    msgData,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
  return data;
};

export const createEmbed = async (streamer) => {
  try {
    let embed = {
      color: 9520895,
      url: `https://twitch.tv/${streamer.twitch.name}`,
      author: { name: streamer.twitch.name }
    };

    const stream = await twitch.helix.streams
      .getStreamByUserId(streamer.twitch.id)
      .catch((ex) => {
        console.log(
          `An error occurred retrieving stream for ${streamer.name}.`,
          ex
        );
      });
    if (stream) {
      embed = {
        ...embed,
        title: stream.title,
        description: `Playing ${stream.gameName}`,
        image: {
          url: `${stream.thumbnailUrl.replace("{width}x{height}", "1280x720")}`
        }
      };

      const game = await stream.getGame().catch((ex) => {
        console.log(
          `An error occurred retrieving game for ${streamer.name}.`,
          ex
        );
      });
      if (game) {
        embed.thumbnail = {
          url: `${game.boxArtUrl.replace("-{width}x{height}", "")}`
        };
      }
    }

    const twitchUser = await twitch.helix.users
      .getUserById(streamer.twitch.id)
      .catch((ex) => {
        console.log(
          `An error occurred retrieving twitch user for ${streamer.name}.`,
          ex
        );
      });

    if (twitchUser) {
      embed.author.icon_url = twitchUser.profilePictureUrl;
    }
    return embed;
  } catch (ex) {
    console.log(`Error creating embed for ${streamer.name}`, ex);
    return {};
  }
};

export const sendOnline = async (streamer) => {
  const embed = await createEmbed(streamer);
  const message = createMessage(CHANNELS.GOING_LIVE, {
    content: `🔴 <@${streamer.id}> is now live on Twitch! https://twitch.tv/${streamer.twitch.name}`,
    embeds: [embed]
  });
  return message;
};

export const sendOffline = async (streamer) => {
  const message = createMessage(CHANNELS.GOING_LIVE, {
    content: `<@${streamer.id}>'s stream has ended.`,
    message_reference: {
      message_id: streamer.online
    }
  });
  return message;
};
