import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const saveStream = async (stream, streamer) => {
  const upsertStream = await prisma.stream.upsert({
    where: { id: stream.id },
    create: {
      id: stream.id,
      title: stream.title,
      gameName: stream.gameName,
      startedAt: stream.startDate,
      streamerId: streamer.id
    },
    update: {
      title: stream.title,
      gameName: stream.gameName,
      startedAt: stream.startDate,
      streamerId: streamer.id
    }
  });
  return upsertStream;
};

export const findStream = async (streamerId) => {
  // Find stream where streamer_id equal broadcaster_user_id AND end_at is null
  const findFirstStream = await prisma.stream.findFirst({
    orderBy: {
      startedAt: "desc"
    },
    select: {
      id: true,
      gameName: true,
      Notification: true
    },
    where: {
      streamerId,
      AND: {
        endedAt: null
      }
    }
  });
  return findFirstStream;
};

export const updateStream = async (streamId) => {
  const updateStream = await prisma.stream.update({
    data: {
      endedAt: new Date()
    },
    where: {
      id: streamId
    }
  });
  return updateStream;
};

// Discord Message Object: https://discord.com/developers/docs/resources/channel#message-object
export const saveNotification = async (streamId, message) => {
  const { id: messageId, channel_id: channelId } = message;
  await prisma.notification.create({
    data: {
      streamId,
      channelId,
      messageId
    }
  });
};

export const revokeSubscription = async (id) => {
  const subscription = await prisma.subscription.delete({
    where: {
      id
    }
  });

  return subscription;
};

export const getDiscordUser = async (twitchId) => {
  const discordUser = await prisma.streamer.findUnique({
    select: { discordId: true, discordName: true },
    where: { twitchId }
  });

  return discordUser;
};

export const hasProcessed = async (messageId) => {
  const count = await prisma.eventSubMessage.count({
    where: { messageId }
  });

  return count > 0;
};

export const saveMessage = async (messageId, messageType, payload) => {
  const result = await prisma.eventSubMessage.create({
    data: {
      messageId,
      messageType,
      payload
    }
  });

  return result;
};

export const getStreamers = async () => {
  const streamers = await prisma.streamer.findMany({
    select: {
      twitchName: true,
      discordName: true,
      Stream: {
        where: {
          endedAt: null
        }
      },
      _count: {
        select: {
          Subscriptions: true
        }
      }
    },
    orderBy: { discordName: "asc" }
  });

  return streamers;
};

export const addStreamer = async (
  discordId,
  discordName,
  twitchId,
  twitchName,
  profileImgUrl
) => {
  const result = prisma.streamer.create({
    data: { discordId, discordName, twitchId, twitchName, profileImgUrl }
  });
  return result;
};
