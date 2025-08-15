<script setup>
// 搜索相关数据
import { ref, onMounted, onUnmounted } from 'vue'
import { Search, Location, Phone, Message, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

function onNavClick(event) {
  const clickedElement = event.currentTarget;
  const btnsContainer = clickedElement.closest('.btns');
  if (!btnsContainer) {
    clickedElement.classList.add('clicked');
    return;
  }
  const candidates = btnsContainer.querySelectorAll('.ul-css li, i');
  candidates.forEach((node) => node.classList.remove('clicked'));
  clickedElement.classList.add('clicked');
}

// 轮播图图片源：PC 使用 newbn*.jpg；手机/平板仅使用 newbn1.jpg
// const desktopModules = import.meta.glob('@/assets/img/newbn*.{jpg,JPG,jpeg,JPEG}', { eager: true });
const desktopModules = import.meta.glob('@/assets/img/footer*.{jpg,JPG,jpeg,JPEG}', { eager: true });
// const desktopModules = import.meta.glob('@/assets/img/newbn*.jpg', { eager: true });
const desktopSlides = Object.entries(desktopModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => (typeof mod === 'string' ? mod : mod.default))
  .filter(Boolean);
// const desktopSlides = Object.values(desktopModules).map((mod) => (typeof mod === 'string' ? mod : mod.default));

// 移动端同样展示 4 张轮播图
const mobileSlides = desktopSlides

const footerModules = import.meta.glob('@/assets/img/footer*.jpg', { eager: true });
const footerSlides = Object.values(footerModules).map((mod) => (typeof mod === 'string' ? mod : mod.default));


const searchText = ref('')
const popularTags = ref([
  '自助游/自驾游参考信息',
  '单项旅游项目',
  '全日固定行程专车团',
  '多日固定行程专车团',
  '私人定制专属行程',
  '私人定制专属专车司导',
  '包车服务（司导）',
  '旅游管家服务'
])
const isDialogVisible = ref(false)

// 响应式选择轮播图（<=1024 为手机/平板）与高度
const slidesRef = ref([])
const carouselHeight = ref('800px')
const isMobileOrTablet = ref(typeof window !== 'undefined' ? window.innerWidth <= 1024 : false)
const selectSlides = () => {
  const isMobile = isMobileOrTablet.value
  slidesRef.value = (isMobile ? mobileSlides : desktopSlides).filter(Boolean)
  if (!isMobile) {
    carouselHeight.value = '800px'
  } else {
    // 手机/平板高度适配
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024
    carouselHeight.value = w <= 768 ? '420px' : '600px'
  }
}
const handleResizeForSlides = () => {
  if (typeof window === 'undefined') return
  const next = window.innerWidth <= 1024
  if (next !== isMobileOrTablet.value) {
    isMobileOrTablet.value = next
    selectSlides()
  } else {
    // 同一类别也需要根据宽度微调高度
    selectSlides()
  }
}

// 轮播图引用与触摸滑动支持（手机/平板）
const carouselRef = ref(null)
const currentSlideIndex = ref(0)
let touchStartX = 0
let touchStartY = 0
let touchDeltaX = 0
let touchDeltaY = 0

function onTouchStart(e) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchStartX = t.clientX
  touchStartY = t.clientY
  touchDeltaX = 0
  touchDeltaY = 0
}

function onTouchMove(e) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchDeltaX = t.clientX - touchStartX
  touchDeltaY = t.clientY - touchStartY
}

function onTouchEnd() {
  const horizontal = Math.abs(touchDeltaX) > Math.abs(touchDeltaY)
  const distance = Math.abs(touchDeltaX)
  const MIN_SWIPE = 50
  if (horizontal && distance >= MIN_SWIPE) {
    if (touchDeltaX < 0) {
      // 左滑，下一张
      carouselRef.value && carouselRef.value.next && carouselRef.value.next()
    } else {
      // 右滑，上一张
      carouselRef.value && carouselRef.value.prev && carouselRef.value.prev()
    }
  }
}

