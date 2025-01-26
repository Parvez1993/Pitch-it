import { StartupTypeCard } from "@/app/(root)/page";
import React from "react";
import BusinessPlanCard from "./business-plan-card";
import { STARTUPS_BY_AUTHOR_QUERY } from "@/sanity/lib/queries";
import { client } from "@/sanity/lib/client";

async function UserBusinessPlans({ id }: { id: string }) {
  const business_plans = await client.fetch(STARTUPS_BY_AUTHOR_QUERY, { id });
  return (
    <div>
      {business_plans.length > 0 ? (
        business_plans.map((startup: StartupTypeCard) => (
          <BusinessPlanCard key={startup._id} item={startup} />
        ))
      ) : (
        <p className="no-result">No posts yet</p>
      )}
    </div>
  );
}

export default UserBusinessPlans;
