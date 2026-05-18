<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import ContactDialog from './ContactDialog.vue'
import InfoSourceDialog from './InfoSourceDialog.vue'
import freeInfoData from '@/data/split/freeinfo.json'
import { InfoFilled } from '@element-plus/icons-vue'
import { resolveDataImage } from '@/utils/dataImageResolver'
import { isFavorite as checkFavorite, toggleFavorite } from '@/utils/favoritesStore'
import { Z_INDEX } from '@/constants/zIndex'

const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    enTitle: { type: String, default: '' },
    banner: { type: String, default: '' },
    tripType: { type: String, default: '' },
    tripData: { type: Object, default: () => ({}) },
    itemId: { type: [Number, String], default: null },
    itemType: { type: String, default: 'scenic' }
})

const emit = defineEmits(['update:visible', 'favorite-change'])

// 收藏相关
const isFavorite = computed(() => {
    return checkFavorite(props.itemId, props.itemType, props.title)
})

const handleToggleFavorite = () => {
    const item = {
        id: props.itemId,
        type: props.itemType,
        title: props.title,
        enTitle: props.enTitle,
        // 收藏存原始路径，列表页再统一走 resolveDataImage 的 thumb 优化链路
        image: props.banner,
        banner: props.banner,
        region: props.tripData?.region || '',
        town: props.tripData?.town || '',
        tripData: props.tripData
    }
    const result = toggleFavorite(item)
    if (result === 'limit' || result === 'exists') {
        window.dispatchEvent(new CustomEvent('favoriteMessage', { detail: { type: result } }))
    }
    emit('favorite-change', result)
}

const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})

const contactDialogVisible = ref(false)
const infoDialogVisible = ref(false)
const bannerCarouselRef = ref(null)
const activeBannerIndex = ref(0)

const openContactDialog = () => {
    contactDialogVisible.value = true
}

const openInfoDialog = () => {
    infoDialogVisible.value = true
}

const handleBannerChange = (currentIndex) => {
    activeBannerIndex.value = Number(currentIndex) || 0
}

const getFreeInfoData = (title) => {
    try {
        if (!title || !freeInfoData) {
            return getDefaultFreeInfo(title)
        }

        if (freeInfoData?.subNav && Array.isArray(freeInfoData.subNav)) {
            for (const subNav of freeInfoData.subNav) {
                if (!subNav?.items || !Array.isArray(subNav.items)) continue
                const infoItem = subNav.items.find(item => item?.title === title)
                if (infoItem?.tripData) {
                    return infoItem.tripData
                }
            }
        }

        return getDefaultFreeInfo(title)
    } catch (error) {
        return getDefaultFreeInfo(title)
    }
}

function getDefaultFreeInfo(title = '未知信息') {
    return {
        route: `${title}信息`,
        desc: `关于${title}的详细信息，提供全面的参考资料。`,
        features: [
            { icon: '#22c55e', title: '详细介绍', desc: '提供全面的信息介绍' },
            { icon: '#3b82f6', title: '实用建议', desc: '分享实用的参考建议' },
            { icon: '#f59e0b', title: '注意事项', desc: '提醒重要的注意事项' }
        ],
        tags: ['免费信息', '参考资料', '详细介绍', '实用建议']
    }
}

const routeInfo = computed(() => {
    if (props.tripData && Object.keys(props.tripData).length > 0) {
        return props.tripData;
    }
    return getFreeInfoData(props.title);
})

const scenicItemImageSource = computed(() => {
    try {
        const scenicNav = freeInfoData?.subNav?.find(subItem => subItem?.subNavName === '景点')
        const scenicItem = scenicNav?.items?.find(item => item?.title === props.title)
        return Array.isArray(scenicItem?.imgSource) ? scenicItem.imgSource : []
    } catch (error) {
        return []
    }
})

const infoSourceRows = computed(() => {
    if (Array.isArray(routeInfo.value?.source)) return routeInfo.value.source
    if (Array.isArray(props.tripData?.source)) return props.tripData.source
    return []
})

const sourceEntryName = computed(() => {
    return String(infoSourceRows.value?.[0]?.title || '').trim() || '该条目'
})

const isScenicInfo = computed(() => props.tripType === '景点信息')

