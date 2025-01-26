import { auth } from "@/auth";
import StartupForm from "@/components/startupForm";

import { redirect } from "next/dist/server/api-utils";
import React from "react";

async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  return (
    <>
      <section className="teal_container !min-h-[230px]">
        <h1 className="heading">Submit your startup pitch</h1>
      </section>

      <StartupForm />
    </>
  );
}

export default Page;