// 轮播图切换事件处理
function onCarouselChange(index) {
  currentSlideIndex.value = index
}

// 电梯导航相关
const showElevator = ref(false)
const isAtBottom = ref(false)

// 滚动处理函数
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  const carouselHeight = 800 // 轮播图高度
  const threshold = carouselHeight * 2 / 3 // 约533px

  // 滚动超过2/3轮播图高度时显示电梯导航
  const shouldShow = scrollTop > threshold
  showElevator.value = shouldShow

  // 检查是否到达底部（距离底部10px以内）
  const isNearBottom = scrollTop + windowHeight >= documentHeight - 10
  isAtBottom.value = isNearBottom
}

// 回到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 跳到底部
const scrollToBottom = () => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  })
}

// 监听滚动事件
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  selectSlides()
  window.addEventListener('resize', handleResizeForSlides)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResizeForSlides)
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="fs15 bgfff">
        <span class="logo fowe7 no-select pointer">TasmaniaTrips.Online</span>
        <span class="btns no-select">
          <ul class="ul-css clearfix">
            <li class="pointer clicked" @click="onNavClick">网站首页</li>
            <li class="pointer" @click="onNavClick">精品路线</li>
            <li class="pointer" @click="onNavClick">行业新闻</li>
            <li class="pointer" @click="onNavClick">八大服务</li>
            <li class="pointer" @click="onNavClick">联系我们</li>
          </ul>
          <!-- <i class="flri pointer" @click="onNavClick">Operating By WorldTrips.Online</i> -->
        </span>
      </el-header>

      <el-main>
        <!-- 轮播图 -->
        <div class="carousel-container" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd">
          <!-- 背景图片层 -->
          <div class="carousel-background">
            <img :src="slidesRef[currentSlideIndex]" alt="background" class="background-img" />
          </div>
          <!-- 毛玻璃层 -->
          <div class="glass-overlay"></div>

          <el-carousel ref="carouselRef" :height="carouselHeight" :autoplay="true" arrow="always" :interval="3000"
            :loop="true" indicator-position="none" class="carousel" @change="onCarouselChange">
            <el-carousel-item v-for="(src, idx) in slidesRef" :key="idx">
              <img :src="src" alt="slide" class="slide-img" />
              <div class="carousel-text">
                <h1>到世界的尽头<br>与自然与人文相遇<br>TASMANIA</h1>
              </div>
            </el-carousel-item>
          </el-carousel>

          <!-- 固定搜索框 -->
          <div class="search-fixed">
            <el-card class="search-card" shadow="hover">
              <div class="search-container">
                <el-input v-model="searchText" placeholder="搜索目的地、景点、路线..." class="search-input" size="large" clearable>
                  <template #prefix>
                    <el-icon>
                      <Search />
                    </el-icon>
                  </template>
                </el-input>
                <el-button type="primary" size="large" class="search-btn" @click="isDialogVisible = true">
                  <el-icon>
                    <Search />
                  </el-icon>
                  搜索
                </el-button>
              </div>
              <div class="search-tags">
                <el-tag v-for="tag in popularTags" :key="tag" class="tag-item" @click="searchText = tag">
                  {{ tag }}
                </el-tag>
              </div>
            </el-card>
          </div>
        </div>
        <div class="content-box center">
          <div class="tourism-title">塔州旅游</div>
          <div class="coming-soon">Coming Soon...</div>
        </div>
      </el-main>

      <el-footer>
        <div class="footer-content">
          <!-- 关于我们 -->
          <div class="footer-section">
            <div class="logo-section">
              <!-- <div class="logo-circle">
                <span class="logo-text">LINGBA</span>
              </div> -->
              <div class="company-name">LINGBA TOURISM</div>
            </div>
            <div class="about-text">
              旅游是一种社会行为，古已有之。中国是世界上最早出现旅游活动的国家之一，早在春秋战国时期，就有"孔子周游列国"的记载。
            </div>
            <div class="contact-info">
              <div class="contact-item">
                <el-icon>
                  <Location />
                </el-icon>
                <span>北京市海淀区解放路01号领巴大厦</span>
              </div>
              <div class="contact-item">
                <el-icon>
                  <Phone />
                </el-icon>
                <span>010-66666666</span>
              </div>
              <div class="contact-item">
                <el-icon>
                  <Message />
                </el-icon>
                <span>lingba@Lingba.com</span>
              </div>
            </div>
          </div>

          <!-- 最新资讯 -->
          <div class="footer-section">
            <div class="section-title">
              <h3>塔州最新资讯</h3>
              <div class="title-underline"></div>
            </div>
            <div class="news-content">
              伊朗波鲁埃新建攀岩建筑项目，由"新浪潮"建筑公司承建，位于伊朗最高峰前，项目总投资约500万美元，预计明年完工。
            </div>
            <div class="news-date">2023-12-20</div>
          </div>

          <!-- 快速导航 -->
          <div class="footer-section">
            <div class="section-title">
              <h3>快速导航入口</h3>
              <div class="title-underline"></div>
            </div>
            <div class="nav-links">
              <div class="nav-item">网站首页 <span>Home</span></div>
              <div class="nav-item">精品路线 <span>Tourist route</span></div>
              <div class="nav-item">行业新闻 <span>News center</span></div>
              <div class="nav-item">八大服务 <span>Service</span></div>
              <div class="nav-item">关于我们 <span>About us</span></div>
              <div class="nav-item">联系我们 <span>Contact us</span></div>
            </div>
          </div>

          <!-- 精品路线 -->
          <div class="footer-section">
            <div class="section-title">
              <h3>精品度假路线</h3>
              <div class="title-underline"></div>
            </div>
            <div class="route-grid">
              <div class="route-item" v-for="(src, idx) in footerSlides" :key="idx">
                <img :src="src" alt="route" class="route-img" />
              </div>
            </div>
          </div>
          <div class="web-msg">
            <div class="important-msg">
              <ul>
                <li>条款与条件</li>
                <li>隐私政策</li>
              </ul>
            </div>
            <div class="declaration center">TasmaniaTrips.Online由TASMANIA TRIPS PTY LTD（塔斯马尼亚旅行有限公司）运营</div>
            <div class="copyright center">© 2025 TasmaniaTrips.Online 保留所有权利。</div>
          </div>
        </div>
      </el-footer>
    </el-container>

    <!-- 电梯导航 -->
    <div class="elevator-nav" :class="{ show: showElevator }">
      <div class="elevator-btn" :class="{ show: showElevator }" @click="scrollToTop">
        <el-icon>
          <ArrowUp />
        </el-icon>
      </div>
      <div class="elevator-btn" :class="{ show: showElevator && !isAtBottom }" @click="scrollToBottom">
        <el-icon>
          <ArrowDown />
        </el-icon>
      </div>
    </div>

    <!-- 敬请期待对话框 -->
    <el-dialog v-model="isDialogVisible" append-to-body align-center width="420px">
      <div style="text-align: center; font-size: 18px; padding: 8px 0;">敬请期待</div>
      <template #footer>
        <el-button type="primary" @click="isDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.clicked {
  color: #0052cc;

  border: {
    bottom: 1px #0052CC solid
  }
}

