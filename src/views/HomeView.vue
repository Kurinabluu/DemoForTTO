<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Search } from '@element-plus/icons-vue'

// 轮播图切换事件处理
function onCarouselChange(index) {
    currentSlideIndex.value = index
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

// 组件挂载时初始化轮播图
onMounted(() => {
    selectSlides()
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', handleResizeForSlides)
    }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResizeForSlides)
    }
})
</script>

<template>
    <el-main>
        <!-- 轮播图 -->
        <div class="carousel-container" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove"
            @touchend="onTouchEnd">
            <!-- 背景图片层 -->
            <div class="carousel-background">
                <img :src="slidesRef[currentSlideIndex]" alt="background" class="background-img"
                    :key="currentSlideIndex" />
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
        </div>

        <!-- 固定搜索框 -->
        <div class="search-fixed">
            <el-card class="search-card" shadow="hover">
                <div class="search-container">
                    <el-input v-model="searchText" placeholder="搜索目的地、景点、路线..." class="search-input" size="large"
                        clearable>
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
        <div class="content-box center">
            <div class="tourism-title">塔州旅行在线<br>（塔旅在线）</div>
            <div class="coming-soon">COMING SOON...</div>
        </div>
    </el-main>
</template>

<style lang="scss" scoped>
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
        // position: absolute;
        position: relative;
        // bottom: 20px;
        top: 40px;
        left: 50%;
        transform: translateX(-50%);
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
        margin-top: 40px;

        .tourism-title {
            font-size: 48px;
            font-weight: 700;
            font-style: italic;
        }

        .coming-soon {
            font-size: 43px;
            font-weight: 700;
            font-style: italic;
        }
    }
}

/* 响应式适配：平板（768px-1024px） */
@media (min-width: 769px) and (max-width: 1024px) {
    .el-container {
        .el-main {

            .carousel-background {
                .background-img {
                    transition: all 0.8s ease-in-out;
                    opacity: 1;
                }
            }

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
    }
}

@media (max-width: 768px) {
    .el-container {
        .el-main {
            .carousel-container {
                height: auto;
                /* 移动端使用自适应高度 */
                overflow: visible;
                /* 允许搜索框溢出显示 */
            }

            .carousel-background {
                height: 420px;
                /* 与轮播图高度一致 */

                .background-img {
                    transition: all 0.8s ease-in-out;
                    opacity: 1;
                }
            }

            .glass-overlay {
                height: 420px;
                /* 与轮播图高度一致 */
            }

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
                top: auto;

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
                margin-top: 20px;
                /* 移动端减少间距 */

                .tourism-title {
                    font-size: 28px;
                }

                .coming-soon {
                    font-size: 22px;
                }
            }
        }
    }
}

/* 超小屏幕设备适配（iPhone 4、iPhone 5、iPhone SE等，<=375px） */
@media (max-width: 375px) {
    .el-container {
        .el-main {
            .carousel {
                .slide-img {
                    // height: 360px;
                    height: 420px;
                }

                .carousel-text {
                    h1 {
                        font-size: 22px;
                        line-height: 1.2;
                        letter-spacing: 4px;
                        padding: 12px 20px;
                    }
                }
            }

            .search-fixed {
                padding: 6px 8px 0;

                .search-card {
                    max-width: 98vw;
                }

                .tag-item {
                    padding: 4px 8px;
                    font-size: 11px;
                    line-height: 1.2;
                }
            }

            .content-box {
                height: 160px;
                margin-top: 16px;
                gap: 16px;

                .tourism-title {
                    font-size: 24px;
                    letter-spacing: 10px;
                }

                .coming-soon {
                    font-size: 18px;
                    letter-spacing: 10px;
                }
            }
        }
    }
}

/* 极超小屏幕设备适配（iPhone 4等，<=320px） */
@media (max-width: 320px) {
    .el-container {
        .el-main {
            .carousel {
                .slide-img {
                    // height: 320px;
                    height: 420px;
                }

                .carousel-text {
                    h1 {
                        font-size: 18px;
                        line-height: 1.1;
                        letter-spacing: 2px;
                        padding: 8px 12px;
                    }
                }
            }

            .search-fixed {
                padding: 4px 6px 0;

                .search-card {
                    max-width: 99vw;
                }

                .tag-item {
                    padding: 3px 6px;
                    font-size: 10px;
                    line-height: 1.1;
                }
            }

            .content-box {
                height: 140px;
                margin-top: 12px;
                gap: 12px;

                .tourism-title {
                    font-size: 20px;
                    letter-spacing: 8px;
                }

                .coming-soon {
                    font-size: 16px;
                    letter-spacing: 8px;
                }
            }
        }
    }
}
</style>