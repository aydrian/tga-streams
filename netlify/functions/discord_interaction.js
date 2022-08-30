import { InteractionResponseType, InteractionType } from "discord-interactions";

import withVerifyDiscord from "netlify/lib/withVerifyDiscord";

async function discordHandler(event, _context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed"
    };
  }

  const interaction = JSON.parse(event.body);
  console.log(interaction);

  if (interaction.type === InteractionType.PING) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        type: InteractionResponseType.PONG
      })
    };
  } else if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `You used: ${interaction.data.name}`
        }
      })
    };
  }
}

export const handler = withVerifyDiscord(discordHandler);
