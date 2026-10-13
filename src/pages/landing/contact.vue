<script setup lang="ts">
/**
 * Contact Page
 *
 * Contact form with Supabase integration placeholder.
 * Includes contact information and form validation.
 *
 * @page
 * @accessibility
 * - Form has proper labels and ARIA descriptions
 * - Error states are announced to screen readers
 * - Success message uses role="status" for announcements
 *
 * @responsive
 * - Stacked layout on mobile
 * - Two-column on desktop (form + contact info)
 *
 * @todo Implement Supabase integration
 * @see https://supabase.com/docs
 */

import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

/**
 * Contact form data interface
 */
interface ContactForm {
  name: string;
  email: string;
  message: string;
}

/**
 * Form state
 */
const form = ref<ContactForm>({
  name: '',
  email: '',
  message: '',
});

const loading = ref(false);
const submitted = ref(false);

/**
 * Form validation rules
 */
const nameRules = [
  (val: string) => !!val || 'Name is required',
  (val: string) => val.length >= 2 || 'Name must be at least 2 characters',
];

const emailRules = [
  (val: string) => !!val || 'Email is required',
  (val: string) => /.[^\n\r@\u2028\u2029]*@.+\..+/.test(val) || 'Please enter a valid email',
];

const messageRules = [
  (val: string) => !!val || 'Message is required',
  (val: string) => val.length >= 10 || 'Message must be at least 10 characters',
];

/**
 * Form validation state
 */
const isFormValid = computed(() => {
  return form.value.name.length >= 2 &&
    /.[^\n\r@\u2028\u2029]*@.+\..+/.test(form.value.email) &&
    form.value.message.length >= 10;
});

/**
 * Submit form handler
 * @todo Replace with actual Supabase implementation
 *
 * @example
 * // Supabase implementation:
 * import { createClient } from '@supabase/supabase-js';
 * const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);
 * const { data, error } = await supabase.from('contacts').insert([form.value]);
 */
const submitForm = async () => {
  if (!isFormValid.value) {
    $q.notify({
      type: 'negative',
      message: 'Please fill in all required fields correctly',
      aria: 'Form validation error',
    });
    return;
  }

  loading.value = true;

  try {
    // Simulate API call - Replace with Supabase
    // const { data, error } = await supabase.from('contacts').insert([form.value]);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    submitted.value = true;
    form.value = { name: '', email: '', message: '' };

    $q.notify({
      type: 'positive',
      message: 'Thank you! We\'ll contact you soon.',
      role: 'status',
      ariaLive: 'polite',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'An error occurred. Please try again.',
    });
  } finally {
    loading.value = false;
  }
};

/**
 * Reset form handler
 */
const resetForm = () => {
  submitted.value = false;
  form.value = { name: '', email: '', message: '' };
};

/**
 * Contact information data
 */
const contactInfo = [
  { icon: 'email', label: 'Email', value: 'contact@xtech.com', ariaLabel: 'Email address' },
  { icon: 'phone', label: 'Phone', value: '+1 (555) 123-4567', ariaLabel: 'Phone number' },
  { icon: 'location_on', label: 'Address', value: 'Jamaica', ariaLabel: 'Physical address' },
  { icon: 'schedule', label: 'Hours', value: 'Mon-Fri 9AM-6PM EST', ariaLabel: 'Business hours' },
];
</script>