.el-container {
  min-height: 100vh;

  .el-header {
    position: sticky;
    top: 0;
    height: 70px;
    line-height: 70px;
    // background-color: #39c5bb;
    color: #333;
    z-index: 888;

    .logo,
    .btns {
      text-align: center;
    }

    .logo {
      font-size: 24px;
    }

    .btns {
      position: absolute;
      right: 40px;
      color: #A0A0A0;

      .ul-css {
        display: inline-block;
        float: none;

        li {
          width: 70px;
          height: 55px;
          margin-left: 20px;
        }

      }

      i {
        display: inline-block;
        height: 40px;
        line-height: 70px;
        margin-left: 20px;
        font-size: 14px;
      }
    }

  }

  .el-main {
    // background-color: pink;
    color: #333;
    padding: 0;
    // height: auto;

    .carousel-container {
      position: relative;
      width: 100%;
      overflow: hidden;
    }

    .carousel-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      overflow: hidden;

      .background-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(8px);
        transform: scale(1.1);
      }
    }

    .glass-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 2;
      pointer-events: none;
    }

    .carousel {
      position: relative;
      z-index: 3;

      .slide-img {
        display: block;
        width: 100%;
        height: 800px;
        //object-fit: cover;
        object-fit: contain;
        z-index: 100;
      }

      :deep(.el-carousel__item) {
        position: absolute;
        inset: 0;
        height: 100%;
        width: 100%;
      }

      :deep(.el-carousel__arrow--left) {
        left: 0
      }

      :deep(.el-carousel__arrow--right) {
        right: 0
      }

      .carousel-text {
        position: absolute;
        inset: 0;
        z-index: 200;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        color: #FFF;
        pointer-events: none;

        h1 {
          font-size: 48px;
          font-weight: 600;
          line-height: 1.35;
          margin: 0;
          color: #FFFEF2;
          text-align: center;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
          padding: 16px 32px;
          border-radius: 8px;
          letter-spacing: 18px;
        }
      }

      :deep(.el-carousel__arrow) {
        color: #fff;
        width: 120px;
        // height: 56px;
        height: 100%;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
      }

      :deep(.el-carousel__arrow i),
      :deep(.el-carousel__arrow .el-icon),
      :deep(.el-carousel__arrow svg) {
        width: 40px;
        height: 40px;
        // font-size:28px;
        font-size: 40px;
        font-weight: 900;
      }

    }

    .search-fixed {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      width: 100%;
      padding: 0 20px;
      position: relative;
      z-index: 4;

      .search-card {
        max-width: 800px;
        margin: 0 auto;
        border-radius: 12px;
        border: none;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

        .search-container {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;

          .search-input {
            flex: 1;

            :deep(.el-input__wrapper) {
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
          }

          .search-btn {
            border-radius: 8px;
            padding: 0 24px;
            font-weight: 500;
          }
        }

        .search-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;

          .tag-item {
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.3s ease;
            flex: 1 1 auto;
            min-width: fit-content;
            text-align: center;
            white-space: normal;
            padding: 8px 12px;
            line-height: 1.4;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          }
        }
      }
    }

    .content-box {
      height: 300px;
      color: #101010;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      letter-spacing: 15px;

      .tourism-title {
        font-size: 48px;
        font-weight: 700;
        font-style: italic;
      }

      .coming-soon {
        font-size: 36px;
        font-weight: 700;
        font-style: italic;
      }
    }
  }

  .el-footer {
    height: 620px;
    background-color: #f8f9fa;
    color: #333;
    /* Added background color for footer */
    padding: 24px 0 0;
    position: relative;

    .footer-content {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 2fr;
      gap: 30px;
      max-width: 1600px;
      margin: 0 auto;
      padding: 0 20px;
      height: 100%;
      align-items: center;
      color: #333;

      .footer-section {
        // background-color: rgba(255, 255, 255, 0.95);
        border-radius: 10px;
        padding: 25px 0;
        text-align: left;
        height: 400px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;

        // 第一个方块 - 关于我们
        &:first-child {
          .logo-section {
            margin-bottom: 20px;
          }

          .about-text {
            flex: 1;
            margin-bottom: 20px;
            padding-top: 20px;
          }

          .contact-info {
            margin-top: auto;
          }
        }

        // 第二个方块 - 最新资讯
        &:nth-child(2) {
          .section-title {
            margin-bottom: 20px;
          }

          .news-content {
            flex: 1;
            margin-bottom: 10px;
            padding-top: 20px;
          }

          .news-date {
            margin-top: auto;
            text-align: left;
          }
        }

        // 第四个方块 - 精品路线
        &:nth-child(4) {
          .section-title {
            margin-bottom: 20px;
          }

          .route-grid {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            align-content: flex-start;
            padding-top: 20px;
          }
        }

        .logo-section {
          display: flex;
          align-items: center;
          margin-bottom: 15px;

          // .logo-circle {
          //   width: 60px;
          //   height: 60px;
          //   background-color: #007bff;
          //   border-radius: 50%;
          //   display: flex;
          //   align-items: center;
          //   justify-content: center;
          //   margin-right: 15px;

          //   .logo-text {
          //     color: #fff;
          //     font-size: 24px;
          //     font-weight: bold;
          //   }
          // }

          .company-name {
            font-size: 25px;
            font-weight: bold;
            font-style: italic;
          }
        }

        .about-text {
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 20px;
        }

        .contact-info {
          .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;

            .el-icon {
              margin-right: 8px;
              font-size: 18px;
              color: #609AB1;
            }
          }
        }

        .section-title {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 20px;

          h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: bold;
          }

          .title-underline {
            width: 36px;
            height: 2px;
            background-color: #609AB1;
          }
        }

        .news-content {
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 10px;
        }

        .news-date {
          font-size: 12px;
          text-align: right;
          color: #609AB1;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          height: 100%;

          .nav-item {
            font-size: 14px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: color 0.3s ease;

            &:hover {
              color: #007bff;
            }

            // 英文部分使用指定颜色
            span {
              color: #609AB1;
              margin-left: 8px;
            }
          }
        }

        .route-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;

          .route-item {
            display: flex;
            justify-content: center;
            align-items: center;

            .route-img {
              width: 88px;
              height: 88px;
              object-fit: cover;
              border-radius: 8px;
              cursor: pointer;
              transition: transform 0.3s ease;

              &:hover {
                transform: scale(1.05);
              }
            }
          }
        }
      }

      .web-msg {
        grid-column: 1 / -1;
        width: 100%;
        max-width: 1200px;
        margin: 10px auto 0;
        padding-top: 14px;
        border-top: 1px solid #e6e6e6;
        color: #6b7280;
        font-size: 12px;
        line-height: 1.6;

        .important-msg {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;

          ul {
            display: flex;
            gap: 20px;
            list-style: none;
            padding: 0;
            margin: 0;
          }

          li {
            cursor: pointer;
            color: #6b7280;
            transition: color 0.2s ease;

            &:hover {
              color: #111827;
            }
          }
        }

        .declaration,
        .copyright {
          text-align: center;
          color: #6b7280;
        }
      }
    }
  }
}

