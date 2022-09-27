import { InteractionResponseType } from "discord-interactions";
import { getStreamers, addStreamer, prisma } from "./db";
import { CHANNELS, getGuildMember } from "./discord";
import { subscribe, twitch } from "./twitch";

export const handleStreamers = async (interaction) => {
  const command = interaction.data;
  const subcommand = command.options[0];

  if (subcommand.name === "list") {
    const response = await getListStreamersResponse();
    return response;
  } else if (subcommand.name === "add") {
    const [userOpt, twitchOpt] = subcommand.options;
    console.log(userOpt);

    const response = await getAddStreamersResponse(
      userOpt.value,
      twitchOpt.value
    );

    return response;
  } else if (subcommand.name === "remove") {
    const [userOpt] = subcommand.options;

    const response = await getRemoveStreamerResponse(userOpt.value);
    return response;
  } else if (subcommand.name === "subscribe") {
    const [userOpt] = subcommand.options;

    const response = await getSubStreamerResponse(userOpt.value);
    return response;
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `You used: ${command.name} ${subcommand.name}`
    }
  };
};

const getAddStreamersResponse = async (discordId, twitchName) => {
  const twitchUser = await twitch.users.getUserByName(twitchName);
  const twitchId = twitchUser.id;
  const profileImgUrl = twitchUser.profilePictureUrl;
  const guildMember = await getGuildMember(discordId);
  console.log("Guild Member: ", guildMember);
  const discordName = guildMember.nick || guildMember.user.username;
  console.log("Discord Name: ", discordName);

  let content = "";

  try {
    await addStreamer(
      discordId,
      discordName,
      twitchId,
      twitchName,
      profileImgUrl
    );
    content = `<@${discordId}> successfully added as streamer.`;
  } catch (err) {
    console.log(err);
    content = `An error occurred adding <@${discordId}> as a streamer.`;
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: 1 << 6
    }
  };
};

const getRemoveStreamerResponse = async (discordId) => {
  let content = "";

  try {
    const streamer = await prisma.streamer.findUnique({
      select: { Subscriptions: { select: { id: true } } },
      where: { discordId }
    });

    const unsubs = streamer.Subscriptions.map((sub) => {
      return twitch.eventSub.deleteSubscription(sub.id);
    });

    if (unsubs.length > 0) {
      await Promise.all(unsubs);
    }

    await prisma.streamer.delete({ where: { discordId } });

    content = `<@${discordId}> successfully removed as a streamer.`;
  } catch (err) {
    console.log(err);
    content = `An error occurred removing <@${discordId}> as a streamer.`;
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: 1 << 6
    }
  };
};

const getSubStreamerResponse = async (discordId) => {
  let content = "";
  try {
    const streamer = await prisma.streamer.findUnique({
      select: { twitchId: true },
      where: { discordId }
    });

    if (!streamer) {
      content = `<@${discordId}> is not a streamer.`;
    } else {
      const subOnline = await subscribe(streamer.twitchId, "stream.online");

      await prisma.subscription.create({
        data: {
          streamerId: streamer.twitchId,
          type: "stream.online",
          id: subOnline.data[0].id
        }
      });

      const subOffline = await subscribe(streamer.twitchId, "stream.offline");
      await prisma.subscription.create({
        data: {
          streamerId: streamer.twitchId,
          type: "stream.offline",
          id: subOffline.data[0].id
        }
      });
    }
    content = `Successfully subscribed to <@${discordId}> stream notifications.`;
  } catch (err) {
    console.log(err);
    content = `An error occurred subscribing to <@${discordId}> stream notifications.`;
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: 1 << 6
    }
  };
};

const getListStreamersResponse = async () => {
  const content = [`**TGA Streamers**`];
  const streamers = await getStreamers();

  for (const streamer of streamers) {
    content.push(
      `${streamer.Stream.length > 0 ? "🔴 " : ""}${streamer.discordName}: ${
        streamer.twitchName
      } <https://twitch.tv/${streamer.twitchName}> ${
        streamer._count.Subscriptions > 0 ? "✅" : ""
      }`
    );
  }

  content.push("");
  content.push(`*Streamers with 🔴 are currently online*`);
  content.push(
    `*Online/Offline notifications in <#${CHANNELS.GOING_LIVE}> for streamers with a ✅*`
  );

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: content.join("\n")
    }
  };
};
