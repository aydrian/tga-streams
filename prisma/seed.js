const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const streamers = require("./streamers.json");

async function seed() {
  await Promise.all(
    streamers.map((streamer) => {
      const data = {
        twitchId: streamer.twitch.id,
        twitchName: streamer.twitch.name,
        discordId: streamer.id,
        discordName: streamer.name,
        Subscriptions: {
          create: [
            { id: streamer.subscriptions.stream_online, type: "stream.online" },
            {
              id: streamer.subscriptions.stream_offline,
              type: "stream.offline"
            }
          ]
        }
      };

      return db.streamer.create({ data });
    })
  );
}

seed();
