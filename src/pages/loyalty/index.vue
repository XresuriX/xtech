<script setup lang="ts">
import LoyaltyService from '@/api/LoyaltyService';
import type { CampaignOut, CustomRuleOut, TaskCompletionOut, TaskOut } from '@/api/LoyaltyService';
import NotificationService from '@/api/NotificationService';
import type { CustomNotificationOut } from '@/api/NotificationService';
import { useAppMeta } from '@/composables/useAppMeta';
import { useBase } from '@/composables/useBase';
import { useAppStore } from '@/stores/appStore';
import { biMegaphone, biPlusCircle, biRocketTakeoff, biTrophy } from '@quasar/extras/bootstrap-icons';
import { computed, onMounted, ref } from 'vue';
import BaseButton from 'src/components/base/BaseButton.vue';

useAppMeta();
const { appConfirm, appLoading } = useBase();
const appStore = useAppStore();
const loyalty = LoyaltyService();
const notifyApi = NotificationService();

// Backend enforces auth only on these 22 routes (01 drift §7) - scope gate is UI-level,
// flagged for backend hardening.
const canManage = computed(() => appStore.isOrgAdmin);

const tab = ref<'rules' | 'tasks' | 'campaigns' | 'broadcast'>('rules');
const loading = ref(true);
const rules = ref<CustomRuleOut[]>([]);
const tasks = ref<TaskOut[]>([]);
const campaigns = ref<CampaignOut[]>([]);
const completions = ref<TaskCompletionOut[]>([]);
const customInbox = ref<CustomNotificationOut[]>([]);

const dialogRule = ref(false);
const ruleForm = ref({
  id: '' as string,
  name: '',
  description: '',
  verb: '',
  points: 0,
  badge_code: '',
  badge_name: '',
  cooldown_seconds: 0,
  max_awards_per_user: null as number | null,
  is_active: true,
  conditionsText: '{}',
});

const dialogTask = ref(false);
const taskForm = ref({
  id: '' as string,
  title: '',
  description: '',
  points_reward: 0,
  credits_reward: 0,
  badge_code: '',
  is_active: true,
});
const dialogCompletions = ref(false);

const dialogCampaign = ref(false);
const campaignForm = ref({
  id: '' as string,
  title: '',
  description: '',
  starts_at: '',
  ends_at: '',
  bonus_points: 0,
  bonus_credits: 0,
  bonus_badge_code: '',
  status: 'draft',
  task_ids: [] as string[],
});

const broadcastForm = ref({ recipients: '', title: '', body: '', action_url: '' });
const broadcasting = ref(false);

const loadAll = async (): Promise<void> => {
  loading.value = true;
  const [rulesRes, tasksRes, campaignsRes, inboxRes] = await Promise.all([
    loyalty.listRules({ include_inactive: true }),
    loyalty.listTasks({ include_inactive: true }),
    loyalty.listCampaigns(),
    notifyApi.customInbox({ limit: 20 }),
  ]);
  rules.value = rulesRes ?? [];
  tasks.value = tasksRes ?? [];
  campaigns.value = campaignsRes ?? [];
  customInbox.value = inboxRes ?? [];
  loading.value = false;
};

