import { skipToken, useQuery } from '@tanstack/react-query';

import { getMyFavorites } from '@/api/favorite';
import { useAuthStore } from '@/stores/auth';

import { queryKeys } from './keys';

export function useMyFavorites() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: queryKeys.favorites(userId ?? 0),
    queryFn: userId ? () => getMyFavorites(userId) : skipToken,
  });
}