// 电梯导航样式 - 全局作用域
.elevator-nav {
  position: fixed !important;
  right: 30px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 9999 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 10px !important;
  opacity: 0 !important;
  visibility: hidden !important;
  transition: opacity 0.3s ease, visibility 0.3s ease !important;

  &.show {
    opacity: 1 !important;
    visibility: visible !important;
  }

  .elevator-btn {
    width: 50px !important;
    height: 50px !important;
    background-color: #fff !important;
    border-radius: 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.3s ease !important;
    border: 1px solid #e0e0e0 !important;
    opacity: 0 !important;
    transition: opacity 0.3s ease, transform 0.3s ease !important;

    &.show {
      opacity: 1 !important;
    }

    &:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15) !important;
    }

    .el-icon {
      font-size: 20px !important;
      color: #609AB1 !important;
    }
  }
}

/* 响应式适配：平板（768px-1024px） */
@media (min-width: 769px) and (max-width: 1024px) {
  .el-container {
    .el-header {
      height: 64px;
      line-height: 64px;

      .logo {
        font-size: 20px;
      }

      .btns {
        right: 16px;

        .ul-css {
          li {
            width: auto;
            margin-left: 12px;
            height: 48px;
          }
        }
      }
    }

    .el-main {
      .carousel {
        .slide-img {
          height: 600px;
        }

        :deep(.el-carousel__arrow) {
          display: flex !important;
          width: 56px;
          //height: 56px;
          height: 100%;
          top: 50%;
          transform: translateY(-50%);
          // background: rgba(0, 0, 0, 0.25);
          background: transparent;
          // border-radius: 50%;
          z-index: 210;
        }

        .carousel-text {
          padding: 0 20px;

          h1 {
            font-size: 36px;
            line-height: 1.3;
            letter-spacing: 12px;
          }
        }
      }

      .search-fixed {
        bottom: 16px;

        .search-card {
          max-width: 720px;
        }
      }

      .content-box {
        height: 240px;

        .tourism-title {
          font-size: 36px;
        }

        .coming-soon {
          font-size: 28px;
        }
      }
    }

    .el-footer {
      height: auto;
      min-height: 620px;

      .footer-content {
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        padding: 0 16px;
        height: auto;
      }

      .footer-section {
        height: auto;
        padding: 12px 0;
      }

      .route-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .web-msg {
        max-width: 90%;
        font-size: 12px;
      }
    }
  }
}