// --- rules ---
const onRuleSave = async (): Promise<void> => {
  let conditions: Record<string, unknown> = {};
  try {
    conditions = JSON.parse(ruleForm.value.conditionsText || '{}');
  } catch {
    return;
  }
  const body = {
    name: ruleForm.value.name,
    description: ruleForm.value.description,
    verb: ruleForm.value.verb,
    points: ruleForm.value.points,
    badge_code: ruleForm.value.badge_code || null,
    badge_name: ruleForm.value.badge_name || null,
    cooldown_seconds: ruleForm.value.cooldown_seconds,
    max_awards_per_user: ruleForm.value.max_awards_per_user,
    is_active: ruleForm.value.is_active,
    conditions,
  };
  appLoading(true);
  if (ruleForm.value.id) {
    await loyalty.updateRule(ruleForm.value.id, body);
  } else {
    await loyalty.createRule(body);
  }
  appLoading(false);
  dialogRule.value = false;
  await loadAll();
};
const onRuleEdit = (row: CustomRuleOut): void => {
  ruleForm.value = {
    id: row.id,
    name: row.name,
    description: row.description,
    verb: row.verb,
    points: row.points,
    badge_code: row.badge_code ?? '',
    badge_name: row.badge_name ?? '',
    cooldown_seconds: row.cooldown_seconds,
    max_awards_per_user: row.max_awards_per_user,
    is_active: row.is_active,
    conditionsText: JSON.stringify(row.conditions ?? {}),
  };
  dialogRule.value = true;
};
const onRuleNew = (): void => {
  ruleForm.value = {
    id: '',
    name: '',
    description: '',
    verb: '',
    points: 0,
    badge_code: '',
    badge_name: '',
    cooldown_seconds: 0,
    max_awards_per_user: null,
    is_active: true,
    conditionsText: '{}',
  };
  dialogRule.value = true;
};
const onRuleDelete = async (row: CustomRuleOut): Promise<void> => {
  const conf = await appConfirm('Delete rule', `Delete rule "${row.name}"?`);
  if (!conf) 
return;
  appLoading(true);
  await loyalty.removeRule(row.id);
  appLoading(false);
  await loadAll();
};

// --- tasks ---
const onTaskSave = async (): Promise<void> => {
  const body = {
    title: taskForm.value.title,
    description: taskForm.value.description,
    points_reward: taskForm.value.points_reward,
    credits_reward: taskForm.value.credits_reward,
    badge_code: taskForm.value.badge_code || null,
    is_active: taskForm.value.is_active,
  };
  appLoading(true);
  if (taskForm.value.id) {
    await loyalty.updateTask(taskForm.value.id, body);
  } else {
    await loyalty.createTask(body);
  }
  appLoading(false);
  dialogTask.value = false;
  await loadAll();
};
const onTaskEdit = (row: TaskOut): void => {
  taskForm.value = {
    id: row.id,
    title: row.title,
    description: row.description,
    points_reward: row.points_reward,
    credits_reward: row.credits_reward,
    badge_code: row.badge_code ?? '',
    is_active: row.is_active,
  };
  dialogTask.value = true;
};
const onTaskNew = (): void => {
  taskForm.value = {
    id: '',
    title: '',
    description: '',
    points_reward: 0,
    credits_reward: 0,
    badge_code: '',
    is_active: true,
  };
  dialogTask.value = true;
};
const onTaskDelete = async (row: TaskOut): Promise<void> => {
  const conf = await appConfirm('Delete task', `Delete task "${row.title}"?`);
  if (!conf) 
return;
  appLoading(true);
  await loyalty.removeTask(row.id);
  appLoading(false);
  await loadAll();
};
const onTaskComplete = async (row: TaskOut): Promise<void> => {
  appLoading(true);
  await loyalty.completeTask(row.id);
  appLoading(false);
};
const onMyCompletions = async (): Promise<void> => {
  dialogCompletions.value = true;
  completions.value = (await loyalty.myCompletions(50)) ?? [];
};

