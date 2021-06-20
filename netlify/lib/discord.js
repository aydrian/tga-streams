import { twitch } from "./twitch";

const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
};

export const createEmbed = async (streamer) => {
  try {
    // random integer to help with Discord caching
    const randInt = getRandomInt(999999);
    const stream = await twitch.helix.streams
      .getStreamByUserId(streamer.twitch.id)
      .catch((ex) => {
        console.log(
          `An error occurred retrieving stream for ${streamer.name}.`,
          ex
        );
      });

    const twitchUser = await twitch.helix.users
      .getUserById(streamer.twitch.id)
      .catch((ex) => {
        console.log(
          `An error occurred retrieving twitch user for ${streamer.name}.`,
          ex
        );
      });
    const game = await stream.getGame().catch((ex) => {
      console.log(
        `An error occurred retrieving game for ${streamer.name}.`,
        ex
      );
    });

    const embed = {
      title: stream.title,
      url: `https://twitch.tv/${streamer.twitch.name}`,
      color: 9520895,
      author: {
        name: streamer.twitch.name,
        icon_url: twitchUser.profilePictureUrl
      },
      image: {
        url: `${stream.thumbnailUrl.replace(
          "-{width}x{height}",
          ""
        )}?r=${randInt}`
      }
    };
    if (game) {
      embed.description = `Playing ${game.name}`;
      embed.thumbnail = {
        url: `${game.boxArtUrl.replace("-{width}x{height}", "")}?r=${randInt}`
      };
    }
    return embed;
  } catch (ex) {
    console.log(`Error creating embed for ${streamer.name}`, ex);
    return {};
  }
};
