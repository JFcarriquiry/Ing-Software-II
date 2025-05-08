import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendMail = async (to: string, subject: string, text: string) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `no-reply@${(process.env.FRONTEND_URL || '').replace(/https?:\/\//, '')}`,
    to,
    subject,
    text,
  });
};

export const sendReservationConfirmationEmail = async (email: string, restaurantName: string, guests: number, date: number) => {
  const formattedDate = new Date(date).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Montevideo' });
  await sendMail(
    email,
    'Confirmación de reserva',
    `Tu reserva en ${restaurantName} para ${guests} personas el ${formattedDate}hs ha sido confirmada.`
  );
};

export const sendReservationCancellationEmail = async (email: string, restaurantName: string, guests: number, date: number) => {
  const formattedDate = new Date(date).toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Montevideo' });
  await sendMail(
    email,
    'Cancelación de reserva',
    `Tu reserva en ${restaurantName} para ${guests} personas el ${formattedDate}hs ha sido cancelada.`
  );
};
