<script setup lang="ts">
import MemberService from '@/api/MemberService';
import OrgService from '@/api/OrgService';
import type { MemberOut, MemberRole, OrganizationDetailOut } from '@/api/OrgService';
import { useAppMeta } from '@/composables/useAppMeta';
import { useBase } from '@/composables/useBase';
import { useLang } from '@/composables/useLang';
import { Scopes } from '@/libs/scopes';
import { useAppStore } from '@/stores/appStore';
import { biPersonPlus, biPeople, biTrash } from '@quasar/extras/bootstrap-icons';
import { date } from 'quasar';
import type { QTableColumn } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import BaseButton from 'src/components/base/BaseButton.vue';
import BaseInput from 'src/components/base/BaseInput.vue';

useAppMeta();
const { t } = useLang();
const { appConfirm, appLoading } = useBase();
const appStore = useAppStore();
const { me } = OrgService();
const membersApi = MemberService();

const loading = ref(true);
const org = ref<OrganizationDetailOut | null>(null);
const canManage = computed(
  () => appStore.isOrgAdmin && appStore.hasScope(Scopes.MEMBERS_WRITE)
);
const members = computed(() => org.value?.members ?? []);
const isOwnerRow = (row: MemberOut): boolean => org.value?.owner_id === row.user_id;
const roleOptions: MemberRole[] = ['admin', 'member', 'viewer'];

const dialogAdd = ref(false);
const addForm = ref<{ user_id: string; role: MemberRole }>({ user_id: '', role: 'member' });

const dialogRole = ref(false);
const roleTarget = ref<MemberOut | null>(null);
const roleValue = ref<MemberRole>('member');

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'user_id',
    label: t('members.userId'),
    field: 'user_id',
    align: 'left',
  },
  {
    name: 'role',
    label: t('members.role'),
    field: 'role',
    align: 'left',
  },
  {
    name: 'joined_at',
    label: t('members.joinedAt'),
    field: 'joined_at',
    align: 'left',
  },
  {
    name: 'actions',
    label: t('members.actions'),
    field: 'id',
    align: 'center',
  },
]);

const formatJoined = (value: string): string => {
  if (!value) {
    return '-';
  }
  return date.formatDate(value, 'YYYY-MM-DD HH:mm');
};

const load = async (): Promise<void> => {
  loading.value = true;
  org.value = await me();
  loading.value = false;
};

const onAdd = async (): Promise<void> => {
  if (!org.value || !addForm.value.user_id) {
    return;
  }
  appLoading(true);
  await membersApi.add(org.value.id, {
    user_id: addForm.value.user_id,
    role: addForm.value.role,
  });
  appLoading(false);
  dialogAdd.value = false;
  addForm.value = { user_id: '', role: 'member' };
  await load();
};

const onRoleOpen = (row: MemberOut): void => {
  roleTarget.value = row;
  roleValue.value = row.role as MemberRole;
  dialogRole.value = true;
};

const onRoleSave = async (): Promise<void> => {
  if (!org.value || !roleTarget.value) {
    return;
  }
  appLoading(true);
  await membersApi.updateRole(org.value.id, roleTarget.value.id, { role: roleValue.value });
  appLoading(false);
  dialogRole.value = false;
  await load();
};

const onRemove = async (row: MemberOut): Promise<void> => {
  if (!org.value) {
    return;
  }
  const conf = await appConfirm(t('app.monogram'), t('members.removeConfirm'));
  if (!conf) {
    return;
  }
  appLoading(true);
  await membersApi.remove(org.value.id, row.id);
  appLoading(false);
  await load();
};

onMounted(load);
</script>

<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="text-h5">
        <q-icon :name="biPeople" class="q-mr-sm" />
        {{ t('members.title') }}
      </div>
      <q-space />
      <BaseButton
        v-if="canManage"
        unelevated
        color="primary"
        :icon="biPersonPlus"
        :label="t('members.add')"
        @click="dialogAdd = true"
      />
    </div>

    <q-banner v-if="!loading && !org" class="bg-grey-3 text-grey-8" rounded inline-actions>
      {{ t('members.noOrg') }}
    </q-banner>

    <q-table
      v-else
      flat
      bordered
      row-key="id"
      :rows="members"
      :columns="columns"
      :loading="loading"
      :rows-per-page-options="[0]"
      hide-pagination
    >
      <template #body-cell-role="props">
        <q-td :props="props">
          <q-badge :color="props.row.role === 'owner' ? 'primary' : 'grey-7'">
            {{ props.row.role }}
          </q-badge>
        </q-td>
      </template>
      <template #body-cell-joined_at="props">
        <q-td :props="props">
          {{ formatJoined(props.row.joined_at) }}
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-center">
          <template v-if="canManage && !isOwnerRow(props.row)">
            <BaseButton flat dense color="primary" :label="t('members.changeRole')" @click="onRoleOpen(props.row)" />
            <BaseButton flat dense color="negative" :icon="biTrash" @click="onRemove(props.row)" />
          </template>
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogAdd" persistent>
      <q-card style="min-width: 360px">
        <q-card-section class="text-h6">{{ t('members.addTitle') }}</q-card-section>
        <q-card-section class="q-gutter-md">
          <BaseInput v-model="addForm.user_id" :label="t('members.userId')" />
          <q-select v-model="addForm.role" :options="roleOptions" emit-value map-options :label="t('members.role')" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <BaseButton flat :label="t('base.cancel')" v-close-popup />
          <BaseButton unelevated color="primary" :label="t('base.save')" :disable="!addForm.user_id" @click="onAdd" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogRole" persistent>
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">{{ t('members.changeRole') }}</q-card-section>
        <q-card-section>
          <div class="text-body2 q-mb-sm">{{ roleTarget?.user_id }}</div>
          <q-select v-model="roleValue" :options="roleOptions" emit-value map-options :label="t('members.role')" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <BaseButton flat :label="t('base.cancel')" v-close-popup />
          <BaseButton unelevated color="primary" :label="t('base.save')" @click="onRoleSave" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
