import React from 'react';
import styles from '../styles/ReserveCard.module.scss';
import { Restaurant } from './Map';
import { DatePicker } from '@mui/x-date-pickers';

interface Availability {
  start: number;
  available_tables: number;
}

interface ReserveCardProps {
  selected: Restaurant | null;
  availability: Availability[];
  selectedInterval: string;
  setSelectedInterval: React.Dispatch<React.SetStateAction<string>>;
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  guests: number;
  setGuests: React.Dispatch<React.SetStateAction<number>>;
  handleReserve: () => void;
  setSelected: React.Dispatch<React.SetStateAction<Restaurant | null>>;
  message: string;
}

const ReserveCard: React.FC<ReserveCardProps> = ({
  selected,
  availability,
  selectedInterval,
  setSelectedInterval,
  date,
  setDate,
  guests,
  setGuests,
  handleReserve,
  setSelected,
  message,
}) => {
  if (!selected) return null;

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      const formatted = newDate.toISOString().split('T')[0];
      setDate(formatted);
    }
  };

  return (
    <div className={styles.reserveCard}>
      <h2>{selected.name}</h2>
      <p>Horario: 10:00 AM - 01:00 AM</p>
      <p>{selected.description}</p>
      <p>Dirección: {selected.address}</p>
      <p>Teléfono: {selected.phone}</p>
      <p>Email: {selected.email}</p>
      <p>Mesas disponibles: {selected.tables_total}</p>

      <label>
        Fecha:
          <DatePicker
            value={new Date(date)}
            onChange={handleDateChange}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                className: styles.datePickerInput
              },
            }}
          />
      </label>

      {availability.length > 0 && (
        <label>
          Horario:
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className={styles.select}
          >
            {availability.map((a) => {
              const dt = new Date(a.start);
              const h = String(dt.getHours()).padStart(2, '0');
              const m = String(dt.getMinutes()).padStart(2, '0');
              return (
                <option key={a.start} value={a.start}>
                  {`${h}:${m}`} ({a.available_tables} mesas)
                </option>
              );
            })}
          </select>
        </label>
      )}

      <label>
        Personas:
        <input
          type="number"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className={styles.input}
        />
      </label>

      <button className={styles.reserveBtn} onClick={handleReserve} disabled={!selectedInterval || guests < 1}>
        Reservar
      </button>

      <button className={styles.closeBtn} onClick={() => setSelected(null)}>
        Cerrar
      </button>

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};

export default ReserveCard;