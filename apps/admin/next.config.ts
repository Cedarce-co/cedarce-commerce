import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@cedarce/ui", "@cedarce/shared"],
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};
export default config;
