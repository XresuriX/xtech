<script setup lang="ts">
import EconomyService from '@/api/EconomyService';
import type { LeaderboardRow, TransferRequest } from '@/api/EconomyService';
import { useAppMeta } from '@/composables/useAppMeta';
import { useBase } from '@/composables/useBase';
import { useLang } from '@/composables/useLang';
import { biCoin, biPeople, biStar } from '@quasar/extras/bootstrap-icons';
import { computed, onMounted, ref } from 'vue';
import BaseButton from 'src/components/base/BaseButton.vue';
import BaseCard from 'src/components/base/BaseCard.vue';
import BaseInput from 'src/components/base/BaseInput.vue';

useAppMeta();
const { t } = useLang();
const { appLoading } = useBase();
const economy = EconomyService();

const loading = ref(true);
const pointsTotal = ref<number | null>(null);
const wallet = ref<{ balance: number; reserved: number } | null>(null);
const leaderboard = ref<LeaderboardRow[]>([]);

const dialogTransfer = ref(false);
const transferForm = ref<TransferRequest>({ recipient_id: '', amount: 1, note: '' });
const transferring = ref(false);

const columns = computed(() => [
  { name: 'rank', label: t('economy.rank'), field: 'rank', align: 'left' as const },
  { name: 'user_display', label: t('economy.player'), field: 'user_display', align: 'left' as const },
  { name: 'total_points', label: t('economy.points'), field: 'total_points', align: 'right' as const },
]);

const load = async (): Promise<void> => {
  loading.value = true;
  const [points, walletRes, board] = await Promise.all([
    economy.points(),
    economy.wallet(),
    economy.leaderboard({ limit: 50 }),
  ]);
  pointsTotal.value = points?.total ?? null;
  wallet.value = walletRes ? { balance: walletRes.balance, reserved: walletRes.reserved } : null;
  leaderboard.value = board ?? [];
  loading.value = false;
};

const onTransfer = async (): Promise<void> => {
  if (!transferForm.value.recipient_id || transferForm.value.amount <= 0) {
    return;
  }
  transferring.value = true;
  appLoading(true);
  const res = await economy.transfer(transferForm.value);
  appLoading(false);
  transferring.value = false;
  if (res) {
    dialogTransfer.value = false;
    transferForm.value = { recipient_id: '', amount: 1, note: '' };
    await load();
  }
};

onMounted(load);
</script>

<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">
      <q-icon :name="biCoin" class="q-mr-sm" />
      {{ t('economy.title') }}
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <BaseCard :title="t('economy.points')" flat bordered :icon="biStar">
          <div class="text-h4 text-weight-bold q-pa-md">
            {{ loading ? '…' : pointsTotal ?? '-' }}
          </div>
        </BaseCard>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <BaseCard :title="t('economy.balance')" flat bordered :icon="biCoin">
          <div class="text-h4 text-weight-bold q-pa-md">
            {{ loading ? '…' : wallet?.balance ?? '-' }}
            <span class="text-caption text-grey-6" v-if="wallet">(+{{ wallet.reserved }} {{ t('economy.reserved') }})</span>
          </div>
        </BaseCard>
      </div>
      <div class="col-12 col-md-6 flex items-center">
        <BaseButton
          unelevated
          color="primary"
          :label="t('economy.transfer')"
          :disable="loading"
          @click="dialogTransfer = true"
        />
      </div>
    </div>

    <BaseCard :title="t('economy.leaderboard')" flat bordered :icon="biPeople">
      <q-table
        flat
        :rows="leaderboard"
        :columns="columns"
        :loading="loading"
        row-key="user_id"
        :rows-per-page-options="[0]"
        hide-pagination
      />
    </BaseCard>

    <q-dialog v-model="dialogTransfer" persistent>
      <q-card style="min-width: 360px">
        <q-card-section class="text-h6">{{ t('economy.transferTitle') }}</q-card-section>
        <q-card-section class="q-gutter-md">
          <BaseInput v-model="transferForm.recipient_id" :label="t('economy.recipient')" />
          <BaseInput v-model.number="transferForm.amount" type="number" :label="t('economy.amount')" />
          <BaseInput v-model="transferForm.note" :label="t('economy.note')" />
        </q-card-section>
        <q-card-actions align="right">
          <BaseButton flat :label="t('base.cancel')" v-close-popup />
          <BaseButton
            unelevated
            color="primary"
            :label="t('base.save')"
            :loading="transferring"
            :disable="!transferForm.recipient_id || transferForm.amount <= 0"
            @click="onTransfer"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
