import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  URL_API_CDNROUTER: z.string().url(),
});

export const env = envSchema.parse(process.env);
