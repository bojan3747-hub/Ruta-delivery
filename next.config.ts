import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Podiže default od 1mb da bi upload PDF-a sa Opštim uslovima prošao.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
