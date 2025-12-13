<script setup>
import { computed } from 'vue'
import dataJson from '@/data/data.json'
import { onMounted } from 'vue'

const props = defineProps({
    activeTag: { type: String, required: true },
    subTab: { type: String, default: '景点' },
    keyword: { type: String, default: '' },
    dayTripTab: { type: String, default: '景点一日游' },
})

const emit = defineEmits(['openTourDialog', 'openPlaceList'])

// 从data.json获取数据
const getDayTripData = () => {
    try {
        if (!dataJson) return []
        const dayTripSection = dataJson.find(item => item.tagName === '一日游（固定行程）')
        return dayTripSection?.subNav || []
    } catch (error) {
        return []
    }
}

const getMultiDayTripData = () => {
    try {
        if (!dataJson) return []
        const multiDaySection = dataJson.find(item => item.tagName === '多日游（固定行程）')
        return multiDaySection?.tripConfig || []
    } catch (error) {
        return []
    }
}

const dayTripNavs = getDayTripData()
const multiDayTrips = getMultiDayTripData()

const datas = dataJson.find(data => data.tagName == "自助游/自驾游免费信息")
const places = datas.subNav.find(subItem => subItem.subNavName == "景点")
const restaurants = datas.subNav.find(subItem => subItem.subNavName == "餐厅")

const hotels = datas.subNav.find(subItem => subItem.subNavName == "住宿")

const activityItems = datas.subNav.find(subItem => subItem.subNavName == "特别活动")

function getActivityImage(index) {
    const images = [
        new URL('@/assets/img/footer1.jpg', import.meta.url).href,
        new URL('@/assets/img/footer2.jpg', import.meta.url).href,
        new URL('@/assets/img/footer3.jpg', import.meta.url).href,
        new URL('@/assets/img/footer4.jpg', import.meta.url).href
    ]
    return images[index] || images[0]
}

// 免费信息：当前子项（如 特别活动/徒步/当地天气/医疗）数据
const currentFreeInfoSection = computed(() => {
    try {
        if (!datas?.subNav || !props.subTab) return null
        return datas.subNav.find(subItem => subItem.subNavName === props.subTab) || null
    } catch (e) {
        return null
    }
})

// 是否为免费信息下的“内容块模式”（isGrid=false）
const isSpecialSection = computed(() => {
    return props.activeTag === '自助游/自驾游免费信息' && currentFreeInfoSection?.value?.isGrid === false
})

// 当前展示用的“特别内容”列表与标题
const currentSpecialItems = computed(() => currentFreeInfoSection?.value?.items || [])
const currentSpecialTitle = computed(() => currentFreeInfoSection?.value?.activitiesTitle || '塔斯马尼亚特别内容')
const currentSpecialSubtitle = computed(() => currentFreeInfoSection?.value?.activitiesSubtitle || '')

// 派生数据 - 从data.json获取适合当前标签的数据
const gridItems = computed(() => {
    try {
        if (!props.activeTag) return []

        if (props.activeTag === '一日游（固定行程）') {
            return getDayTripItems(props.dayTripTab)
        } else if (props.activeTag === '多日游（固定行程）') {
            return multiDayTrips
        } else {
            // 对于其他标签，保持原有的生成逻辑
            const scenicPlaces = [
                '菲欣拿国家公园', '摇篮山', '火焰湾', '酒杯湾', '玛丽亚岛', '塔斯曼半岛', '布鲁尼岛', '霍巴特海滨',
                '朗塞斯顿峡谷', '圣海伦斯', '比切诺', '斯坦利小镇', '里士满古桥', '亚瑟港', '德文波特', '塔拉娜自然保护区'
            ]

            function seededRandom(seed) {
                let x = Math.sin(seed) * 10000
                return x - Math.floor(x)
            }

            const items = []
            for (let i = 0; i < 32; i++) {
                const r = seededRandom(i + (props.activeTag?.length || 0))
                const idx = Math.floor(r * scenicPlaces.length) % scenicPlaces.length
                const place = scenicPlaces[idx]

                const driveThemes = ['自驾环线', '观景台', '徒步步道', '日落观景点', '海岸公路', '森林小径', '瀑布探秘', '轻装徒步']
                const themeIdx = Math.floor(seededRandom(idx + i) * driveThemes.length) % driveThemes.length
                const subTitle = driveThemes[themeIdx]

                items.push({ title: `${place}`, sub: subTitle })
            }
            return items
        }
    } catch (error) {
        return []
    }
})

