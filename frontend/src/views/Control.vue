<template>
  <VContainer fluid class="control-view" align="center">
    <VRow class="w-100" align="center" justify="center">
      <VCol
        class="d-flex flex-column align-center"
        cols="12"
        md="7"
        align="center"
      >
        <VSheet
          class="mb-1 rounded-t-lg control-sheet"
          color="surface"
          elevation="0"
          max-width="800"
          width="100%"
        >
          <VCard
            class="text-secondary"
            title="LED Controls"
            color="surface"
            subtitle="Recent settings"
            variant="tonal"
            flat
          >
            <VCardText>
              <span class="text-body-2">
                Brightness: {{ led.brightness }} | LED Nodes: {{ led.leds }}
              </span>
            </VCardText>
          </VCard>
        </VSheet>

        <VSheet
          class="mb-1 control-sheet"
          color="surface"
          elevation="0"
          max-width="800"
          width="100%"
        >
          <VCard class="pt-5" color="surface" variant="tonal">
            <VSlider
              class="pt-2 bg-surface"
              v-model="led.brightness"
              append-icon="mdi:mdi-car-light-high"
              density="compact"
              :thumb-size="16"
              color="secondary"
              label="Brightness"
              direction="horizontal"
              :min="0"
              :max="250"
              :step="10"
              show-ticks
              thumb-label="always"
            />
          </VCard>
        </VSheet>

        <VSheet
          class="mb-1 control-sheet d-flex justify-center align-center"
          color="surface"
          elevation="0"
          max-width="800"
          width="100%"
          justify="center"
          align="center"
        >
          <VCard class="pt-5" color="surface" variant="tonal" width="100%">
            <VSlider
              class="pt-2 bg-surface"
              v-model="led.leds"
              append-icon="mdi:mdi-led-on"
              density="compact"
              :thumb-size="16"
              color="secondary"
              label="LED Nodes"
              direction="horizontal"
              :min="1"
              :max="7"
              :step="1"
              show-ticks
              thumb-label="always"
            />
          </VCard>
        </VSheet>

        <VSheet
          class="mb-1 pa-2 control-sheet d-flex justify-center align-center"
          color="surface"
          elevation="0"
          max-width="800"
          width="100%"
          border
          justify="center"
          align="center"
        >
          <VProgressCircular
            :model-value="led.leds * 15"
            :rotate="0"
            :size="200"
            :width="15"
            :color="indicatorColor"
          >
            <span class="text-onSurface font-weight-bold"
              >{{ led.leds }} LED(s)</span
            >
          </VProgressCircular>
        </VSheet>
      </VCol>

      <VCol
        class="d-flex align-center justify-center"
        cols="12"
        md="5"
        align="center"
      >
        <VSheet
          class="control-sheet pa-2"
          color="surface"
          elevation="0"
          max-width="800"
          width="100%"
        >
          <VCard color="surface" variant="tonal">
            <VCardTitle class="text-secondary">LED Colour</VCardTitle>
            <VColorPicker v-model="led.color" />
          </VCard>
        </VSheet>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, reactive, watch } from "vue";
import { useMqttStore } from "@/store/mqttStore";

const Mqtt = useMqttStore();
const { payload, payloadTopic } = storeToRefs(Mqtt);

const led = reactive({
  brightness: 255,
  leds: 1,
  color: { r: 255, g: 0, b: 255, a: 1 },
});
let ID = 1000;
let subscribeTimeoutId;

// MQTT CONNECT/SUBSCRIBE
onMounted(() => {
  // Connect to broker (mqttStore.js config)
  Mqtt.connect();

  // Give the websocket a moment to establish before subscribing.
  subscribeTimeoutId = setTimeout(() => {
    // Topics used by the rest of this template (backend + hardware)
    Mqtt.subscribe("620171008");
    Mqtt.subscribe("620171008_pub");
  }, 3000);
});

onBeforeUnmount(() => {
  clearTimeout(subscribeTimeoutId);
  try {
    // Unsubscribe from all topics and disconnect.
    Mqtt.unsubscribeAll();
  } catch (e) {
    // Avoid hard-failing route changes if the client isn't connected yet.
    console.log(`MQTT: unsubscribeAll failed: ${e}`);
  }
});

// COMPUTED PROPERTIES
const indicatorColor = computed(() => {
  return `rgba(${led.color.r},${led.color.g},${led.color.b},${led.color.a})`;
});

// WATCHERS
watch(led, (controls) => {
  clearTimeout(ID);
  ID = setTimeout(() => {
    const message = JSON.stringify({
      type: "controls",
      brightness: controls.brightness,
      leds: controls.leds,
      color: controls.color,
    });
    Mqtt.publish("620171008_sub", message); // Publish to a topic subscribed to by the hardware
  }, 1000);
});
</script>

<style scoped>
.control-view {
  display: flex;
  justify-content: center;
}

.control-view > .v-row {
  max-width: 1200px;
}

.control-sheet {
  width: 100%;
}
</style>
