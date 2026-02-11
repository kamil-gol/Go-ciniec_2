'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MenuSelection from '@/components/menu/MenuSelection';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getReservationMenu } from '@/services/menu-api';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Reservation {
  id: string;
  eventTypeId: string;
  guestCount: number;
  eventDate: string;
  client: {
    name: string;
  };
  eventType: {
    name: string;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReservationMenuPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [hasMenu, setHasMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservation();
    checkExistingMenu();
  }, [resolvedParams.id]);

  const loadReservation = async () => {
    try {
      const response = await axios.get(`${API_URL}/reservations/${resolvedParams.id}`);
      setReservation(response.data.data);
    } catch (error) {
      console.error('Error loading reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingMenu = async () => {
    try {
      await getReservationMenu(resolvedParams.id);
      setHasMenu(true);
    } catch (error) {
      // Menu doesn't exist yet - that's fine
      setHasMenu(false);
    }
  };

  const handleMenuSelected = () => {
    router.push(`/dashboard/reservations/${resolvedParams.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Nie znaleziono rezerwacji</h3>
            <Button onClick={() => router.push('/dashboard/reservations')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Wróć do listy rezerwacji
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/reservations/${resolvedParams.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Wróć do rezerwacji
        </Button>
        <h1 className="text-3xl font-bold mb-2">Wybór Menu</h1>
        <p className="text-muted-foreground">
          {reservation.client.name} • {reservation.eventType.name} • {new Date(reservation.eventDate).toLocaleDateString('pl-PL')}
        </p>
      </div>

      {/* Menu Selection Component */}
      <MenuSelection
        reservationId={resolvedParams.id}
        eventTypeId={reservation.eventTypeId}
        initialGuestCount={reservation.guestCount}
        onMenuSelected={handleMenuSelected}
      />
    </div>
  );
}
