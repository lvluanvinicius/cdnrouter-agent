export function toUTCDate(dateString: string): Date {
  const date = new Date(dateString + "Z"); // Adiciona 'Z' para tratar como UTC
  return date;
}

export function getCurrentDate(date: Date) {
  const formatted = date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatted;
}
