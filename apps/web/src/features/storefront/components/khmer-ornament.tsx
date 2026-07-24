import Image from "next/image";
import { STOREFRONT_ASSETS } from "@/features/storefront/constants";

type KhmerOrnamentProps = {
  className?: string;
  size?: number;
  alt?: string;
  priority?: boolean;
};

export function KhmerOrnament({
  className,
  size = 128,
  alt = "",
  priority = false,
}: KhmerOrnamentProps) {
  return (
    <Image
      src={STOREFRONT_ASSETS.khmerOrnament}
      alt={alt}
      width={size}
      height={size}
      aria-hidden={alt ? undefined : true}
      priority={priority}
      className={className}
    />
  );
}
