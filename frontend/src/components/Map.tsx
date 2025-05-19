/// <reference types="vite/client" />

import React, { useEffect, useState } from 'react';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import axios from 'axios';
// import io from 'socket.io-client'; // Ya no se importa io directamente aquí
import { User } from '../hooks/useAuth';
import ReserveCard from './ReserveCard';
import { useSocket } from '../hooks/useSocket'; // Usar el hook centralizado

export interface Restaurant {
  id: number;
  name: string;
  latitude: string;
  longitude: string;
  description: string;
  seats_total: number;
  tables_total?: number;
  phone?: string;
  email?: string;
  address?: string;
}

interface MapProps {
  user: User;
}

export default function Map({ user }: MapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GMAPS_KEY as string
  });

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [guests, setGuests] = useState(1);
  const [date, setDate] = useState('');
  const [availability, setAvailability] = useState<{ start: number; available_tables: number }[]>([]);
  const [selectedInterval, setSelectedInterval] = useState('');
  const [message, setMessage] = useState('');
  const socket = useSocket(); // Usar el hook
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: -34.9011, lng: -56.1645 });

  useEffect(() => {
    if (user) {
      axios.get('/api/restaurants').then((res) => setRestaurants(res.data));
    }
  }, [user]);

  // Efecto para escuchar 'occupancy_update' si es necesario para el mapa general
  // Este es un ejemplo simple, podrías querer una lógica más sofisticada
  useEffect(() => {
    console.log('Map: Setting up occupancy_update listener');
    const handleOccupancyUpdate = ({ restaurant_id }: { restaurant_id: number }) => {
      console.log(`Map: Occupancy update received for restaurant ${restaurant_id}`);
      // Opcional: Podrías querer recargar solo el restaurante afectado o todos
      // Por ahora, recargamos todos para simplicidad, pero esto puede no ser ideal para el rendimiento
      // axios.get('/api/restaurants').then((res) => setRestaurants(res.data));
      // O actualizar solo el restaurante afectado si tienes su info
      setRestaurants(prev => prev.map(r => r.id === restaurant_id ? { ...r, /* algún campo de ocupación si lo tienes */ } : r));
      // Considera si este evento es realmente necesario para el mapa o si el dashboard es el único interesado.
      // Si solo el dashboard usa este evento, puedes eliminar este listener del Map.
    };

    socket.on('occupancy_update', handleOccupancyUpdate);

    return () => {
      console.log('Map: Cleaning up occupancy_update listener');
      socket.off('occupancy_update', handleOccupancyUpdate);
      // No desconectamos el socket aquí, ya que es una instancia compartida gestionada por useSocket
    };
  }, [socket]); // Depende solo de la instancia del socket

  useEffect(() => {
    if (selected && date) {
      axios
        .get<{ start: number; available_tables: number }[]>(
          `/api/restaurants/${selected.id}/availability?date=${date}`,
          { withCredentials: true }
        )
        .then((res) => {
          setAvailability(res.data);
          // If availability data is successfully fetched and not empty,
          // set the selectedInterval to the first available slot.
          if (res.data && res.data.length > 0) {
            setSelectedInterval(res.data[0].start.toString());
          } else {
            // If no availability, clear the selected interval
            setSelectedInterval('');
          }
        })
        .catch(err => {
          console.error(err);
          setAvailability([]); // Clear availability on error
          setSelectedInterval(''); // Clear selected interval on error
        });
    } else {
      // If no selected restaurant or date, clear availability and interval
      setAvailability([]);
      setSelectedInterval('');
    }
  }, [selected, date]);

  const handleMarkerClick = async (r: Restaurant) => {
    const res = await axios.get(`/api/restaurants/${r.id}`);
    setSelected(res.data);
    setGuests(1);
    setDate('');
    setAvailability([]);
    setSelectedInterval('');
    setMessage('');
    // Centrar el mapa en el restaurante seleccionado
    setCenter({ lat: Number(r.latitude), lng: Number(r.longitude) });
  };

  const handleReserve = async () => {
    setMessage('');
    try {
      const res = await axios.post(
        '/api/reservations',
        {
          restaurant_id: selected?.id,
          reservation_at: Number(selectedInterval),
          guests
        },
        { withCredentials: true }
      );
      const newReservation = res.data.reservation;
      const displayGuests = newReservation?.requested_guests || guests;

      window.alert(`Reserva de ${displayGuests} personas confirmada`);
      window.dispatchEvent(new Event('reservation-made'));
      setMessage(`Reserva de ${displayGuests} personas confirmada`);
      setSelected(null);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Error al reservar');
    }
  };

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <>
      <GoogleMap
        center={center}
        zoom={12}
        mapContainerStyle={{ height: '80vh', width: '100%' }}
      >
        {restaurants.map((r) => (
          <MarkerF
            key={r.id}
            position={{ lat: Number(r.latitude), lng: Number(r.longitude) }}
            title={`${r.name} (${r.seats_total} asientos totales)`}
            onClick={() => handleMarkerClick(r)}
          />
        ))}
      </GoogleMap>
      {selected && (
        <ReserveCard
          selected={selected}
          availability={availability}
          selectedInterval={selectedInterval}
          setSelectedInterval={setSelectedInterval}
          date={date}
          setDate={setDate}
          guests={guests}
          setGuests={setGuests}
          handleReserve={handleReserve}
          setSelected={setSelected}
          message={message}
        />
    )}

    </>
  );
}
