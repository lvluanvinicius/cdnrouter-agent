#!/usr/bin/env node

import { client_devices_queues_usage_histories } from "./collectors/client_devices_queues_usage_histories";
import { toUTCDate } from "./lib/formatter";
import { prisma } from "./lib/prisma";
import { routerosClient } from "./lib/routeros";
import { deviceInterfacesPrint } from "./router/api/device-interfaces-print";

async function main() {
  const masterDevices = await prisma.devices.findMany({
    where: {
      is_active: true,
      is_provisioned: true,
    },

    include: {
      DeviceUsers: {
        where: {
          default: true,
        },
        take: 1,
      },
      ClientDevices: {
        where: {
          is_active: true,
        },
        include: {
          ClientDeviceSessions: {
            where: {
              stop_time: null,
            },
            take: 1,
          },
        },
      },
    },
  });

  for (let device of masterDevices) {
    const { DeviceUsers, ClientDevices } = device;

    if (DeviceUsers.length <= 0) {
      continue;
    }

    const { host, port, username, password } = DeviceUsers[0];
    const client = routerosClient(username, password, host, port);
    const connect = await client.connect();

    const [seconds, nanoseconds] = process.hrtime();

    // Carregando dados de uso de dispositivos de clientes.
    // await client_devices_usage_histories(connect, ClientDevices);

    // Carregando dados das interfaces do dispositivo master.

    const interfaces = await deviceInterfacesPrint(connect, "");
    console.log(interfaces);

    console.log(seconds, nanoseconds);

    await prisma.$disconnect();
    connect.close(); // Encerra a conexão com o device.
  }
}

setInterval(async () => {
  console.log(
    `[${toUTCDate(
      new Date().toString()
    )}] Iniciando coleta de download e upload.`
  );

  await main();

  console.log(
    `[${toUTCDate(
      new Date().toString()
    )}] coleta de upload e download concluída.`
  );
}, 5000);