const scenicFiltered = computed(() => {
    const kw = (props.keyword || '').trim().toLowerCase()
    if (!kw) return places?.items || []
    return (places?.items || []).filter(item => item.title.toLowerCase().includes(kw))
})

const restaurantFiltered = computed(() => {
    const kw = (props.keyword || '').trim().toLowerCase()
    if (!kw) return restaurants?.items || []
    return (restaurants?.items || []).filter(item =>
        item.place.toLowerCase().includes(kw) ||
        item.enPlace.toLowerCase().includes(kw)
    )
})

const hotelFiltered = computed(() => {
    const kw = (props.keyword || '').trim().toLowerCase()
    if (!kw) return hotels?.items || []
    return (hotels?.items || []).filter(item =>
        item.place.toLowerCase().includes(kw) ||
        item.enPlace.toLowerCase().includes(kw)
    )
})

const activityFiltered = computed(() => {
    const kw = (props.keyword || '').trim().toLowerCase()
    const base = currentSpecialItems.value || []
    if (!kw) return base
    return base.filter(item =>
        item.title.toLowerCase().includes(kw) ||
        (item.location && item.location.toLowerCase().includes(kw)) ||
        (Array.isArray(item.tags) && item.tags.some(tag => (tag || '').toLowerCase().includes(kw))) ||
        (Array.isArray(item.tagItems) && item.tagItems.some(t => (t?.text || '').toLowerCase().includes(kw)))
    )
})

// 对外事件
function onOpenTour(item) {
    // 声明变量存储处理后的数据
    let tripData = item.tripData;
    let bannerImage = item.img;
    let tripType = '一日游';

    // 根据不同的activeTag确定tripType
    if (props.activeTag === '多日游（固定行程）') {
        tripType = '多日游';
    } else if (props.activeTag === '自助游/自驾游免费信息' && props.subTab === '景点') {
        tripType = '景点信息';
    }

    // 如果是景点数据，从places中查找完整信息
    if (props.activeTag === '自助游/自驾游免费信息' && props.subTab === '景点' && places && places.items) {
        const placeItem = places.items.find(place => place.title === item.title);
        if (placeItem) {
            tripData = placeItem.tripData;
            bannerImage = placeItem.img;
        }
    }

    // 如果是一日游或多日游，item本身应该已经包含tripData
    if (props.activeTag === '一日游（固定行程）' || props.activeTag === '多日游（固定行程）') {
        tripData = item.tripData;
        bannerImage = item.img || bannerImage;
    }

    // 如果没有找到tripData，使用默认数据
    if (!tripData) {
        tripData = {
            route: `${item.title || '未知行程'}探索之旅`,
            desc: `深度探索目的地的自然美景和文化内涵，体验塔斯马尼亚独特的魅力。`,
            features: [
                { icon: '#22c55e', title: '自然探索', desc: '深入了解当地的自然环境和生态系统' },
                { icon: '#3b82f6', title: '文化体验', desc: '感受塔斯马尼亚的历史文化' },
                { icon: '#f59e0b', title: '摄影记录', desc: '记录美好的旅行时光' }
            ],
            tags: ['全程约6小时', '含专业导游', '灵活出发', '中英文服务']
        };
    }

    emit('openTourDialog', {
        ...item,
        title: item.title,
        enTitle: item.enTitle,
        banner: bannerImage,
        tripType: tripType,
        tripData: tripData
    })
}
function onOpenPlace(groupName, itemType) {
    emit('openPlaceList', { placeName: groupName, itemType })
}

