<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useNavStore } from '@/stores/nav'
import { useRouter } from 'vue-router'
import data from '@/data/data.json'

// 从data.json中提取所有tagName
const tags = data.map(item => item.tagName)

// 本地搜索输入值
const searchInput = ref('')

const localActiveTag = ref('')

// 使用导航store
const navStore = useNavStore()
const router = useRouter()

// 当前激活的标签（组件内部独立实现）
const activeTag = computed(() => {
  // 优先使用组件内部的激活标签状态
  if (localActiveTag.value) {
    return localActiveTag.value
  }
  // 如果都没有，使用默认标签
  if (tags.length > 0 && !localActiveTag.value) {
    localActiveTag.value = tags[0]
    return tags[0]
  }
  return ''
})

// 在标签点击事件中添加路由跳转
function onClickTag(tag) {
  try {
    // 更新组件内部的激活标签状态
    localActiveTag.value = tag

    // 更新搜索框值
    searchInput.value = tag

    // 重置子导航为默认值
    navStore.saveSelectedSubNav('景点')

    // 根据data.json中的path配置进行路由跳转
    const tagData = data.find(item => item.tagName === tag)
    if (tagData && tagData.path) {
      const fullPath = `/DemoForTTO/${tagData.path}`
      
      // 如果是freeinfo路径，添加subNavName参数
      if (tagData.path === 'trips/freeinfo') {
        router.push({ path: fullPath, query: { subNavName: '景点' } })
      }
      // 如果是oneday路径，添加dayTripTab参数
      else if (tagData.path === 'trips/oneday') {
        router.push({ path: fullPath, query: { dayTripTab: '景点一日游' } })
      } else {
        router.push(fullPath)
      }
    }

    // 通知父组件清空搜索
    // emit('clearSearch')

    console.log('标签点击:', tag, '路由跳转到:', tagData?.path)
  } catch (error) {
    console.error('标签点击处理失败:', error)
  }
}

// 根据路由路径同步标签状态
function syncTagWithRoute() {
  try {
    const currentPath = router.currentRoute.value.path

    // 根据当前路由路径找到对应的标签
    const matchedTag = data.find(item => {
      if (item.path) {
        return currentPath.includes(item.path)
      }
      return false
    })

    if (matchedTag) {
      localActiveTag.value = matchedTag.tagName
      searchInput.value = matchedTag.tagName
      return
    }

    // 如果都没有，使用默认标签
    if (tags.length > 0 && !localActiveTag.value) {
      localActiveTag.value = tags[0]
      searchInput.value = tags[0]
    }
  } catch (error) {
    console.error('同步标签与路由失败:', error)
  }
}

// 组件挂载时初始化
onMounted(() => {
  // 尝试根据当前路由路径设置激活标签
  syncTagWithRoute()
})

// 监听路由变化，同步标签状态
watch(() => router.currentRoute.value.path, () => {
  syncTagWithRoute()
})

// 搜索按钮点击事件
function onSearch() {
  console.log('搜索:', searchInput.value)
  // 未来可以实现搜索弹窗或搜索页面跳转
}
</script>

<template>
  <div class="search-fixed">
    <el-card class="search-card" shadow="hover">
      <div class="search-container">
        <el-input v-model="searchInput" placeholder="搜索目的地、景点、路线..." class="search-input" size="large" clearable>
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
        <div v-for="tag in tags" :key="tag" class="tag-pill pointer fs16" :class="{ active: activeTag === tag }"
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