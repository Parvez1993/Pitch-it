/* eslint-disable @next/next/no-img-element */
import { formatDate } from "@/lib/utils";
import { EyeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Author, Startup } from "@/sanity/types";
import { StartupTypeCard } from "@/app/(root)/page";

function BusinessPlanCard({ item }: { item: StartupTypeCard }) {
  return (
    <Link href={`/startup/${item?._id}`}>
      <li className="startup-card group">
        <div className="flex-between">
          <p className="startup_card_date">{formatDate(item._createdAt)}</p>
          <div className="flex gap-1.5">
            <EyeIcon className="size-6 text-primary" />
            <span className="text-16-medium">{item.views}</span>
          </div>
        </div>

        <div className="flex-between mt-5 gap-5">
          <div className="flex-1">
            <Link href={`/startup/${item?._id}`}>
              <p className="text-16-medium line-clamp-1">{item.title}</p>
            </Link>
            <Link href={`/startup/${item?._id}`}>
              <h3 className="text-26-semibold line-clamp-1">
                {item?.author?.name}
              </h3>
            </Link>
          </div>
          <Link href={`/startup/${item?._id}`}>
            <Image
              src={item?.author?.image}
              alt={"business-plan"}
              width={48}
              height={48}
              className="rounded-full"
            />
          </Link>
        </div>
        <Link href={`/startup/${item?._id}`}>
          <p className="startup-card_desc">{item.description}</p>

          <img
            src={item?.image}
            alt="placeholder"
            className="startup-card_img"
            loading="lazy"
          />
        </Link>

        <div className="flex-between gap-3 mt-5">
          <Link href={`/startup/${item?._id}`}>
            <p className="text-16-medium">{item.category}</p>
          </Link>
          <Button className="startup-card_btn" asChild>
            <Link href={`/startup/${item?._id}`}>Details</Link>
          </Button>
        </div>
      </li>
    </Link>
  );
}

export default BusinessPlanCard;
