import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useTypedRouter } from 'hooks/useTypedRouter';
import { useTypedSearchParams } from 'hooks/useTypedSearchParams';

const bookingFormSchema = z
  .object({
    date: z.string().min(1, '날짜를 선택해주세요.'),
    startTime: z.string().min(1, '시작 시간을 선택해주세요.'),
    endTime: z.string().min(1, '종료 시간을 선택해주세요.'),
    attendees: z.coerce.number().min(1, '참석 인원은 1명 이상이어야 합니다.'),
    equipment: z.array(z.string()),
    floor: z.string().optional(),
    roomId: z.string().min(1, '회의실을 선택해주세요.'),
  })
  .refine(data => data.endTime > data.startTime, {
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
    path: ['endTime'],
  });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export function useBookingForm() {
  const router = useTypedRouter();
  const searchParams = useTypedSearchParams('/booking');

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      date: searchParams.date || format(new Date(), 'yyyy-MM-dd'),
      startTime: searchParams.startTime || '',
      endTime: searchParams.endTime || '',
      attendees: searchParams.attendees || 1,
      equipment: searchParams.equipment || [],
      floor: searchParams.floor || '',
      roomId: '',
    },
  });

  // sync 로직이 너무 더러워보임... 뭔가 더 깔끔하게 처리할 방법이 없을까 고민 ㅠ
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      router.replace('/booking', {
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        attendees: (values.attendees ?? 1) > 1 ? values.attendees : undefined,
        equipment: (values.equipment?.length ?? 0) > 0 ? values.equipment : undefined,
        floor: values.floor,
      });

      if (name !== 'roomId') {
        form.setValue('roomId', '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, router]);

  return form;
}
