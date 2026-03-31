import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  transpilePackages: ["pdfmake"],
};

const withNextIntl = createNextIntlPlugin(
  "./src/shared/configs/i18/request.ts",
);

export default withNextIntl(nextConfig);
