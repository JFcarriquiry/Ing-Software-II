/// <reference types="vite/client" />

import React, { useEffect, useState, ChangeEvent } from 'react';
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
  tags?: string[]; // <-- Añadido para soportar tags
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
  
  // Estado para tags seleccionados
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Obtener todos los tags únicos de los restaurantes para mostrar como opciones
  const allTags = Array.from(
    new Set(restaurants.flatMap(r => r.tags || []))
  );

  // Filtrar restaurantes según los tags seleccionados
  const filteredRestaurants = restaurants.filter(r =>
    selectedTags.length === 0 ||
    (r.tags && selectedTags.every(tag => r.tags.includes(tag)))
  );

  useEffect(() => {
    if (user) {
      axios.get('/api/restaurants').then((res) => setRestaurants(res.data));
    }
  }, [user]);

  useEffect(() => {
    console.log('Map: Setting up occupancy_update listener');
    const handleOccupancyUpdate = ({ restaurant_id }: { restaurant_id: number }) => {
      console.log(`Map: Occupancy update received for restaurant ${restaurant_id}`);
      setRestaurants(prev => prev.map(r => r.id === restaurant_id ? { ...r } : r));
    };

    socket.on('occupancy_update', handleOccupancyUpdate);

    return () => {
      console.log('Map: Cleaning up occupancy_update listener');
      socket.off('occupancy_update', handleOccupancyUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (selected && date) {
      axios
        .get<{ start: number; available_tables: number }[]>(
          `/api/restaurants/${selected.id}/availability?date=${date}`,
          { withCredentials: true }
        )
        .then((res) => {
          setAvailability(res.data);
          if (res.data && res.data.length > 0) {
            setSelectedInterval(res.data[0].start.toString());
          } else {
            setSelectedInterval('');
          }
        })
        .catch(err => {
          console.error(err);
          setAvailability([]);
          setSelectedInterval('');
        });
    } else {
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

  // Estado para el texto de búsqueda
  const [searchText, setSearchText] = useState('');

  if (!isLoaded) return <p>Cargando mapa...</p>;

  // Filtrar restaurantes por nombre y tags
  const visibleRestaurants = filteredRestaurants.filter(r =>
    r.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      <div style={{ margin: '1rem 0', display: 'flex', gap: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Buscar restaurante..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minWidth: 200 }}
        />
        {/* Selector de tags como dropdown con checklists */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <details>
            <summary style={{ cursor: 'pointer', border: '1px solid #ccc', borderRadius: 4, padding: '4px 12px', background: '#f9f9f9', display: 'inline-block', minWidth: 120 }}>
              {selectedTags.length === 0 ? 'Seleccionar tags' : selectedTags.join(', ')}
            </summary>
            <div style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: 8, minWidth: 160, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {allTags.map(tag => (
                <label key={tag} style={{ display: 'block', marginBottom: 4, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.checked) {
                        setSelectedTags((prev: string[]) => [...prev, tag]);
                      } else {
                        setSelectedTags((prev: string[]) => prev.filter((t: string) => t !== tag));
                      }
                    }}
                  />
                  &nbsp;{tag}
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      <GoogleMap
        center={center}
        zoom={12}
        mapContainerStyle={{ height: '80vh', width: '100%' }}
      >
        {visibleRestaurants.map((r) => (
          <MarkerF
            key={r.id}
            position={{ lat: Number(r.latitude), lng: Number(r.longitude) }}
            title={`${r.name} (${r.seats_total} asientos totales)`}
            onClick={() => handleMarkerClick(r)}
            icon={{
              fillColor: '#ff2d00',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeOpacity: 2,
              strokeWeight: 2,
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
            }}
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
