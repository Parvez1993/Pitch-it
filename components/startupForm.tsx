"use client";
import React, { useActionState, useEffect } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MDEditor from "@uiw/react-md-editor";
import { formSchema } from "@/lib/validation";

import { createStartupIdea } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

function StartupForm() {
  const [pitch, setPitch] = React.useState("");
  const { toast } = useToast();
  const router = useRouter();

  async function submitStartupForm(prevState: any, formData: FormData) {
    try {
      const data = {
        title: formData.get("title")?.toString() ?? "",
        description: formData.get("description")?.toString() ?? "",
        category: formData.get("category")?.toString() ?? "",
        link: formData.get("link")?.toString() ?? "",
        pitch,
      };

      // Validate data
      const formSchemaData = await formSchema.safeParseAsync(data);

      if (!formSchemaData.success) {
        toast({
          title: "Validation Error",
          description: "Please check your form inputs",
          variant: "destructive",
        });

        return {
          status: "VALIDATION_ERROR",
          errors: formSchemaData.error.flatten().fieldErrors,
          data: data,
        };
      }

      const result = await createStartupIdea(
        prevState,
        formSchemaData.data,
        pitch
      );

      if (result.status === "SUCCESS") {
        toast({
          title: "Success",
          description: "Your startup pitch has been created successfully",
        });
        setPitch("");
        router.push(`/startup/${result._id}`);

        return {
          status: "SUCCESS",
          message: result.message,
          data: null,
        };
      }

      // Handle server-side errors
      toast({
        title: "Error",
        description: result.error?.message || "An unexpected error occurred",
        variant: "destructive",
      });

      return {
        status: "ERROR",
        errors: result.error || {},
        data: formSchemaData.data,
      };
    } catch (error) {
      toast({
        title: "Unexpected Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });

      return {
        status: "ERROR",
        message: "An unexpected error occurred",
        errors: {},
      };
    }
  }

  const [state, formAction] = useActionState(submitStartupForm, {
    status: "INITIAL",
    errors: {},
    data: null,
  });

  // Restore form data on error
  useEffect(() => {
    if (state.status === "VALIDATION_ERROR" && state.data) {
      const { title, description, category, link } = state.data;

      // Reset form fields
      (document.getElementById("title") as HTMLInputElement).value =
        title || "";
      (document.getElementById("description") as HTMLTextAreaElement).value =
        description || "";
      (document.getElementById("category") as HTMLInputElement).value =
        category || "";
      (document.getElementById("link") as HTMLInputElement).value = link || "";
      setPitch(state.data.pitch || "");
    }
  }, [state]);

  return (
    <form action={formAction} className="startup-form space-y-4">
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="startup-form_label">
          Title
        </label>
        <Input
          id="title"
          name="title"
          className="startup-form_input"
          placeholder="Startup Title"
        />
        {state.errors?.title && (
          <p className="text-red-500">{state.errors.title[0]}</p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="startup-form_label">
          Description
        </label>
        <Textarea
          id="description"
          name="description"
          className="startup-form_textarea"
          placeholder="Description"
        />
        {state.errors?.description && (
          <p className="text-red-500">{state.errors.description[0]}</p>
        )}
      </div>

      {/* Category Field */}
      <div>
        <label htmlFor="category" className="startup-form_label">
          Category
        </label>
        <Input
          id="category"
          name="category"
          className="startup-form_input"
          placeholder="Category (Tech, Developer, etc.)"
        />
        {state.errors?.category && (
          <p className="text-red-500">{state.errors.category[0]}</p>
        )}
      </div>

      {/* Image URL Field */}
      <div>
        <label htmlFor="link" className="startup-form_label">
          Image URL
        </label>
        <Input
          id="link"
          name="link"
          className="startup-form_input"
          placeholder="Startup Image Link"
        />
        {state.errors?.link && (
          <p className="text-red-500">{state.errors.link[0]}</p>
        )}
      </div>

      {/* Pitch Field */}
      <div data-color-mode="light">
        <label htmlFor="pitch" className="startup-form_label">
          Pitch
        </label>
        <MDEditor
          id="pitch"
          name="pitch"
          value={pitch}
          onChange={(value) => setPitch(value as string)}
          preview="edit"
          height={300}
          style={{
            borderRadius: 20,
            overflow: "hidden",
            marginTop: "12px",
          }}
          textareaProps={{
            placeholder: "Just Pitch It",
            name: "pitch",
          }}
          previewOptions={{
            disallowedElements: ["style"],
          }}
        />
        {state.errors?.pitch && (
          <p className="text-red-500">{state.errors.pitch[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <button type="submit" className="startup-form_btn w-full">
        Submit
      </button>
    </form>
  );
}

export default StartupForm;
