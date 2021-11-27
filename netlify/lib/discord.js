import axios from "axios";
import { twitch } from "./twitch";

const CHANNELS = {
  BOT_TESTING: "785256298203447296",
  GOING_LIVE: "775445396776288318"
};

export const getMessage = async (channelId, messageId) => {
  const { data } = await axios.get(
    `https://discord.com/api/channels/${channelId}/messages/${messageId}`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );
  return data;
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

export const editMessage = async (channelId, messageId, msgData) => {
  const { data } = await axios.patch(
    `https://discord.com/api/channels/${channelId}/messages/${messageId}`,
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

export const createEmbed = async (streamer, online = true) => {
  if (online) {
    try {
      let embed = {
        color: 9520895,
        url: `https://twitch.tv/${streamer.twitch.name}`,
        author: { name: streamer.twitch.name }
      };

      const stream = await twitch.streams
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
            url: `${stream.thumbnailUrl.replace(
              "{width}x{height}",
              "1280x720"
            )}`
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

      const twitchUser = await twitch.users
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
      console.log(`Error creating online embed for ${streamer.name}`, ex);
      return {};
    }
  } else {
    try {
      const onlineMessage = await getMessage(
        CHANNELS.GOING_LIVE,
        streamer.online
      );
      const embed = onlineMessage.embeds[0];
      if (!embed) {
        return {};
      }

      const { data } = await twitch.videos.getVideosByUser(streamer.twitch.id, {
        limit: 1,
        orderBy: "time"
      });

      embed.color = 12632256;
      const video = data[0];
      if (video) {
        embed.title = video.title;
        embed.url = `https://twitch.tv/videos/${video.id}`;
        embed.image = {
          url: video.thumbnailUrl.replace("%{width}x%{height}", "1280x720")
        };
        embed.footer = {
          text: `Finished streaming • Streamed for ${video.duration}`
        };
      }

      return embed;
    } catch (ex) {
      console.log(`Error creating offline embed for ${streamer.name}`, ex);
      return {};
    }
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
  const embed = await createEmbed(streamer, false);
  const message = editMessage(CHANNELS.GOING_LIVE, streamer.online, {
    content: `<@${streamer.id}> was online.`,
    embeds: [embed]
  });
  return message;
};
