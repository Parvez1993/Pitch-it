import { auth, signIn, signOut } from "@/auth";
import Image from "next/image";
import Link from "next/link";

async function Navbar() {
  const session = await auth();

  return (
    <div className="bg-white py-2 px-6 flex items-center justify-between">
      <Link href="/" className="cursor-pointer">
        <Image src="/logo.png" width={"80"} height={"30"} alt="YC Logo"></Image>
      </Link>

      <div className="flex gap-[30px] items-center">
        {session && session?.user ? (
          <>
            <Link href="/startup/create">
              <div className="font-semibold text-black">Create</div>
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
              className="font-semibold text-red-600"
            >
              <button type="submit">Logout</button>
            </form>
            <Link href={`/user/${session?.id}`}>
              <div className="font-semibold text-black">
                <Image
                  src={session?.user?.image}
                  alt={session?.user?.name}
                  width={36}
                  height={36}
                  className="rounded-full border border-solid border-white"
                  objectFit="cover"
                  objectPosition="center"
                />
              </div>
            </Link>
          </>
        ) : (
          <>
            <form
              action={async () => {
                "use server";
                await signIn({ provider: "github" });
              }}
              className="font-semibold text-black cursor-pointer"
            >
              <button type="submit">Login</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;
