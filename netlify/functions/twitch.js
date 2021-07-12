import { MongoClient } from "mongodb";
import withVerifyTwitch from "../lib/withVerifyTwitch";
import { sendOffline, sendOnline } from "../lib/discord";

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.plqyk.mongodb.net/tgabot?retryWrites=true&w=majority`;

const revokeSub = async (subscription) => {
  console.log(
    `Revoking ${subscription.type} subscription for twitch user ${subscription.condition.broadcaster_user_id}`
  );
  let client;
  const type = subscription.type.replace(/\./g, "_");
  const id = subscription.condition.broadcaster_user_id;
  try {
    client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const collection = client.db("tgabot").collection("streamers");
    await collection.updateOne(
      { id },
      { $unset: { subscriptions: { [type]: "" } } }
    );
  } catch (err) {
    console.log(
      `An error occured revoking ${type} subscription for ${id}.`,
      err
    );
  } finally {
    if (client) {
      client.close();
    }
  }
};

async function twitchHandler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed"
    };
  }

  const body = JSON.parse(event.body);
  const messageType = event.headers["twitch-eventsub-message-type"];
  if (messageType === "webhook_callback_verification") {
    return {
      statusCode: 200,
      body: body.challenge
    };
  } else if (messageType === "revocation") {
    const { subscription } = body;
    await revokeSub(subscription);
    return {
      statusCode: 200
    };
  } else if (messageType === "notification") {
    const {
      event,
      subscription: { type }
    } = body;

    console.log(
      `Receiving ${type} request for ${event.broadcaster_user_name}: `,
      event
    );

    let client;
    try {
      client = await MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      const collection = client.db("tgabot").collection("streamers");
      const streamer = await collection.findOne({
        "twitch.id": event.broadcaster_user_id
      });

      if (type === "stream.online") {
        if (!streamer.online) {
          const message = await sendOnline(streamer);
          await collection.updateOne(
            { id: streamer.id },
            { $set: { online: message.id } }
          );
        }
      } else if (type === "stream.offline") {
        if (streamer.online) {
          await sendOffline(streamer);
          await collection.updateOne(
            { id: streamer.id },
            { $set: { online: false } }
          );
        }
      }
    } catch (ex) {
      console.log(
        `An error occurred sending the ${type} notification for ${event.broadcaster_user_name}: `,
        ex
      );
    } finally {
      if (client) {
        client.close();
      }
    }
  }

  return {
    statusCode: 200
  };
}

export const handler = withVerifyTwitch(twitchHandler);
