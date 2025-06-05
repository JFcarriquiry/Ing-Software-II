import { createEvent } from 'ics';

interface ReservationICSOptions {
  restaurant: string;
  date: Date;
  guests: number;
}

export async function generateReservationICS(options: ReservationICSOptions): Promise<string> {
  const { restaurant, date, guests } = options;

  // Extraer fecha y hora
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // ics usa 1-based months
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  const event = {
    start: [year, month, day, hour, minute],
    duration: { hours: 2 }, // Duración estimada de la reserva
    title: `Reserva "${restaurant}" a las ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    description: `Reserva para ${guests} personas en ${restaurant}`,
    location: restaurant,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: restaurant }
  };

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) return reject(error);
      resolve(value);
    });
  });
}