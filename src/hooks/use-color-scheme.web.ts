import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const sinSuscripcion = () => () => {};

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * useSyncExternalStore returns false while rendering on the server and true on the client.
 */
export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
  const colorScheme = useRNColorScheme();
  return hasHydrated ? colorScheme : 'light';
}
