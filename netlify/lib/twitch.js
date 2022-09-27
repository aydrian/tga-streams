import { ApiClient } from "@twurple/api";
import { ClientCredentialsAuthProvider } from "@twurple/auth";
import axios from "axios";

const authProvider = new ClientCredentialsAuthProvider(
  process.env.TWITCH_CLIENT_ID,
  process.env.TWITCH_CLIENT_SECRET
);

export const twitch = new ApiClient({ authProvider });

export const subscribe = async (userId, event, version = 1) => {
  const token = await authProvider.getAccessToken();
  const { data } = await axios.post(
    `https://api.twitch.tv/helix/eventsub/subscriptions`,
    {
      type: event,
      version,
      condition: {
        broadcaster_user_id: userId
      },
      transport: {
        method: "webhook",
        callback: "https://tga-streams.netlify.app/webhooks/twitch",
        secret: process.env.TWITCH_SIGNING_SECRET
      }
    },
    {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${token.accessToken}`
      }
    }
  );
  return data;
};