<template>
  <q-page
    class="contact-page q-pa-xl"
    role="region"
    aria-labelledby="contact-heading"
  >
    <header class="q-mb-xl">
      <h1 id="contact-heading" class="text-h4 text-weight-bold text-primary q-mb-sm">
        Contact Us
      </h1>
      <p class="text-body1 text-grey-7">
        Have questions? We'd love to hear from you. Send us a message and we'll get back to you.
      </p>
    </header>

    <div class="row q-col-gutter-lg">
      <!-- Contact Form -->
      <section class="col-12 col-md-6" aria-labelledby="form-heading">
        <h2 id="form-heading" class="visually-hidden">Contact Form</h2>

        <q-card class="q-pa-lg contact-form-card">
          <!-- Success State -->
          <div
            v-if="submitted"
            class="text-center q-pa-md"
            role="status"
            aria-live="polite"
          >
            <q-icon
              name="check_circle"
              size="64px"
              color="positive"
              aria-hidden="true"
            />
            <h3 class="text-h6 q-mt-md text-positive">Message Sent!</h3>
            <p class="text-body2 text-grey-7">
              Thank you for contacting us. We'll get back to you within 24-48 hours.
            </p>
            <q-btn
              flat
              color="primary"
              label="Send Another Message"
              class="q-mt-md"
              @click="resetForm"
            />
          </div>

          <!-- Form -->
          <q-form
            v-else
            @submit.prevent="submitForm"
            class="q-gutter-md"
            aria-describedby="form-description"
          >
            <p id="form-description" class="visually-hidden">
              Fill out this form to send us a message. All fields are required.
            </p>

            <q-input
              v-model="form.name"
              label="Your Name"
              outlined
              :rules="nameRules"
              aria-required="true"
              autocomplete="name"
            >
              <template #prepend>
                <q-icon name="person" aria-hidden="true" />
              </template>
            </q-input>

            <q-input
              v-model="form.email"
              label="Email Address"
              type="email"
              outlined
              :rules="emailRules"
              aria-required="true"
              autocomplete="email"
            >
              <template #prepend>
                <q-icon name="email" aria-hidden="true" />
              </template>
            </q-input>

            <q-input
              v-model="form.message"
              label="Your Message"
              type="textarea"
              outlined
              rows="4"
              :rules="messageRules"
              aria-required="true"
            >
              <template #prepend>
                <q-icon name="message" aria-hidden="true" />
              </template>
            </q-input>

            <q-btn
              type="submit"
              color="primary"
              label="Send Message"
              :loading="loading"
              class="full-width"
              size="lg"
              icon="send"
              :disable="!isFormValid"
              aria-label="Submit contact form"
            />
          </q-form>

          <!-- Supabase Note -->
          <q-banner class="bg-grey-2 rounded-borders q-mt-md" role="note">
            <template #avatar>
              <q-icon name="info" color="grey-7" aria-hidden="true" />
            </template>
            <p class="q-ma-none text-caption">
              Contact submissions are stored securely using Supabase.
            </p>
            <template #action>
              <q-btn
                flat
                dense
                label="Learn More"
                color="primary"
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Learn more about Supabase (opens in new tab)"
              />
            </template>
          </q-banner>
        </q-card>
      </section>

      <!-- Contact Information -->
      <aside class="col-12 col-md-6" aria-labelledby="info-heading">
        <h2 id="info-heading" class="text-h6 q-mb-md">Contact Information</h2>

        <q-card class="q-pa-lg">
          <q-list>
            <q-item
              v-for="item in contactInfo"
              :key="item.label"
              :aria-label="item.ariaLabel"
            >
              <q-item-section avatar>
                <q-icon
                  :name="item.icon"
                  color="secondary"
                  aria-hidden="true"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.label }}</q-item-label>
                <q-item-label caption>{{ item.value }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Social Links -->
          <q-separator class="q-my-md" />
          <div class="text-subtitle2 q-mb-sm">Follow Us</div>
          <div class="row q-gutter-sm">
            <q-btn
              flat
              round
              icon="facebook"
              aria-label="Follow us on Facebook"
            />
            <q-btn
              flat
              round
              icon="twitter"
              aria-label="Follow us on Twitter"
            />
            <q-btn
              flat
              round
              icon="linkedin"
              aria-label="Follow us on LinkedIn"
            />
            <q-btn
              flat
              round
              icon="Instagram"
              aria-label="Follow us on Instagram"
            />
          </div>
        </q-card>

        <!-- Map Placeholder -->
        <q-card class="q-mt-md q-pa-md">
          <div class="text-subtitle2 q-mb-sm">Find Us</div>
          <div
            class="bg-grey-2 rounded-borders flex flex-center"
            style="height: 200px"
            role="img"
            aria-label="Map showing XTech location in Jamaica"
          >
            <div class="text-center text-grey-6">
              <q-icon name="map" size="48px" />
              <p class="q-ma-none q-mt-sm">Map View</p>
              <p class="text-caption">Jamaica</p>
            </div>
          </div>
        </q-card>
      </aside>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.contact-page {
  max-width: 1200px;
  margin: 0 auto;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.contact-form-card {
  transition: box-shadow 0.2s ease;

  &:focus-within {
    box-shadow: 0 4px 16px rgba(30, 58, 138, 0.15);
  }
}

/**
 * Responsive adjustments
 */
@media (max-width: 599px) {
  .contact-page {
    padding: 24px 16px;
  }
}
</style>