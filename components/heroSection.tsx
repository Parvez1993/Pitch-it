import CurvedButton from "./CurvedButton";
import SearchForm from "./search-form";

async function HeroSection({ query }: { query?: string }) {
  return (
    <section className="teal_container">
      <CurvedButton />
      <h1 className="heading">
        Pitch Your Startup, <br />
        Pitch. Connect. Succeed.
      </h1>

      <p className="sub-heading !max-w-3xl">
        Share ideas. Network big. Rise higher.
      </p>

      <SearchForm query={query} />
    </section>
  );
}

export default HeroSection;
