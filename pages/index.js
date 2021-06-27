import Head from "next/head";
import Header from "@components/Header";
import Footer from "@components/Footer";

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>TGA Streams 🏳️‍🌈</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Header title="Welcome to TGA Streams! 🏳️‍🌈" />
        <p className="description">
          Watch <code>#going-live</code> on the TGA Discord for stream updates.
        </p>
      </main>

      <Footer />
    </div>
  );
}
