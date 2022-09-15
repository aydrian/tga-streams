import axios from "axios";

export const CHANNELS = {
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

export const createOnlineEmbed = async (stream, streamer, game) => {
  let embed = {
    color: 9520895,
    url: `https://twitch.tv/${streamer.name}`,
    author: { name: streamer.name }
  };

  if (stream) {
    embed = {
      ...embed,
      title: stream.title,
      description: `Playing ${stream.gameName}`,
      image: {
        url: `${stream.thumbnailUrl.replace("{width}x{height}", "1280x720")}`
      }
    };

    if (game) {
      embed.thumbnail = {
        url: `${game.boxArtUrl.replace("-{width}x{height}", "")}`
      };
    }
  }

  if (streamer) {
    embed.author.icon_url = streamer.profilePictureUrl;
  }

  return embed;
};

export const createOfflineEmbed = async (messageId, video) => {
  const onlineMessage = await getMessage(CHANNELS.GOING_LIVE, messageId);
  const embed = onlineMessage.embeds[0];
  if (!embed) {
    return {};
  }

  embed.color = 12632256;
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
};

export const sendOnline = async (discordUser, stream, streamer, game) => {
  const embed = await createOnlineEmbed(stream, streamer, game);
  const message = createMessage(CHANNELS.GOING_LIVE, {
    content: `🔴 <@${discordUser.discordId}> is now live on Twitch! https://twitch.tv/${streamer.name}`,
    embeds: [embed]
  });
  return message;
};

export const sendOffline = async (notif, discordUser, video) => {
  const embed = await createOfflineEmbed(notif.messageId, video);
  const message = editMessage(notif.channelId, notif.messageId, {
    content: `<@${discordUser.discordId}> was online.`,
    embeds: [embed]
  });
  return message;
};
