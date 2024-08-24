import { RouterOSAPI } from "node-routeros";

export const routerosClient = (
  username: string,
  password: string,
  host: string,
  port: number | null
) => {
  if (!port) {
    port = 8728;
  }

  return new RouterOSAPI({
    host,
    user: username,
    password: password,
    port,
    timeout: 3000,
    keepalive: true,
  });
};
