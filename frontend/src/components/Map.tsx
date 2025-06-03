/// <reference types="vite/client" />

import React, { useEffect, useState, ChangeEvent } from 'react';
import { GoogleMap, MarkerF, useLoadScript } from '@react-google-maps/api';
import axios from 'axios';
import { User } from '../hooks/useAuth';
import ReserveCard from './ReserveCard';
import { useSocket } from '../hooks/useSocket';

// Material-UI imports
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import Typography from '@mui/material/Typography';

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
  tags?: string[];
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
  const socket = useSocket();
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: -34.9011, lng: -56.1645 });
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearchText, setTagSearchText] = useState('');
  
  const [tagAnchorEl, setTagAnchorEl] = React.useState<HTMLInputElement | null>(null);

  const handleTagPopoverOpen = (event: React.MouseEvent<HTMLInputElement>) => {
    setTagAnchorEl(event.currentTarget);
  };

  const handleTagPopoverClose = () => {
    setTagAnchorEl(null);
  };

  const isTagPopoverOpen = Boolean(tagAnchorEl);
  const tagPopoverId = isTagPopoverOpen ? 'tag-popover' : undefined;

  const allTags = Array.from(
    new Set(restaurants.flatMap(r => r.tags || []))
  ).sort();

  const filteredAvailableTags = allTags.filter(tag =>
    tag.toLowerCase().includes(tagSearchText.toLowerCase())
  );

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

  const [searchText, setSearchText] = useState('');

  if (!isLoaded) return <p>Cargando mapa...</p>;

  const visibleRestaurants = filteredRestaurants.filter(r =>
    r.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleTagCheckboxChange = (tag: string, checked: boolean) => {
    if (checked) {
      setSelectedTags((prev: string[]) => [...prev, tag]);
    } else {
      setSelectedTags((prev: string[]) => prev.filter((t: string) => t !== tag));
    }
  };

  return (
    <>
      <Box sx={{ 
        margin: '1rem 0', 
        padding: '1rem', // Added padding
        backgroundColor: 'white', // Added white background
        borderRadius: '4px', // Optional: for rounded corners
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', // Optional: for a slight shadow
        display: 'flex', 
        gap: 2, 
        alignItems: 'center', 
        flexWrap: 'wrap' 
      }}>
        <TextField
          label="Buscar restaurante"
          variant="outlined"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Box>
          <TextField
            label="Filtrar por tags"
            variant="outlined"
            value={tagSearchText}
            onClick={handleTagPopoverOpen}
            onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
                setTagAnchorEl(event.currentTarget);
            }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { // Ensure type for e
              setTagSearchText(e.target.value);
              if (!tagAnchorEl && e.target instanceof HTMLInputElement) {
                  setTagAnchorEl(e.target);
              }
            }}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon />
                </InputAdornment>
              ),
            }}
            aria-describedby={tagPopoverId}
          />
          <Popover
            id={tagPopoverId}
            open={isTagPopoverOpen}
            anchorEl={tagAnchorEl}
            onClose={handleTagPopoverClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            PaperProps={{
              style: {
                maxHeight: 200,
                width: tagAnchorEl ? tagAnchorEl.clientWidth : 200,
              },
            }}
            disableEnforceFocus // Added this prop to prevent Popover from stealing focus
          >
            <List dense sx={{ overflowY: 'auto', maxHeight: '200px' }}>
              {filteredAvailableTags.length > 0 ? filteredAvailableTags.map(tag => (
                <ListItem
                  key={tag}
                  dense
                  button // Using 'button' prop for ListItem
                  onClick={() => handleTagCheckboxChange(tag, !selectedTags.includes(tag))}
                >
                  <ListItemIcon sx={{minWidth: 'auto', marginRight: 1}}>
                    <Checkbox
                      edge="start"
                      checked={selectedTags.includes(tag)}
                      tabIndex={-1}
                      disableRipple
                      size="small"
                    />
                  </ListItemIcon>
                  <ListItemText primary={tag} />
                </ListItem>
              )) : (
                <ListItem>
                  <ListItemText primary={tagSearchText ? "No hay tags que coincidan" : "Escriba para buscar tags"} />
                </ListItem>
              )}
            </List>
          </Popover>
        </Box>

        {selectedTags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', marginLeft: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', mr: 0.5 }}>Filtros:</Typography>
            {selectedTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleTagCheckboxChange(tag, false)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        )}
      </Box>

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
