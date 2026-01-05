<template>
  <div class="settings-shell">
    <aside class="settings-nav">
      <p class="title">设置目录</p>
      <button
        v-for="item in navItems"
        :key="item.key"
        :class="{ active: activeItem === item.key }"
        @click="$emit('select-item', item.key)"
      >
        {{ item.label }}
      </button>
    </aside>

    <section class="settings-content">
      <slot />
    </section>
  </div>
</template>

<script setup>
const props = defineProps({
  activeItem: { type: String, required: true }
});

const navItems = [
  { key: "profile", label: "个人资料" },
  { key: "notifications", label: "通知设置" },
  { key: "security", label: "安全设置" }
];
</script>

<style scoped lang="scss">
.settings-shell {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
}

.settings-nav {
  background: #0f172a;
  color: #cbd5f5;
  border-radius: 22px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .title {
    margin: 0 0 4px;
    font-weight: 600;
    color: #e2e8f0;
  }

  button {
    border: none;
    background: transparent;
    color: inherit;
    padding: 10px 14px;
    border-radius: 12px;
    text-align: left;
    cursor: pointer;
    transition: background 0.2s ease;

    &.active,
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

.settings-content {
  background: #fff;
  border-radius: 24px;
  padding: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

@media (max-width: 960px) {
  .settings-shell {
    grid-template-columns: 1fr;
  }

  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
  }
}
</style>