// --- campaigns ---
const toIso = (value: string): string | null => (value ? new Date(value).toISOString() : null);
const onCampaignSave = async (): Promise<void> => {
  const body = {
    title: campaignForm.value.title,
    description: campaignForm.value.description,
    starts_at: toIso(campaignForm.value.starts_at),
    ends_at: toIso(campaignForm.value.ends_at),
    bonus_points: campaignForm.value.bonus_points,
    bonus_credits: campaignForm.value.bonus_credits,
    bonus_badge_code: campaignForm.value.bonus_badge_code || null,
    task_ids: campaignForm.value.task_ids,
  };
  appLoading(true);
  if (campaignForm.value.id) {
    await loyalty.updateCampaign(campaignForm.value.id, {
      ...body,
      status: campaignForm.value.status as 'draft' | 'active' | 'completed' | 'cancelled',
    });
  } else {
    await loyalty.createCampaign(body);
  }
  appLoading(false);
  dialogCampaign.value = false;
  await loadAll();
};
const onCampaignEdit = (row: CampaignOut): void => {
  campaignForm.value = {
    id: row.id,
    title: row.title,
    description: row.description,
    starts_at: row.starts_at ? row.starts_at.slice(0, 16) : '',
    ends_at: row.ends_at ? row.ends_at.slice(0, 16) : '',
    bonus_points: row.bonus_points,
    bonus_credits: row.bonus_credits,
    bonus_badge_code: row.bonus_badge_code ?? '',
    status: row.status,
    task_ids: (row.tasks ?? []).map((t) => t.task_id),
  };
  dialogCampaign.value = true;
};
const onCampaignNew = (): void => {
  campaignForm.value = {
    id: '',
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    bonus_points: 0,
    bonus_credits: 0,
    bonus_badge_code: '',
    status: 'draft',
    task_ids: [],
  };
  dialogCampaign.value = true;
};
const onCampaignDelete = async (row: CampaignOut): Promise<void> => {
  const conf = await appConfirm('Delete campaign', `Delete campaign "${row.title}"?`);
  if (!conf) 
return;
  appLoading(true);
  await loyalty.removeCampaign(row.id);
  appLoading(false);
  await loadAll();
};
const taskOptions = computed(() => tasks.value.map((t) => ({ label: t.title, value: t.id })));

// --- broadcast ---
const onBroadcast = async (mode: 'one' | 'many'): Promise<void> => {
  const { title, body, action_url } = broadcastForm.value;
  if (!title || !body) 
return;
  broadcasting.value = true;
  appLoading(true);
  if (mode === 'one') {
    const recipient = broadcastForm.value.recipients.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)[0];
    if (recipient) {
      await notifyApi.send({ recipient_id: recipient, title, body, action_url: action_url || null });
    }
  } else {
    const recipient_ids = broadcastForm.value.recipients.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    if (recipient_ids.length > 0) {
      await notifyApi.broadcast({ recipient_ids, title, body, action_url: action_url || null });
    }
  }
  appLoading(false);
  broadcasting.value = false;
  customInbox.value = (await notifyApi.customInbox({ limit: 20 })) ?? [];
};
const onMarkCustomRead = async (): Promise<void> => {
  await notifyApi.customMarkRead(null);
  customInbox.value = (await notifyApi.customInbox({ limit: 20 })) ?? [];
};

onMounted(loadAll);
</script>

