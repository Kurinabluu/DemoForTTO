<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { estimateVirtualRowSize } from '@/utils/virtualGridRows'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  gridClass: { type: String, default: 'coming-grid' },
  columns: { type: Number, default: 4 },
})

const scrollMargin = ref(0)

function updateScrollMargin() {
  if (typeof window === 'undefined') return
  scrollMargin.value = window.scrollY || document.documentElement.scrollTop || 0
}

const rowList = computed(() => (Array.isArray(props.rows) ? props.rows : []))

const virtualizer = useVirtualizer({
  count: computed(() => rowList.value.length),
  getScrollElement: () => (typeof document !== 'undefined' ? document.documentElement : null),
  estimateSize: (index) => estimateVirtualRowSize(rowList.value[index]),
  overscan: 6,
  scrollMargin,
})

watch(
  () => [rowList.value.length, props.columns],
  () => {
    updateScrollMargin()
    virtualizer.value.measure()
  },
)

onMounted(() => {
  updateScrollMargin()
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', updateScrollMargin, { passive: true })
    window.addEventListener('resize', updateScrollMargin, { passive: true })
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', updateScrollMargin)
    window.removeEventListener('resize', updateScrollMargin)
  }
})
</script>

<template>
  <div
    class="virtual-location-grid"
    :style="{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }"
  >
    <div
      v-for="virtualRow in virtualizer.getVirtualItems()"
      :key="String(virtualRow.key)"
      class="virtual-location-grid__row"
      :style="{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        transform: `translateY(${virtualRow.start - scrollMargin}px)`,
      }"
    >
      <h1
        v-if="rowList[virtualRow.index]?.type === 'header'"
        class="region-title center"
      >
        {{ rowList[virtualRow.index].title }}
      </h1>
      <div
        v-else
        :class="gridClass"
        :style="{ gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))` }"
      >
        <template
          v-for="(item, itemIndex) in rowList[virtualRow.index]?.items || []"
          :key="`${virtualRow.index}-${itemIndex}`"
        >
          <slot
            name="card"
            :item="item"
            :index="(rowList[virtualRow.index]?.baseIndex || 0) + itemIndex"
          />
        </template>
      </div>
    </div>
  </div>
</template>
