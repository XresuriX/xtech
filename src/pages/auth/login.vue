<script setup lang="ts">
import { useAuth } from '@/composables/useAuth';
import { useDevice } from '@/composables/useDevice';
import { useLang } from '@/composables/useLang';
import { isOidcConfigured } from '@/services/oidc';
import { getYearNow } from '@/utils/dateUtil';
import { Cookies, useMeta } from 'quasar';
import BaseButton from 'src/components/base/BaseButton.vue';
import BaseLangugeSwitcherButton from 'src/components/base/BaseLangugeSwitcherButton.vue';
import BasePage from 'src/components/base/BasePage.vue';
import BaseThemeSwitcher from 'src/components/base/BaseThemeSwitcher.vue';
import Ellipsis from 'src/components/base/BaseEllipsis.vue';
import { useBase } from 'src/composables/useBase';
import { AppAuthTokenKey } from 'src/libs/constant';
import { ref } from 'vue';
const { isSmallScreen } = useDevice();
const { signIn } = useAuth();
const { t } = useLang();
const { isDark } = useBase();
const loading = ref<boolean>(false);
const oidcReady = isOidcConfigured();
const appVersion = process.env.APP_VERSION;
defineOptions({
  preFetch({ ssrContext, redirect }) {
    const cookies = process.env.SERVER ? Cookies.parseSSR(ssrContext) : Cookies;
    if (cookies.get(AppAuthTokenKey)) {
      redirect({ path: '/admin' });
    }
  },
});
const metaData = {
  // sets document title
  title: t('page.login'),
  // optional; sets final title as "Index Page - My Website", useful for multiple level meta
  titleTemplate: (title: any) => `${title} - Vue Quasar Example`,

  // meta tags
  meta: {
    description: { name: 'description', content: 'Vue Quasar Example, Vue Quasar Example' },
    keywords: {
      name: 'keywords',
      content: 'Vue Quasar Example, Vue Quasar Example',
    },
    twitterCard: {
      name: 'twitter:card',
      content: 'https://app.yourdomain.com/card.jpg',
    },
    ogTitle: {
      property: 'og:title',
      content: 'Vue Quasar Example',
    },
    ogUrl: {
      property: 'og:url',
      content: 'https://app.yourdomain.com',
    },
    ogType: {
      property: 'og:type',
      content: 'website',
    },
    ogDescription: {
      property: 'og:description',
      content: t('ssDescription'),
    },
    ogImage: {
      property: 'og:image',
      content: 'https://app.yourdomain.com/card.jpg',
    },
  },
};
useMeta(metaData);

const onSubmit = async () => {
  if (!oidcReady) {
    return;
  }
  loading.value = true;
  // never returns - browser navigates to the identity provider
  await signIn('/admin');
};
</script>
<template>
  <BasePage
    :padding="false"
    :class="{ 'bg-white': !isDark, 'app-second-bg-color-theme-dark': isDark }"
    :full="false"
  >
    <div class="row items-center" :class="{ 'q-pa-md': !isSmallScreen }" style="height: 100vh">
      <!-- Left Column - Fantasy Background -->
      <div class="col-12 col-md-6 fantasy-bg">
        <div class="overlay flex flex-center text-white">
          <div class="q-pa-xl text-center">
            <h2 class="text-h3 text-weight-bold q-mb-md">
              <Ellipsis :lines="2"> Welcome to Our {{ t('app.monogram') }} </Ellipsis>
            </h2>
            <div class="text-h5">
              <Ellipsis :lines="1"> Embark on your next adventure </Ellipsis>
            </div>
          </div>
        </div>
      </div>
      <!-- Right Column - Login Form -->
      <div class="col-12 col-md-6 flex flex-center">
        <div
          class="q-pa-md"
          :style="{
            width: !isSmallScreen ? '70%' : '90%',
            maxWidth: !isSmallScreen ? '80%' : '90%',
          }"
        >
          <div class="text-center q-mb-xl">
            <q-avatar size="100px" class="q-mb-md" square>
              <q-img
                :src="isDark ? '/logo/logo-white.png' : '/logo/logo-black.png'"
                spinner-color="white"
                alt="logo"
                style="height: auto; max-width: 120px"
              />
            </q-avatar>
            <div class="text-h4 text-weight-bolder q-my-md">
              {{ t('base.loginTitle') }}
            </div>
            <div class="text-body1 text-grey-6 q-my-md">
              {{ t('base.loginTitle2') }}
            </div>
          </div>

          <q-form class="q-gutter-md" @submit.prevent="onSubmit">
            <div
              v-if="!oidcReady"
              class="q-pa-md rounded-borders text-body2"
              :class="isDark ? 'bg-grey-9 text-grey-3' : 'bg-grey-3 text-grey-8'"
            >
              {{ t('authen.ssoNotConfigured') }}
            </div>
            <div v-else class="text-body2 text-grey-6 text-center">
              {{ t('authen.ssoHelper') }}
            </div>

            <div class="q-px-sm">
              <BaseButton
                unelevated
                :loading="loading"
                :disable="!oidcReady"
                size="lg"
                color="primary"
                class="full-width text-white"
                :label="t('authen.ssoSignIn')"
                type="submit"
              />
            </div>
          </q-form>

          <div class="text-center q-mt-lg">
            <div class="row items-center q-gutter-x-md justify-center">
              <BaseLangugeSwitcherButton anchor="top left" self="bottom left" close-on-click />
              <BaseThemeSwitcher />
              <div :class="isDark ? 'text-grey-5' : 'text-grey-7'">
                {{ `@ ${getYearNow()} ${t('app.monogram')} ${appVersion}` }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BasePage>
</template>
<style scoped>
.fantasy-bg {
  background-image: url('https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1');
  background-size: cover;
  background-position: center;
  min-height: 90vh;
  border-radius: 20px;
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(16, 0, 43, 0) 0%, rgba(52, 0, 87, 0.6) 100%);

  border-radius: 20px;
}

@media (max-width: 768px) {
  .fantasy-bg {
    min-height: 40vh;
    /* border-radius: 20px 20px 0 0; */
    border-radius: 0 0 0 0;
  }

  .overlay {
    /* border-radius: 20px 20px 0 0; */
    border-radius: 0 0 0 0;
  }
}
@media (max-width: 1180px) {
  .fantasy-bg {
    min-height: 40vh;
    border-radius: 0 0 0 0;
  }
  .overlay {
    border-radius: 0 0 0 0;
  }
}
</style>
