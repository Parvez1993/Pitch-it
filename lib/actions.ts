"use server";

import { auth } from "@/auth";
import { writeClient } from "@/sanity/lib/write-client";
import slugify from "slugify";
import { parseServerActionResponse } from "./utils";
export const createStartupIdea = async (
  state: any,
  form: any,
  pitch: string
) => {
  const session = await auth();
  if (!session) {
    return {
      status: "ERROR",
      message: "You must be signed in to submit a startup idea.",
    };
  }

  try {
    const { title, description, category, link } = form;
    const slug = slugify(title, { lower: true, strict: true });
    try {
      const startup = {
        title,
        description,
        category,
        image: link,
        slug: {
          _type: slug,
          current: slug,
        },
        author: {
          _type: "reference",
          _ref: session?.id,
        },
        pitch,
      };
      const result = await writeClient.create({ _type: "startup", ...startup });

      return parseServerActionResponse({
        ...result,
        error: "",
        status: "SUCCESS",
      });
    } catch (error) {
      return parseServerActionResponse({
        error: JSON.stringify(error),
        status: "ERROR",
      });
    }
  } catch (error) {
    return {
      status: "ERROR",
      message: "Failed to submit startup idea. Please try again.",
    };
  }
};
