import { RouterOSAPI } from "node-routeros";
import { RouterOSQueues } from "./interfaces/simple-queue";

export const queuePrint = async (session: RouterOSAPI, _id: string) => {
  const response = await session.write("/queue/simple/print", [
    "stats",
    `?.id=${_id}`,
  ]);

  if (response.length <= 0) {
    return;
  }

  const queues = response as RouterOSQueues[];

  return queues[0];
};