const dialogImages = computed(() => {
    const imageGroups = [
        routeInfo.value?.images,
        routeInfo.value?.banners,
        routeInfo.value?.bannerList,
        routeInfo.value?.imgs,
        routeInfo.value?.img,
        routeInfo.value?.cover ? [routeInfo.value.cover] : []
    ]

    const multiImages = imageGroups
        .flatMap(group => {
            if (Array.isArray(group)) return group
            if (group) return [group]
            return []
        })
        .map(image => resolveDataImage(image, ''))
        .filter(Boolean)

    if (multiImages.length > 0) {
        return multiImages
    }

    return props.banner ? [resolveDataImage(props.banner)] : []
})

const normalizeImageSourceEntry = (entry) => {
    if (!entry || typeof entry !== 'object') return null
    const source = String(entry.source || '').trim()
    const sourceName = String(entry.sourceName || entry.sourcename || '').trim()
    const photographerLink = String(entry.photographerLink || '').trim()
    const photographer = String(entry.photographer || '').trim()
    const license = String(entry.license || '').trim()
    const licenseLink = String(entry.licenseLink || '').trim()
    if (!sourceName || !photographer) return null
    return { source, sourceName, photographerLink, photographer, license, licenseLink }
}

const imageSourceMeta = computed(() => {
    const raw = routeInfo.value?.imgSource ?? props.tripData?.imgSource ?? scenicItemImageSource.value
    if (!Array.isArray(raw) || raw.length === 0) return []
    return raw.map(normalizeImageSourceEntry).filter(Boolean)
})

/** 判断是否为本站 TasTrips 图源（仅此类在无拍摄者外链时使用品牌高亮） */
const isTasTripsBrandSource = (sourceName) => {
    const n = String(sourceName || '').trim().toLowerCase().replace(/\s+/g, '')
    return n === 'tastrips' || n === 'tastrips.online'
}

const currentImageSourceMeta = computed(() => {
    if (!imageSourceMeta.value.length) return null
    return imageSourceMeta.value[activeBannerIndex.value] || imageSourceMeta.value[0] || null
})

const getImageAltText = (index) => {
    const sourceMeta = imageSourceMeta.value[index] || imageSourceMeta.value[0]
    if (sourceMeta?.photographer && sourceMeta?.sourceName) {
        const licensePart = sourceMeta?.license ? ` · ${sourceMeta.license}` : ''
        return `Photo by ${sourceMeta.photographer} on ${sourceMeta.sourceName}${licensePart}`
    }
    return props.title || 'banner'
}

watch(dialogVisible, (visible) => {
    if (!visible) return
    activeBannerIndex.value = 0
    nextTick(() => {
        if (bannerCarouselRef.value?.setActiveItem) {
            bannerCarouselRef.value.setActiveItem(0)
        }
    })
})
</script>

