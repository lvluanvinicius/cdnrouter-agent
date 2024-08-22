import { env } from "../env";
import axios from "axios";

export const cdnrouter = axios.create({
  baseURL: `${env.URL_API_CDNROUTER}/api`,
});