// 当前是否显示多日游网格（保持与原逻辑一致）
const showMultiDay = computed(() => props.activeTag === '多日游（固定行程）')

// 从data.json获取一日游数据
const getDayTripItems = (tabName) => {
    const navItem = dayTripNavs.find(nav => nav.subNavName === tabName)
    return navItem?.items || []
}

const currentDayTripItems = computed(() => {
    if (props.activeTag !== '一日游（固定行程）') return []
    return getDayTripItems(props.dayTripTab)
})

const showDayTrip = computed(() => props.activeTag === '一日游（固定行程）')

</script>

<template>
    <!-- <div> -->
    <!-- 一日游：根据传入的 dayTripTab 渲染对应数据（忽略 keyword） -->
    <template v-if="showDayTrip">
        <div class="coming-grid">
            <div v-for="(item, i) in currentDayTripItems" :key="`day-trip-${dayTripTab}-${i}`" class="coming-card"
                @click="onOpenTour(item)" :data-tour-title="item.title">
                <!-- <img src="@/assets/img/default.png" alt="" class="w100"> -->
                <img src="@/assets/img/default.png" alt="" class="w100">
                <div class="card-title" :title="item.title">{{ item.title }}</div>
                <div class="card-sub" :title="item.sub">{{ item.sub }}</div>
            </div>
        </div>
    </template>

    <!-- 搜索结果区：景点 -->
    <template v-if="(keyword?.trim()) && subTab === '景点'">
        <template v-if="scenicFiltered.length">
            <div class="coming-grid">
                <div v-for="(item, i) in scenicFiltered" :key="'sc2-' + i" class="coming-card" @click="onOpenTour(item)"
                    :data-tour-title="item.title">
                    <!-- <img src="@/assets/img/default.png" alt="" class="w100"> -->
                    <img src="@/assets/img/default.png" alt="" class="w100">
                    <div class="card-title" :title="item.title">{{ item.title }}</div>
                    <div class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
                </div>
            </div>
        </template>
        <div v-else class="empty-tip">没有搜索结果</div>
    </template>

    <!-- 搜索结果区：餐厅 -->
    <template v-else-if="(keyword?.trim()) && subTab === '餐厅'">
        <template v-if="restaurantFiltered.length">
            <div class="coming-grid">
                <div v-for="(item, i) in restaurantFiltered" :key="'rt-search-' + i" class="coming-card"
                    @click="onOpenPlace(item.place, '餐厅')">
                    <!-- <img src="@/assets/img/default.png" alt="" class="w100"> -->
                    <img src="@/assets/img/default.png" alt="" class="w100">
                    <div class="card-title">{{ item.place }} 周边餐厅</div>
                    <div class="card-sub">Restaurant {{ item.enPlace }} surrounding</div>
                </div>
            </div>
        </template>
        <div v-else class="empty-tip">没有搜索结果</div>
    </template>

    <!-- 搜索结果区：住宿 -->
    <template v-else-if="(keyword?.trim()) && subTab === '住宿'">
        <template v-if="hotelFiltered.length">
            <div class="coming-grid">
                <div v-for="(item, i) in hotelFiltered" :key="'ht-search-' + i" class="coming-card"
                    @click="onOpenPlace(item.place, '住宿')">
                    <!-- <img src="@/assets/img/default.png" alt="" class="w100"> -->
                    <img src="@/assets/img/default.png" alt="" class="w100">
                    <div class="card-title">{{ item.place }} 住宿</div>
                    <div class="card-sub">Hotel {{ item.enPlace }}</div>
                </div>
            </div>
        </template>
        <div v-else class="empty-tip">没有搜索结果</div>
    </template>

    <!-- 免费信息（isGrid=false）：关键词搜索结果（适配 特别活动/徒步/当地天气/医疗 等） -->
    <div class="special-activities-section" v-else-if="(keyword?.trim()) && isSpecialSection">
        <template v-if="activityFiltered.length">
            <div class="activities-header">
                <h2 class="activities-title">{{ currentSpecialTitle }}</h2>
                <p class="activities-subtitle">{{ currentSpecialSubtitle }}</p>
            </div>

            <div class="activities-grid">
                <div v-for="(item, i) in activityFiltered" :key="'ac-filtered-' + i"
                    :class="['activity-card', item.cardClass]">
                    <div class="activity-image">
                        <img :src="getActivityImage(i)" alt="特别活动" class="activity-img">
                        <div :class="['activity-badge', item.badgeClass]">{{ item.badge }}</div>
                    </div>
                    <div class="activity-content">
                        <h3 class="activity-title">{{ item.title }}</h3>
                        <div class="activity-info">
                            <div v-for="(infoItem, infoIndex) in item.info" :key="infoIndex" class="info-item">
                                <span class="info-label">{{ infoItem.label }}：</span>
                                <span :class="['info-value', infoItem.valueClass]">{{ infoItem.value }}</span>
                            </div>
                        </div>
                        <div class="tags">
                            <div v-for="(tagItem, tagIndex) in item.tagItems" :key="tagIndex"
                                :class="tagItem.icon ? 'weather-note' : 'activity-description'">
                                <i v-if="tagItem.icon" class="weather-icon">{{ tagItem.icon }}</i>
                                <span>{{ tagItem.text }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <div v-else class="empty-tip">没有搜索结果</div>
        <div class="activities-footer">
            <div class="update-info"><i class="update-icon">🔄</i><span>信息每2小时更新一次</span></div>
            <div class="contact-info"><span>获取最新活动信息，请联系我们的专业顾问</span></div>
        </div>
    </div>

    <!-- 底部网格：景点（无关键词） -->
    <div v-if="subTab === '景点' && !(keyword?.trim()) && !showDayTrip && !showMultiDay" class="coming-grid">
        <div v-for="(item, i) in places.items" :key="'rt-bottom-' + i" class="coming-card" @click="onOpenTour(item)"
            :data-tour-title="item.title">
            <!-- <img src="@/assets/img/default.png" alt="" class="w100"> -->
            <img src="@/assets/img/default.png" alt="" class="w100">
            <div class="card-title" :title="item.title">{{ item.title }}</div>
            <div class="card-sub" :title="item.enTitle">{{ item.enTitle }}</div>
        </div>
    </div>

    <!-- 底部网格：餐厅（无关键词） -->
    <div v-if="subTab === '餐厅' && !(keyword?.trim()) && !showDayTrip && !showMultiDay" class="coming-grid">
        <div v-for="item in restaurants.items" :key="item" class="coming-card" @click="onOpenPlace(item.place, '餐厅')">
            <img src="@/assets/img/default.png" alt="" class="w100">
            <div class="card-title">{{ item.place }} 周边餐厅</div>
            <div class="card-sub">Restaurant {{ item.enPlace }} surrounding</div>
        </div>
    </div>

    <!-- 底部网格：住宿（无关键词） -->
    <div v-if="subTab === '住宿' && !(keyword?.trim()) && !showDayTrip && !showMultiDay" class="coming-grid">
        <div v-for="item in hotels.items" :key="item" class="coming-card" @click="onOpenPlace(item.place, '住宿')">
            <img src="@/assets/img/default.png" alt="" class="w100">
            <div class="card-title">{{ item.place }} 住宿</div>
            <div class="card-sub">Hotel {{ item.enPlace }}</div>
        </div>
    </div>

    <!-- 免费信息（isGrid=false）：信息展示区域（无关键词，适配 特别活动/徒步/当地天气/医疗 等） -->
    <div v-if="isSpecialSection && !(keyword?.trim())" class="special-activities-section">
        <div class="activities-header">
            <h2 class="activities-title">{{ currentSpecialTitle }}</h2>
            <p class="activities-subtitle">{{ currentSpecialSubtitle }}</p>
        </div>
        <div class="activities-grid">
            <div v-for="(activity, index) in currentSpecialItems" :key="'activity-' + index"
                :class="['activity-card', activity.cardClass]">
                <div class="activity-image">
                    <img :src="getActivityImage(index)" alt="特别活动" class="activity-img">
                    <div :class="['activity-badge', activity.badgeClass]">{{ activity.badge }}</div>
                </div>
                <div class="activity-content">
                    <h3 class="activity-title">{{ activity.title }}</h3>
                    <div class="activity-info">
                        <div v-for="(infoItem, infoIndex) in activity.info" :key="infoIndex" class="info-item">
                            <span class="info-label">{{ infoItem.label }}：</span>
                            <span :class="['info-value', infoItem.valueClass]">{{ infoItem.value }}</span>
                        </div>
                    </div>
                    <div class="tags">
                        <div v-for="(tagItem, tagIndex) in activity.tagItems" :key="tagIndex"
                            :class="tagItem.icon ? 'weather-note' : 'activity-description'">
                            <i v-if="tagItem.icon" class="weather-icon">{{ tagItem.icon }}</i>
                            <span>{{ tagItem.text }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="activities-footer">
            <div class="update-info"><i class="update-icon">🔄</i><span>信息每2小时更新一次</span></div>
            <div class="contact-info"><span>获取最新活动信息，请联系我们的专业顾问</span></div>
        </div>
    </div>

    <!-- 多日游（单独显示网格） -->
    <template v-if="showMultiDay">
        <div class="coming-grid">
            <div v-for="(item, i) in gridItems" :key="'multi-day-trip-' + i" class="coming-card"
                @click="onOpenTour(item)" :data-tour-title="item.title">
                <img src="@/assets/img/default.png" alt="" class="w100">
                <div class="card-title" :title="item.title">{{ item.title }}</div>
                <div class="card-sub" :title="item.sub">{{ item.sub }}</div>
            </div>
        </div>
    </template>
    <!-- </div> -->
</template>

<style lang="scss" scoped>
.coming-grid {
    width: 90%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 8px 0 40px;

    img {
        height: 240px;
    }
}

.coming-card {
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    // padding: 12px;
    cursor: pointer;
    gap: 5px;
    border: 2px solid transparent;

    img {
        object-fit: cover;
    }
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    color: #1f2937;
    // margin-bottom: 6px;
    -webkit-line-clamp: 1;
}

.card-sub {
    font-size: 12px;
    color: #6b7280;
    letter-spacing: 2px;
    -webkit-line-clamp: 2;
    line-height: 1.5;
    min-height: calc(1.5em * 2);
}

.card-title,
.card-sub {
    display: -webkit-box;
    /* 将元素设置为弹性盒子 */
    -webkit-box-orient: vertical;
    /* 设置盒子方向为垂直 */
    /* 限制显示的行数 */
    overflow: hidden;
    /* 隐藏溢出内容 */
    text-overflow: ellipsis;
    /* 显示省略号 */

}

.empty-tip {
    text-align: center;
    color: #6b7280;
    font-size: 18px;
    padding: 16px 0 8px;
}

/* 特别活动样式 */
.special-activities-section {
    width: 90%;
    padding: 20px 0;
}

.activities-header {
    text-align: center;
    margin-bottom: 30px;
}

.activities-title {
    font-size: 32px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
    letter-spacing: 2px;
}

.activities-subtitle {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
}

.activities-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 30px;
}

.activity-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.activity-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.activity-image {
    position: relative;
    height: 300px;
    overflow: hidden;
}

.activity-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.activity-card:hover .activity-img {
    transform: scale(1.05);
}

.activity-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.aurora-badge {
    background: linear-gradient(135deg, #3dc7be 0%, #2da099 100%);
}

.event-badge {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.season-badge {
    background: linear-gradient(135deg, #3dc7be 0%, #2da099 100%);
}

.night-badge {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.activity-content {
    padding: 20px;

    .tags {
        display: flex;
        column-gap: 10px;

        .tags>div {
            width: 100px;
            height: 30px;
            line-height: 30px;
        }
    }
}

.activity-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 16px;
    letter-spacing: 1px;
}

.activity-info {
    margin-bottom: 16px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 4px 0;
}

.info-label {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
}

.info-value {
    font-size: 14px;
    color: #111827;
    font-weight: 600;
}

.info-value.high {
    color: #059669;
    font-weight: 700;
}

.info-value.excellent {
    color: #dc2626;
    font-weight: 700;
}

.activity-description {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.6;
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    border-left: 4px solid #3dc7be;
}

.weather-note {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #059669;
    background: #ecfdf5;
    padding: 10px 12px;
    border-radius: 8px;
    border-left: 4px solid #10b981;
}

.weather-icon {
    font-size: 16px;
}

.activities-footer {
    text-align: center;
    padding: 20px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

.update-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: #6b7280;
}

.update-icon {
    font-size: 16px;
}

.contact-info {
    font-size: 14px;
    color: #4b5563;
}

/* 平板适配 */
@media (min-width: 769px) and (max-width: 1024px) {
    .coming-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .special-activities-section {
        width: 95%;
        padding: 15px 0;
    }

    .activities-title {
        font-size: 28px;
    }

    .activities-subtitle {
        font-size: 15px;
    }

    .activities-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .activity-image {
        height: 180px;
    }

    .activity-content {
        padding: 16px;
    }

    .activity-title {
        font-size: 16px;
    }

    .info-label,
    .info-value {
        font-size: 13px;
    }

    .activity-description {
        font-size: 13px;
    }

    .weather-note {
        font-size: 12px;
    }
}

/* 移动端适配 */
@media (max-width: 768px) {
    .coming-grid {
        grid-template-columns: repeat(1, 1fr);
        gap: 20px;

        .coming-card {
            gap: 10px;
        }
    }

    .special-activities-section {
        width: 95%;
        padding: 10px 0;
    }

    .activities-header {
        margin-bottom: 20px;
    }

    .activities-title {
        font-size: 24px;
        letter-spacing: 1px;
    }

    .activities-subtitle {
        font-size: 14px;
    }

    .activities-grid {
        grid-template-columns: 1fr;
        gap: 16px;
        margin-bottom: 20px;
    }

    .activity-image {
        height: 160px;
    }

    .activity-badge {
        top: 8px;
        right: 8px;
        padding: 4px 8px;
        font-size: 10px;
    }

    .activity-content {
        padding: 12px;
    }

    .activity-title {
        font-size: 15px;
        margin-bottom: 12px;
    }

    .activity-info {
        margin-bottom: 12px;
    }

    .info-item {
        margin-bottom: 6px;
        padding: 2px 0;
    }

    .info-label,
    .info-value {
        font-size: 12px;
    }

    .activity-description {
        font-size: 12px;
        padding: 10px;
    }

    .weather-note {
        font-size: 11px;
        padding: 8px 10px;
    }

    .weather-icon {
        font-size: 14px;
    }

    .activities-footer {
        padding: 15px;
    }

    .update-info {
        font-size: 12px;
        margin-bottom: 8px;
    }

    .contact-info {
        font-size: 12px;
    }
}

/* 超小屏幕 */
@media (max-width: 375px) {
    .activities-title {
        font-size: 20px;
    }

    .activities-subtitle {
        font-size: 13px;
    }

    .activities-grid {
        gap: 12px;
    }

    .activity-image {
        height: 140px;
    }

    .activity-badge {
        top: 6px;
        right: 6px;
        padding: 3px 6px;
        font-size: 9px;
    }

    .activity-content {
        padding: 10px;
    }

    .activity-title {
        font-size: 14px;
        margin-bottom: 10px;
    }

    .info-item {
        margin-bottom: 4px;
    }

    .info-label,
    .info-value {
        font-size: 11px;
    }

    .activity-description {
        font-size: 11px;
        padding: 8px;
    }

    .weather-note {
        font-size: 10px;
        padding: 6px 8px;
    }

    .activities-footer {
        padding: 12px;
    }

    .update-info {
        font-size: 11px;
    }

    .contact-info {
        font-size: 11px;
    }
}
</style>