/* 响应式适配：手机（<=768px） */
@media (max-width: 768px) {
  .el-container {
    .el-header {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      height: auto;
      line-height: 1.4;
      padding: 8px 12px;

      .logo {
        font-size: 18px;
        text-align: left;
      }

      .btns {
        position: static !important;
        right: auto;
        width: 100%;
        margin-top: 6px;

        .ul-css {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px;
          overflow: visible;
          white-space: normal;

          li {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: auto;
            height: 40px;
            margin-left: 0;
            padding: 0 6px;
          }
        }

        i {
          display: none;
        }
      }
    }

    .el-main {
      .carousel {
        .slide-img {
          height: 420px;
        }

        :deep(.el-carousel__arrow) {
          display: flex !important;
          width: 60px;
          height: 100%;
          top: 50%;
          transform: translateY(-50%);
          // background: rgba(0, 0, 0, 0.25);
          background: transparent;
          // border-radius: 50%;
          z-index: 210;
        }

        .carousel-text {
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;

          h1 {
            font-size: 26px;
            line-height: 1.3;
            letter-spacing: 6px;
            text-align: center;
          }
        }
      }

      .search-fixed {
        position: static;
        transform: none;
        z-index: auto;
        width: 100%;
        padding: 8px 12px 0;

        .search-card {
          max-width: 95vw;
          margin-top: 8px;
        }

        .search-container {
          flex-direction: column;
          gap: 8px;
        }

        .search-btn {
          width: 100%;
        }

        .search-tags {
          gap: 6px;
        }

        .tag-item {
          padding: 6px 10px;
          line-height: 1.3;
          font-size: 12px;
        }
      }

      .content-box {
        height: 200px;

        .tourism-title {
          font-size: 28px;
        }

        .coming-soon {
          font-size: 22px;
        }
      }
    }

    .el-footer {
      height: auto !important;
      min-height: 680px;
      padding: 16px 0 16px;

      .footer-content {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 0 12px;
        height: auto;
      }

      .footer-section {
        height: auto;
        padding: 8px 0;
      }

      .route-grid {
        grid-template-columns: repeat(3, 1fr);

        .route-img {
          width: 72px;
          height: 72px;
        }
      }

      .web-msg {
        max-width: 92%;
        margin-top: 12px;
        font-size: 11px;

        .important-msg ul {
          gap: 14px;
        }
      }
    }
  }

  /* 移动端隐藏电梯导航，避免遮挡 */
  .elevator-nav {
    display: none !important;
  }
}
</style>
