import type { UserDto } from '@/types/models';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useAuthenStore = defineStore('authenStore', () => {
  const auth = ref<UserDto>();
  const sessionExpired = ref(false);
  const tokenKey = computed(() => auth.value?.token);
  const loginedCover = computed(() => auth.value?.cover?.image);
  const loginedAvatar = computed(() => auth.value?.avatar?.image);
  const loginedDisplay = computed(() =>
    auth.value?.username ? auth.value?.username : auth.value?.email
  );

  const setAuthen = (item: UserDto) => {
    auth.value = item;
  };
  const logout = () => {
    auth.value = undefined;
    sessionExpired.value = false;
  };

  return {
    auth,
    sessionExpired,
    tokenKey,
    loginedCover,
    loginedAvatar,
    loginedDisplay,
    setAuthen,
    logout,
  };
});
