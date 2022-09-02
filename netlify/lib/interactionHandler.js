import { InteractionResponseType } from "discord-interactions";
import { getStreamers } from "./db";
import { CHANNELS } from "./discord";

export const handleStreamers = async (interaction) => {
  const command = interaction.data;
  const subcommand = command.options[0];

  if (subcommand.name === "list") {
    const response = await getListStreamersResponse();
    return response;
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `You used: ${command.name} ${subcommand.name}`
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
