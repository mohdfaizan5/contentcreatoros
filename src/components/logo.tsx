import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const Logo = ({
  full = false,
  width = 30,
  height = 30,
  link = true,
  className,
  textClassName,
  href,
}: {
  full?: boolean;
  link?: boolean;
  width?: number;
  height?: number;
  className?: string;
  textClassName?: string;
  href?: string;
}) => {
  const content = (
    <>
      <Image
        src={"/logotemp.svg"}
        width={width}
        height={height}
        alt="ContentOS logo"
      />
      {full && <span className={cn("-ml-1", textClassName)}>ContentOS</span>}
    </>
  );

  if (link) {
    return (
      <Link
        href={href || "/"}
        className={cn("flex items-center text-xl font-light font-bbh", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center text-xl font-light font-bbh", className)}>
      {content}
    </div>
  );
};

export default Logo;
