import { css } from '@emotion/react';
import { useSuspenseQueries } from '@tanstack/react-query';
import { reservationsQueryOptions, roomsQueryOptions } from './queryOptions';
import { ReservationTable } from './ReservationTable';

const TIMELINE_START = 9;
const TIMELINE_END = 20;

export function ReservationTableContainer({ date }: { date: string }) {
  const [{ data: rooms }, { data: reservations }] = useSuspenseQueries({
    queries: [roomsQueryOptions(), reservationsQueryOptions(date)],
  });

  return (
    <ReservationTable.Root from={TIMELINE_START} to={TIMELINE_END}>
      <ReservationTable.Header />
      {rooms.map((room, index) => {
        const roomReservations = reservations.filter(reservation => reservation.roomId === room.id);
        return (
          <div
            key={room.id}
            css={css`
              ${index > 0 ? 'margin-top: 4px;' : ''}
            `}
          >
            <ReservationTable.Row label={room.name} reservations={roomReservations} />
          </div>
        );
      })}
    </ReservationTable.Root>
  );
}
