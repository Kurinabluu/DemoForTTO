<script setup>
import { Z_INDEX } from '@/constants/zIndex'
import { isPostLoginSyncing } from '@/utils/favoritesStore'

const overlayZIndex = Z_INDEX.dialog.high + 10
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isPostLoginSyncing"
      class="favorites-sync-overlay"
      :style="{ zIndex: overlayZIndex }"
    >
      <div class="sync-loading-card">
        <span class="sync-spinner" />
        <p>正在同步收藏，请稍候...</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.favorites-sync-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(2px);
  pointer-events: all;
  touch-action: none;
}

.sync-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 28px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(51, 177, 163, 0.16);
  color: #555;
  font-size: 14px;
}

.sync-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(51, 177, 163, 0.2);
  border-top-color: #33b1a3;
  border-radius: 50%;
  animation: favorites-sync-spin 0.8s linear infinite;
}

@keyframes favorites-sync-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
