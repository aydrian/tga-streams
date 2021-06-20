import { twitch } from "./twitch";

const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

export const createEmbed = async (streamer) => {
  try {
    // random integer to help with Discord caching
    let embed = {
      color: 9520895,
      url: `https://twitch.tv/${streamer.twitch.name}`,
      author: { name: streamer.twitch.name }
    };
    const randInt = getRandomInt(999999);
    const stream = await twitch.helix.streams
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
            "-{width}x{height}",
            ""
          )}?r=${randInt}`
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
          url: `${game.boxArtUrl.replace("-{width}x{height}", "")}?r=${randInt}`
        };
      }
    }

    const twitchUser = await twitch.helix.users
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
    console.log(`Error creating embed for ${streamer.name}`, ex);
    return {};
  }
};
