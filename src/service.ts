#!/usr/bin/env node

import { getCurrentDate, toUTCDate } from "./lib/formatter";
import { prisma } from "./lib/prisma";
import { routerosClient } from "./lib/routeros";
import { queuePrint } from "./router/queue-print";

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

    for (let cDv of ClientDevices) {
      if (!cDv.mk_arp_id) {
        continue;
      }

      // Recuperando dados em tempo real.
      const queue = await queuePrint(connect, cDv.mk_arp_id);

      if (!queue) continue;

      // Recuperando upload e download.
      const [download, upload] = queue.rate.split("/");

      // Convertendo valores em inteiro.
      let d = parseInt(download);
      let u = parseInt(upload);

      // Recuperando objeto de sessão.
      const { ClientDeviceSessions } = cDv;

      // Valida se há alguma sessão para esse dispositivo.
      if (ClientDeviceSessions.length <= 0) continue;

      const deviceSession = ClientDeviceSessions[0];

      // Recupernado data.
      const updatedAt = toUTCDate(new Date().toString());

      // Cria um history da sessão no time de coleta.
      await prisma.clientDevicesUsageHistories.create({
        data: {
          device_session_fk: deviceSession.id,
          upload: u,
          download: d,
          collection_date: updatedAt,
        },
      });

      // Atualizando valores de upload e download.
      d += deviceSession.download;
      u += deviceSession.upload;

      // Atualizando valores de upload e download.
      await prisma.clientDeviceSessions.update({
        where: {
          id: deviceSession.id,
        },
        data: {
          download: d,
          upload: u,
          updated_at: updatedAt, //getCurrentDate(),
        },
      });
    }

    prisma.$disconnect;
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
