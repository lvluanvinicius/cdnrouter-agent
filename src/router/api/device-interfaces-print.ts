import { RouterOSAPI } from "node-routeros";
import { DeviceInterfaces } from "../interfaces/device-interfaces";

export const deviceInterfacesPrint = async (
  session: RouterOSAPI,
  _id: string
) => {
  const response = await session.write("/interface/print");

  if (response.length <= 0) {
    return;
  }

  const interfaces = response as DeviceInterfaces[];

  return interfaces;
};
