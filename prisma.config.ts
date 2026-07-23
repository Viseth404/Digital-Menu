import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: "apps/web/.env" });

export default defineConfig({
  schema: "apps/web/prisma/schema.prisma",
});
