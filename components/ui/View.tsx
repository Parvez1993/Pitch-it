import { client } from "@/sanity/lib/client";
import { STARTUPS_VIEWS } from "@/sanity/lib/queries";
import { writeClient } from "@/sanity/lib/write-client";
import Ping from "../ping";

const View = async ({ id }: { id: string }) => {
  try {
    const { views: totalViews } = await client
      .withConfig({ useCdn: false })
      .fetch(STARTUPS_VIEWS, { id });

    // Increment views directly in the server component
    await writeClient
      .patch(id)
      .set({ views: totalViews + 1 })
      .commit();

    return (
      <div className="view-container">
        <div className="absolute -top-2 -right-2">
          <Ping />
        </div>
        <p className="view-text">
          <span className="font-black">Views: {totalViews}</span>
        </p>
      </div>
    );
  } catch (error) {
    console.error("Error updating views:", error);
    return <p className="error-text">Unable to update views</p>;
  }
};

export default View;
