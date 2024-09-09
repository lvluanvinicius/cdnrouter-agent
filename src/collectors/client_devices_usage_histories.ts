import { Prisma } from "@prisma/client";
import { toUTCDate } from "../lib/formatter";
import { prisma } from "../lib/prisma";
import { queuePrint } from "../router/queue-print";
import { RouterOSAPI } from "node-routeros";

export async function client_devices_usage_histories(
  session: RouterOSAPI,
  ClientDevices: Prisma.ClientDevicesGetPayload<{
    include: {
      ClientDeviceSessions: true;
    };
  }>[]
) {
  for (let cDv of ClientDevices) {
    if (!cDv.mk_arp_id) {
      continue;
    }

    // Recuperando dados em tempo real.
    const queue = await queuePrint(session, cDv.mk_arp_id);

    if (!queue) continue;

    // Recuperando upload e download.
    const [upload, download] = queue.rate.split("/");

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
}