<template>
    <el-dialog v-model="dialogVisible" :show-close="false" width="980px" class="free-info-dialog" align-center
        :z-index="Z_INDEX.dialog.base" :append-to-body="true" :lock-scroll="true">
        <template #header="{ close }">
            <div class="dlg-header">
                <div class="dlg-title-wrap">
                    <span class="dlg-title">{{ title }}<span v-if="enTitle">（{{ enTitle }}）</span></span>
                </div>
                <div class="dlg-header-right">
                    <span class="favorite-btn" :class="{ active: isFavorite }" @click="handleToggleFavorite">
                        {{ isFavorite ? '★' : '☆' }}
                    </span>
                    <el-icon class="dlg-close" @click="close"><el-icon-close /></el-icon>
                </div>
            </div>
        </template>

        <div class="dlg-section">
            <div class="dlg-banner w100" v-if="dialogImages.length">
                <el-carousel ref="bannerCarouselRef" :autoplay="false" :interval="0" indicator-position="inside"
                    arrow="hover" height="400px" @change="handleBannerChange">
                    <el-carousel-item v-for="(image, index) in dialogImages" :key="index">
                        <el-image :src="image" :alt="getImageAltText(index)" class="carousel-image pointer" fit="cover"
                            :preview-src-list="dialogImages" :initial-index="index" :zoom-rate="1.2" :max-scale="7"
                            :min-scale="0.2" show-progress show-close show-toolbar show-index :preview-teleported="true"
                            :z-index="Z_INDEX.dialog.imagePreview" />
                    </el-carousel-item>
                </el-carousel>
            </div>
            <p v-if="currentImageSourceMeta" :class="['img-source-note', { 'img-source-note--scenic': isScenicInfo }]">
                ※ Photo by
                <el-link v-if="currentImageSourceMeta.photographerLink" :href="currentImageSourceMeta.photographerLink"
                    target="_blank" rel="noopener noreferrer" class="img-source-link">
                    {{ currentImageSourceMeta.photographer }}
                </el-link>
                <span v-else-if="isTasTripsBrandSource(currentImageSourceMeta.sourceName)" class="img-source-highlight">
                    {{ currentImageSourceMeta.photographer }}</span>
                <span v-else class="img-source-photographer-no-link" title="暂未提供可用的个人主页外链">{{
                    currentImageSourceMeta.photographer }}</span>
                on
                <el-link v-if="currentImageSourceMeta.source" :href="currentImageSourceMeta.source" target="_blank"
                    rel="noopener noreferrer" class="img-source-link">
                    {{ currentImageSourceMeta.sourceName }}
                </el-link>
                <span v-else-if="isTasTripsBrandSource(currentImageSourceMeta.sourceName)" class="img-source-highlight">
                    {{ currentImageSourceMeta.sourceName }}</span>
                <span v-else class="img-source-plain">{{ currentImageSourceMeta.sourceName }}</span>
                <template v-if="currentImageSourceMeta.license">
                    ·
                    <el-link v-if="currentImageSourceMeta.licenseLink" :href="currentImageSourceMeta.licenseLink"
                        target="_blank" rel="noopener noreferrer" class="img-source-link">
                        {{ currentImageSourceMeta.license }}
                    </el-link>
                    <span v-else>{{ currentImageSourceMeta.license }}</span>
                </template>
            </p>

            <div :class="['dlg-text', { 'dlg-text--scenic': isScenicInfo }]">
                <div class="section-title" v-if="!isScenicInfo && routeInfo.route">
                    {{ routeInfo.route }}
                </div>
                <div class="section-desc">
                    {{ routeInfo.desc }}
                </div>
                <div class="feature-grid">
                    <div class="feature-card" v-for="(feature, index) in routeInfo.features" :key="index">
                        <div class="icon" :style="{ background: feature.icon }"></div>
                        <div class="f-title">{{ feature.title }}</div>
                        <div class="f-desc">{{ feature.desc }}</div>
                    </div>
                </div>
                <div class="location-row" v-if="isScenicInfo && routeInfo.route">
                    <span class="location-label">地址：</span>
                    <span class="location-value">{{ routeInfo.route }}</span>
                </div>
                <div class="tag-row">
                    <span class="mini-tag" v-for="(tag, index) in routeInfo.tags" :key="index">{{ tag }}</span>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="dlg-footer">
                <div class="info-disclaimer" @click="infoSourceRows.length ? openInfoDialog() : null">
                    <el-icon class="info-icon">
                        <InfoFilled />
                    </el-icon>
                    <template v-if="infoSourceRows.length">
                        本页信息来源：{{ infoSourceRows[0].desc }}
                    </template>
                    <template v-else>
                        本页信息来源：TasTrips.Online原创
                    </template>
                </div>
                <!-- <el-button type="primary" size="large" @click="openContactDialog">立刻咨询</el-button> -->
            </div>
        </template>
    </el-dialog>

    <ContactDialog v-model:visible="contactDialogVisible" />
    <InfoSourceDialog v-model:visible="infoDialogVisible" :source-data="infoSourceRows"
        :entry-title="sourceEntryName" />
</template>

<style lang="scss" scoped>
.free-info-dialog {
    :deep(.el-dialog__header) {
        margin-right: 0;
        padding: 16px 20px 12px;
        border-bottom: 1px solid #f2f4f8;
    }

    :deep(.el-dialog__body) {
        padding: 0 0 8px 0;
    }

    :deep(.el-dialog__headerbtn) {
        display: none;
    }
}

.dlg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.dlg-title-wrap {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    padding-right: 6px;
}

