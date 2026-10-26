import { skipToken, useQuery } from '@tanstack/react-query';

import { getWantedDetail, getWantedList } from '@/api/wanted';

import { queryKeys } from './keys';

export function useWantedList() {
  return useQuery({ queryKey: queryKeys.wantedList, queryFn: () => getWantedList({}) });
}

export function useWantedDetail(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.wanted(id ?? 0),
    queryFn: id ? () => getWantedDetail(id) : skipToken,
  });
}
