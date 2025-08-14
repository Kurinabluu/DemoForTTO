<script setup>
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

// 自动收集 `src/assets/img` 目录下所有 jpg 图片作为轮播图来源
const modules = import.meta.glob('@/assets/img/*.jpg', { eager: true });
const slides = Object.values(modules).map((mod) => (typeof mod === 'string' ? mod : mod.default));

// 搜索相关数据
import { ref, onMounted, onUnmounted } from 'vue'
import { Search, Location, Phone, Message, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const searchText = ref('')
const popularTags = ref(['塔斯马尼亚', '霍巴特', '摇篮山', '酒杯湾', '亚瑟港', '布鲁尼岛'])
const isDialogVisible = ref(false)

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
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
            <li class="pointer" @click="onNavClick">服务优势</li>
            <li class="pointer" @click="onNavClick">联系我们</li>
          </ul>
          <i class="flri pointer" @click="onNavClick">Operating By WorldTrips.Online</i>
        </span>
      </el-header>

      <el-main>
        <!-- 轮播图 -->
        <el-carousel height="800px" autoplay arrow="always" interval="3000" indicator-position="none" class="carousel">
          <el-carousel-item v-for="(src, idx) in slides" :key="idx">
            <img :src="src" alt="slide" class="slide-img" />
          </el-carousel-item>
        </el-carousel>
        <!-- 搜索 -->
        <div class="img-mask">
          <div class="search">
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
          Coming Soon...
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
              <h3>领巴最新资讯</h3>
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
              <div class="nav-item">服务优势 <span>Advantage</span></div>
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
              <div class="route-item" v-for="(src, idx) in slides" :key="idx">
                <img :src="src" alt="route" class="route-img" />
              </div>
            </div>
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
    height: 100px;
    line-height: 100px;
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
          height: 70px;
          margin-left: 20px;
        }

      }

      i {
        display: inline-block;
        height: 70px;
        line-height: 100px;
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

    .carousel {
      position: relative;

      .slide-img {
        display: block;
        width: 100%;
        height: 800px;
        object-fit: cover;
        z-index: 100;
      }

      :deep(.el-carousel__arrow) {
        color: #fff;
        width: 50px;
        height: 80px;
        background: transparent;
        border: none;
      }

      :deep(.el-carousel__arrow i),
      :deep(.el-carousel__arrow .el-icon),
      :deep(.el-carousel__arrow svg) {
        width: 40px;
        height: 40px;
        font-size: 40px;
        font-weight: 900;
      }

    }

    .img-mask {
      position: relative;
      height: 120px;
      background-color: rgba(255, 255, 255, 1);
      box-shadow: 0 -30px 85px 110px rgba(255, 255, 255, 1);
      z-index: 888;

      .search {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        width: 100%;
        padding: 0 20px;

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

            .tag-item {
              cursor: pointer;
              border-radius: 6px;
              transition: all 0.3s ease;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              }
            }
          }
        }
      }
    }

    .content-box {
      height: 800px;
      color: #101010;
      font-size: 100px;
      font-weight: 700;
      line-height: 800px;
      font-style: italic;
    }
  }

  .el-footer {
    height: 500px;
    // background-color: skyblue;
    color: #333;
    /* Added background color for footer */
    padding: 40px 0;
    background-image: url('@/assets/img/footerbg1.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      z-index: 1;
    }

    .footer-content {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 2fr;
      gap: 30px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      height: 100%;
      align-items: center;
      color: #D9D9D9;

      .footer-section {
        // background-color: rgba(255, 255, 255, 0.95);
        border-radius: 10px;
        padding: 25px 0;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
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
</style>