.dlg-header-right {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.dlg-title {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: 2px;
    color: #111827;
}

.favorite-btn {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    font-size: 27px;
    line-height: 1;
    border-radius: 999px;
    flex-shrink: 0;
    color: #ccc;
    transition: all 0.3s ease;

    &:hover {
        color: #f59e0b;
    }

    &.active {
        color: #f59e0b;
    }
}

.dlg-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    font-size: 22px;
    flex-shrink: 0;
    color: #909399;
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
        color: #409eff;
    }
}

.dlg-banner {
    height: 420px;

    .carousel-image {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }
}

.img-source-note {
    margin: 8px 20px 0;
    font-size: 12px;
    line-height: 1.7;
    color: #6b7280;
    word-break: break-word;
    text-align: left;
}

.img-source-note--scenic {
    text-align: right;
}

.img-source-link {
    color: #33b1a3;
    // font-weight: 600;
    vertical-align: baseline;
}

.img-source-highlight {
    display: inline-block;
    color: #0f766e;
    font-weight: 700;
    background: rgba(51, 177, 163, 0.14);
    border-radius: 4px;
    padding: 0 4px;
    margin: 0 1px;
}

/* 无来源页链接时与注记同色，不过分抢眼 */
.img-source-plain {
    color: inherit;
    font-weight: 500;
}

/* 第三方来源无拍摄者外链：与普通说明区分开，示意悬停可查说明（非标签高亮） */
.img-source-photographer-no-link {
    color: #4b5563;
    font-weight: 600;
    border-bottom: 1px dashed #9ca3af;
    cursor: help;
}

.dlg-section {
    letter-spacing: normal;
    text-align: left;
    max-height: 560px;
    overflow-y: auto;

    .dlg-text {
        padding: 18px 20px 10px;
    }
}

.location-row {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f7faf9;
    border: 1px solid #e5efec;
    line-height: 1.7;
}

.location-label {
    color: #111827;
    font-weight: 700;
    margin-right: 4px;
}

.location-value {
    color: #374151;
    font-size: 14px;
    word-break: break-word;
}

.section-title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 12px;
}

.section-desc {
    line-height: 1.8;
    color: #4b5563;
    font-weight: 400;
    margin-bottom: 16px;
    font-size: 16px;
}

.dlg-text--scenic .section-desc {
    color: #1f2937;
    font-size: 20px;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.feature-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px;
    border: 1px solid #e5e7eb;
}

.icon {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    margin-bottom: 10px;
}

.f-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 6px;
}

.f-desc {
    color: #6b7280;
    line-height: 1.7;
}

.tag-row {
    letter-spacing: normal;
    margin-top: 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.mini-tag {
    background: #f3f4f6;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    color: #374151;
}

.dlg-footer {
    position: relative;
    padding: 0 12px 12px;
    margin-top: 10px;
}

.info-disclaimer {
    position: absolute;
    bottom: 12px;
    left: 12px;
    font-size: 12px;
    color: #9ca3af;
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        text-decoration: underline;
    }

    .info-icon {
        color: #9ca3af;
        font-size: 14px;
        transition: all 0.2s;
    }

    &:hover .info-icon {
        color: #6b7280;
    }
}

.dlg-footer .el-button {
    margin-top: 24px;
}

@media (max-width: 768px) {
    .dlg-header {
        gap: 8px;
    }

    .dlg-title-wrap {
        padding-right: 4px;
    }

    .dlg-header-right {
        gap: 6px;
    }

    .dlg-title {
        font-size: 18px;
        letter-spacing: 1px;
    }

    .favorite-btn {
        width: 36px;
        height: 36px;
        font-size: 28px;
    }

    .dlg-close {
        width: 36px;
        height: 36px;
        font-size: 23px;
    }

    .feature-grid {
        grid-template-columns: repeat(1, 1fr);
    }

    .info-disclaimer {
        position: relative;
        bottom: 0;
    }

    .img-source-note {
        margin: 8px 12px 0;
        font-size: 11px;
        line-height: 1.6;
        text-align: left;
    }

    .img-source-note--scenic {
        text-align: right;
    }

    .location-row {
        margin-top: 8px;
        padding: 8px 10px;
        line-height: 1.6;
    }

    .location-label,
    .location-value {
        font-size: 12px;
    }

    .section-title {
        font-size: 20px;
        margin-bottom: 12px;
    }
}
</style>
