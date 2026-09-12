import { cn } from "../../utils";
import Image from "next/image";

export function Logo({
  className,
  src = "/assets/logo/logo-lg-300.png",
  alt = "BeltaCourses",
  width = 570,
  height = 100,
}: {
  className?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      height={height}
      width={width}
      className={cn("h-auto", className)}
    />
  );
}
