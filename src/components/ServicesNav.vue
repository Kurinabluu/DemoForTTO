<script setup>
import { ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useNavStore } from '@/stores/nav'

// 定义props，从父组件接收数据
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  popularTags: {
    type: Array,
    default: () => []
  },
  activeTag: {
    type: String,
    default: ''
  }
})

// 定义事件，通知父组件数据变化
const emit = defineEmits(['update:modelValue', 'tag-click', 'search'])

// 本地搜索输入值
const searchInput = ref(props.modelValue)

// 响应modelValue变化
watch(() => props.modelValue, (newValue) => {
  searchInput.value = newValue
})

// 标签点击事件处理
function onClickTag(tag) {
  // 通知父组件标签被点击
  emit('tag-click', tag)
}

// 搜索按钮点击事件
function onSearch() {
  emit('search', searchInput.value)
}
// 在 ServicesNav.vue 的点击标签处理函数中
function handleTagClick(tag) {
  if (tag === '自助游/自驾游免费信息') {
    router.push({ name: 'Trips' });
  } else if (tag === '代订门票及旅游项目') {
    router.push({ name: 'Service' });
  }
  // 其他标签处理...
}
</script>

<template>
  <div class="search-fixed">
    <el-card class="search-card" shadow="hover">
      <div class="search-container">
        <el-input v-model="searchInput" placeholder="搜索目的地、景点、路线..." class="search-input" size="large" clearable
          @update:model-value="emit('update:modelValue', $event)">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-button type="primary" size="large" class="search-btn" @click="onSearch">
          <el-icon>
            <Search />
          </el-icon>
          搜索
        </el-button>
      </div>
      <div class="search-tags">
        <div v-for="tag in popularTags" :key="tag" class="tag-pill pointer fs16" :class="{ active: activeTag === tag }"
          @click="onClickTag(tag)" :data-service="tag">
          {{ tag }}
        </div>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.search-fixed {
  display: flex;
  justify-content: center;
  position: relative;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 0 20px;

  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .search-card {
    border-radius: 12px;
    border: none;

    .search-container {
      display: flex;
      gap: 12px;
      width: 800px;
      margin-bottom: 30px;

      .search-input {
        flex: 1;

        :deep(.el-input__wrapper) {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          height: 48px;
          padding: 6px 14px;
          font-size: 15px;
        }
      }

      .search-btn {
        border-radius: 8px;
        padding: 0 24px;
        font-weight: 500;
        height: 48px;
      }
    }

    .search-tags {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      width: 1200px;

      .tag-pill {
        display: flex;
        border-radius: 10px;
        transition: all 0.2s ease;
        height: 40px;
        align-items: center;
        justify-content: center;
        padding: 0 10px;
        text-align: center;
        background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
        color: #3b82f6;
        user-select: none;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.03) inset;
      }

      .active {
        background: linear-gradient(180deg, #4f86ff 0%, #3a6ff2 100%);
        color: #fff;
        box-shadow: 0 6px 16px rgba(63, 111, 242, 0.26);
      }
    }
  }
}

/* 响应式适配：平板（768px-1024px） */
@media (min-width: 769px) and (max-width: 1024px) {
  .el-container {
    .el-main {
      .search-fixed {
        display: flex;
        justify-content: center;
        bottom: 16px;
        margin-bottom: 20px;

        .search-card {
          max-width: 720px;
        }

        .search-container {
          width: 100%;
        }

        .search-tags {
          grid-template-columns: repeat(4, 1fr);
          width: 100%;
        }

        .tag-pill {
          font-size: 13px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .el-container {
    .el-main {
      .search-fixed {
        position: static;
        transform: none;
        z-index: auto;
        width: 100%;
        padding: 8px 12px 20px;
        top: auto;
        // margin-bottom: 20px;

        .search-card {
          max-width: 95vw;
          margin-top: 8px;
        }

        .search-container {
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .search-input {
          width: 100%;
        }

        .search-btn {
          width: 100%;
        }

        .search-tags {
          gap: 6px;
          grid-template-columns: repeat(2, 1fr);
          width: 100%;
        }

        .tag-pill {
          padding: 6px 10px;
          line-height: 1.3;
          // font-size: 12px;
        }
      }
    }
  }
}

/* 超小屏幕设备适配（iPhone 4、iPhone 5、iPhone SE等，<=375px） */
@media (max-width: 375px) {
  .el-container {
    .el-main {
      .search-fixed {
        padding: 6px 8px 20px;
        // margin-bottom: 20px;

        .search-card {
          max-width: 98vw;
        }

        .search-tags {
          grid-template-columns: repeat(2, 1fr);
        }

        .tag-pill {
          padding: 4px 8px;
          // font-size: 11px;
          line-height: 1.2;
        }
      }
    }
  }
}

/* 极超小屏幕设备适配（iPhone 4等，<=320px） */
@media (max-width: 320px) {
  .el-container {
    .el-main {
      .search-fixed {
        // padding: 4px 6px 20px;
        padding: 4px 6px 0;
        // margin-bottom: 20px;

        .search-card {
          max-width: 99vw;
        }

        .search-tags {
          grid-template-columns: repeat(2, 1fr);
        }

        .tag-pill {
          padding: 3px 6px;
          font-size: 14px;
          line-height: 1.1;
        }
      }
    }
  }
}
</style>