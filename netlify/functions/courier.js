import { MongoClient } from "mongodb";
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.plqyk.mongodb.net/tgabot?retryWrites=true&w=majority`;

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed"
    };
  }
  const { data, type } = JSON.parse(event.body);

  if (type === "message:updated" && data.status === "DELIVERED") {
    const messageId = data.id;
    const discord = data.providers.find(
      (provider) => provider.provider === "discord"
    );
    if (!discord) {
      return { statusCode: 200 };
    }
    let client;
    try {
      client = await MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      const collection = client.db("tgabot").collection("streamers");
      await collection.updateOne(
        { messageId },
        { $set: { online: discord.reference.id } }
      );
    } catch (ex) {
      console.log(
        `An error occurred saving the Discord Id for MessageId: ${messageId}.`,
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
