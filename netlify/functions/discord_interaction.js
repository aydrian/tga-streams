import { InteractionResponseType, InteractionType } from "discord-interactions";
import { handleStreamers } from "../lib/interactionHandler";
import withVerifyDiscord from "../lib/withVerifyDiscord";

async function discordHandler(event, _context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed"
    };
  }

  const interaction = JSON.parse(event.body);

  if (interaction.type === InteractionType.PING) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        type: InteractionResponseType.PONG
      })
    };
  } else if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    console.log("Application Command data: ", interaction.data);

    if (interaction.data.name === "streamers") {
      const response = await handleStreamers(interaction);
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(response)
      };
    }
  }

  return { statusCode: 200 };
}

export const handler = withVerifyDiscord(discordHandler);