<template>
  <q-page padding>
    <div class="row items-center q-mb-sm">
      <div class="text-h5">
        <q-icon :name="biTrophy" class="q-mr-sm" />
        Loyalty &amp; B2B2C admin
      </div>
      <q-space />
      <BaseButton v-if="tab === 'tasks'" flat label="My completions" @click="onMyCompletions" />
    </div>
    <q-banner v-if="!canManage" class="bg-warning text-dark q-mb-md" rounded inline-actions>
      Organization-admin scope required. Backend currently enforces authentication only on these
      endpoints (flagged for hardening).
    </q-banner>

    <q-tabs v-model="tab" dense align="left" class="q-mb-md">
      <q-tab name="rules" label="Rules" />
      <q-tab name="tasks" label="Tasks" />
      <q-tab name="campaigns" label="Campaigns" />
      <q-tab name="broadcast" label="Broadcast" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <!-- RULES -->
      <q-tab-panel name="rules">
        <div class="q-mb-sm">
          <BaseButton v-if="canManage" unelevated color="primary" :icon="biPlusCircle" label="New rule" @click="onRuleNew" />
        </div>
        <q-table flat bordered :rows="rules" :loading="loading" row-key="id"
          :columns="[
            { name: 'name', label: 'Name', field: 'name', align: 'left' },
            { name: 'verb', label: 'Verb', field: 'verb', align: 'left' },
            { name: 'points', label: 'Points', field: 'points', align: 'right' },
            { name: 'active', label: 'Active', field: 'is_active', align: 'center' },
            { name: 'actions', label: '', field: 'id', align: 'center' },
          ]" :rows-per-page-options="[0]" hide-pagination>
          <template #body-cell-active="props">
            <q-td :props="props"><q-badge :color="props.row.is_active ? 'positive' : 'grey-5'">{{ props.row.is_active }}</q-badge></q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-center" style="white-space: nowrap">
              <template v-if="canManage">
                <q-btn flat dense size="sm" color="primary" icon="edit" @click="onRuleEdit(props.row)" />
                <q-btn flat dense size="sm" color="negative" icon="delete" @click="onRuleDelete(props.row)" />
              </template>
            </q-td>
          </template>
        </q-table>

        <q-dialog v-model="dialogRule" persistent>
          <q-card style="min-width: 480px; max-width: 640px">
            <q-card-section class="text-h6">{{ ruleForm.id ? 'Edit rule' : 'New rule' }}</q-card-section>
            <q-card-section class="q-gutter-sm">
              <q-input v-model="ruleForm.name" label="Name" outlined dense />
              <q-input v-model="ruleForm.description" label="Description" type="textarea" outlined dense />
              <div class="row q-col-gutter-sm">
                <div class="col-6"><q-input v-model="ruleForm.verb" label="Verb" outlined dense /></div>
                <div class="col-6"><q-input v-model.number="ruleForm.points" type="number" label="Points" outlined dense /></div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6"><q-input v-model="ruleForm.badge_code" label="Badge code" outlined dense /></div>
                <div class="col-6"><q-input v-model="ruleForm.badge_name" label="Badge name" outlined dense /></div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6"><q-input v-model.number="ruleForm.cooldown_seconds" type="number" label="Cooldown (s)" outlined dense /></div>
                <div class="col-6"><q-input v-model.number="ruleForm.max_awards_per_user" type="number" label="Max awards / user" outlined dense clearable /></div>
              </div>
              <q-input v-model="ruleForm.conditionsText" label="Conditions (JSON)" type="textarea" outlined dense autogrow />
              <q-toggle v-model="ruleForm.is_active" label="Active" />
            </q-card-section>
            <q-card-actions align="right">
              <BaseButton flat label="Cancel" v-close-popup />
              <BaseButton unelevated color="primary" label="Save" :disable="!ruleForm.name || !ruleForm.verb" @click="onRuleSave" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- TASKS -->
      <q-tab-panel name="tasks">
        <div class="q-mb-sm">
          <BaseButton v-if="canManage" unelevated color="primary" :icon="biPlusCircle" label="New task" @click="onTaskNew" />
        </div>
        <q-table flat bordered :rows="tasks" :loading="loading" row-key="id"
          :columns="[
            { name: 'title', label: 'Title', field: 'title', align: 'left' },
            { name: 'points', label: 'Points', field: 'points_reward', align: 'right' },
            { name: 'credits', label: 'Credits', field: 'credits_reward', align: 'right' },
            { name: 'active', label: 'Active', field: 'is_active', align: 'center' },
            { name: 'actions', label: '', field: 'id', align: 'center' },
          ]" :rows-per-page-options="[0]" hide-pagination>
          <template #body-cell-active="props">
            <q-td :props="props"><q-badge :color="props.row.is_active ? 'positive' : 'grey-5'">{{ props.row.is_active }}</q-badge></q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-center" style="white-space: nowrap">
              <q-btn flat dense size="sm" color="secondary" icon="task_alt" title="Complete (self)" @click="onTaskComplete(props.row)" />
              <template v-if="canManage">
                <q-btn flat dense size="sm" color="primary" icon="edit" @click="onTaskEdit(props.row)" />
                <q-btn flat dense size="sm" color="negative" icon="delete" @click="onTaskDelete(props.row)" />
              </template>
            </q-td>
          </template>
        </q-table>

        <q-dialog v-model="dialogTask" persistent>
          <q-card style="min-width: 440px">
            <q-card-section class="text-h6">{{ taskForm.id ? 'Edit task' : 'New task' }}</q-card-section>
            <q-card-section class="q-gutter-sm">
              <q-input v-model="taskForm.title" label="Title" outlined dense />
              <q-input v-model="taskForm.description" label="Description" type="textarea" outlined dense />
              <div class="row q-col-gutter-sm">
                <div class="col-6"><q-input v-model.number="taskForm.points_reward" type="number" label="Points reward" outlined dense /></div>
                <div class="col-6"><q-input v-model.number="taskForm.credits_reward" type="number" label="Credits reward" outlined dense /></div>
              </div>
              <q-input v-model="taskForm.badge_code" label="Badge code" outlined dense />
              <q-toggle v-model="taskForm.is_active" label="Active" />
            </q-card-section>
            <q-card-actions align="right">
              <BaseButton flat label="Cancel" v-close-popup />
              <BaseButton unelevated color="primary" label="Save" :disable="!taskForm.title" @click="onTaskSave" />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <q-dialog v-model="dialogCompletions">
          <q-card style="min-width: 480px">
            <q-card-section class="text-h6">My completions</q-card-section>
            <q-card-section>
              <q-list bordered separator>
                <q-item v-for="c in completions" :key="c.id">
                  <q-item-section>
                    <q-item-label>{{ c.task_id }}</q-item-label>
                    <q-item-label caption>{{ c.status }} · +{{ c.points_awarded }} pts · +{{ c.credits_awarded }} cr</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-if="completions.length === 0"><q-item-section class="text-grey-6">No completions yet.</q-item-section></q-item>
              </q-list>
            </q-card-section>
            <q-card-actions align="right"><BaseButton flat label="Close" v-close-popup /></q-card-actions>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- CAMPAIGNS -->
      <q-tab-panel name="campaigns">
        <div class="q-mb-sm">
          <BaseButton v-if="canManage" unelevated color="primary" :icon="biPlusCircle" label="New campaign" @click="onCampaignNew" />
        </div>
        <q-table flat bordered :rows="campaigns" :loading="loading" row-key="id"
          :columns="[
            { name: 'title', label: 'Title', field: 'title', align: 'left' },
            { name: 'status', label: 'Status', field: 'status', align: 'left' },
            { name: 'bonus', label: 'Bonus', field: 'bonus_points', align: 'right' },
            { name: 'window', label: 'Window', field: 'starts_at', align: 'left' },
            { name: 'actions', label: '', field: 'id', align: 'center' },
          ]" :rows-per-page-options="[0]" hide-pagination>
          <template #body-cell-status="props">
            <q-td :props="props"><q-badge :color="props.row.status === 'active' ? 'positive' : props.row.status === 'completed' ? 'info' : 'grey-6'">{{ props.row.status }}</q-badge></q-td>
          </template>
          <template #body-cell-bonus="props">
            <q-td :props="props">+{{ props.row.bonus_points }} pts / +{{ props.row.bonus_credits }} cr</q-td>
          </template>
          <template #body-cell-window="props">
            <q-td :props="props">
              <div style="font-size: 0.8rem">{{ props.row.starts_at?.slice(0, 10) ?? '—' }} → {{ props.row.ends_at?.slice(0, 10) ?? '—' }}</div>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-center" style="white-space: nowrap">
              <template v-if="canManage">
                <q-btn flat dense size="sm" color="primary" icon="edit" @click="onCampaignEdit(props.row)" />
                <q-btn flat dense size="sm" color="negative" icon="delete" @click="onCampaignDelete(props.row)" />
              </template>
            </q-td>
          </template>
        </q-table>

        <q-dialog v-model="dialogCampaign" persistent>
          <q-card style="min-width: 480px; max-width: 640px">
            <q-card-section class="text-h6">{{ campaignForm.id ? 'Edit campaign' : 'New campaign' }}</q-card-section>
            <q-card-section class="q-gutter-sm">
              <q-input v-model="campaignForm.title" label="Title" outlined dense />
              <q-input v-model="campaignForm.description" label="Description" type="textarea" outlined dense />
              <div class="row q-col-gutter-sm">
                <div class="col-6"><q-input v-model="campaignForm.starts_at" type="datetime-local" label="Starts" outlined dense /></div>
                <div class="col-6"><q-input v-model="campaignForm.ends_at" type="datetime-local" label="Ends" outlined dense /></div>
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-6"><q-input v-model.number="campaignForm.bonus_points" type="number" label="Bonus points" outlined dense /></div>
                <div class="col-6"><q-input v-model.number="campaignForm.bonus_credits" type="number" label="Bonus credits" outlined dense /></div>
              </div>
              <q-input v-model="campaignForm.bonus_badge_code" label="Bonus badge code" outlined dense />
              <q-select v-if="campaignForm.id" v-model="campaignForm.status" :options="['draft', 'active', 'completed', 'cancelled']" label="Status" outlined dense />
              <q-select v-model="campaignForm.task_ids" :options="taskOptions" label="Tasks" outlined dense multiple chips use-chips />
            </q-card-section>
            <q-card-actions align="right">
              <BaseButton flat label="Cancel" v-close-popup />
              <BaseButton unelevated color="primary" label="Save" :disable="!campaignForm.title" @click="onCampaignSave" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-tab-panel>

      <!-- BROADCAST -->
      <q-tab-panel name="broadcast">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="text-h6 q-mb-sm">
                <q-icon :name="biMegaphone" class="q-mr-sm" />Send custom notification
              </div>
              <div class="text-caption text-grey-7 q-mb-sm">
                Recipients: user IDs separated by comma or newline. One = send, several = broadcast.
              </div>
              <q-input v-model="broadcastForm.recipients" label="Recipient user IDs" type="textarea" outlined dense autogrow class="q-mb-sm" />
              <q-input v-model="broadcastForm.title" label="Title" outlined dense class="q-mb-sm" />
              <q-input v-model="broadcastForm.body" label="Body" type="textarea" outlined dense class="q-mb-sm" />
              <q-input v-model="broadcastForm.action_url" label="Action URL (optional)" outlined dense class="q-mb-sm" />
              <div class="row q-gutter-sm">
                <BaseButton unelevated color="primary" label="Send to one" :loading="broadcasting" :disable="!broadcastForm.title || !broadcastForm.body" @click="onBroadcast('one')" />
                <BaseButton unelevated color="secondary" label="Broadcast to many" :loading="broadcasting" :disable="!broadcastForm.title || !broadcastForm.body" @click="onBroadcast('many')" />
              </div>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat bordered class="q-pa-md">
              <div class="row items-center q-mb-sm">
                <div class="text-h6"><q-icon :name="biRocketTakeoff" class="q-mr-sm" />Custom inbox (latest)</div>
                <q-space />
                <BaseButton flat label="Mark read" @click="onMarkCustomRead" />
              </div>
              <q-list bordered separator>
                <q-item v-for="n in customInbox" :key="n.id">
                  <q-item-section>
                    <q-item-label>{{ n.title }}</q-item-label>
                    <q-item-label caption>{{ n.body }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :color="n.unread ? 'negative' : 'grey-5'">{{ n.unread ? 'new' : 'read' }}</q-badge>
                  </q-item-section>
                </q-item>
                <q-item v-if="customInbox.length === 0">
                  <q-item-section class="text-grey-6">No custom notifications yet.</q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </div>
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>
