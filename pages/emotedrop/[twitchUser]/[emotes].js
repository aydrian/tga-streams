import { ChatProvider } from "@context/chat";
import { EmoteDrop } from "@components/EmoteDrop";

export default function EmoteDropOverlay({ twitchUser, emotes }) {
  return (
    <ChatProvider channels={[twitchUser]}>
      <EmoteDrop filter={emotes} />
    </ChatProvider>
  );
}

export async function getServerSideProps(context) {
  const { twitchUser, emotes: strEmotes = "" } = context.query;
  const emotes = strEmotes.length > 0 ? strEmotes.split(",") : ["CorgiDerp"];

  return { props: { twitchUser, emotes } };
}
