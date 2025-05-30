import nodemailer from 'nodemailer';
import { generateReservationICS } from './calendar';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async (
  to: string,
  subject: string,
  text: string,
  attachments?: { filename: string; content: string; contentType: string }[]
) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `no-reply@${(process.env.FRONTEND_URL || '').replace(/https?:\/\//, '')}`,
    to,
    subject,
    text,
    attachments,
  });
};

export const sendReservationConfirmationEmail = async (
  email: string,
  restaurantName: string,
  guests: number,
  date: number
) => {
  const eventDate = new Date(date);
  const formattedDate = eventDate.toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Montevideo'
  });

  // Google Calendar date format: YYYYMMDDTHHmmSSZ
  const start = eventDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
const endDate = new Date(eventDate.getTime() + (1 * 60 + 15) * 60 * 1000);

  const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Reserva+${encodeURIComponent(restaurantName)}&dates=${start}/${end}&details=Reserva+para+${guests}+personas+en+${encodeURIComponent(restaurantName)}&location=${encodeURIComponent(restaurantName)}&sf=true&output=xml`;

  await sendMail(
    email,
    'Confirmación de reserva',
    `Tu reserva en ${restaurantName} para ${guests} personas el ${formattedDate}hs ha sido confirmada.\n\nAgrega este evento a tu Google Calendar: ${googleCalendarUrl}`
  );
};
export const sendReservationCancellationEmail = async (
  email: string,
  restaurantName: string,
  guests: number,
  date: number
) => {
  const formattedDate = new Date(date).toLocaleString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Montevideo'
  });
  await sendMail(
    email,
    'Cancelación de reserva',
    `Tu reserva en ${restaurantName} para ${guests} personas el ${formattedDate}hs ha sido cancelada.`
  );
};
