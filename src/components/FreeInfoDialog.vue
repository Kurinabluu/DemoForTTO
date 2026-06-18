<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import InfoSourceDialog from './InfoSourceDialog.vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { resolveDataImage } from '@/utils/dataImageResolver'
import { isFavorite as checkFavorite, toggleFavorite } from '@/utils/favoritesStore'
import { notifyFavoriteResult } from '@/utils/favoriteMessages'
import { notifyApiError } from '@/utils/apiFeedback'
import { loadCatalogItemDetail } from '@/utils/contentRepository'
import { Z_INDEX } from '@/constants/zIndex'

const props = defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    enTitle: { type: String, default: '' },
    banner: { type: String, default: '' },
    tripType: { type: String, default: '' },
    tripData: { type: Object, default: () => ({}) },
    itemId: { type: [Number, String], default: null },
    itemKey: { type: String, default: '' },
    itemType: { type: String, default: 'scenic' },
    parentSpotTitle: { type: String, default: '' },
    parentSpotId: { type: [Number, String], default: null },
    stackLayer: { type: Number, default: 0 },
})

const emit = defineEmits(['update:visible', 'favorite-change', 'open-related-spot', 'open-parent-spot'])

const resolvedItemType = computed(() => props.itemType || props.tripType || 'scenic')
const favoriteSubmitting = ref(false)

const isFavorite = computed(() => {
    return checkFavorite(props.itemId, resolvedItemType.value, props.title, props.itemKey)
})

const handleToggleFavorite = async () => {
    if (favoriteSubmitting.value) return
    favoriteSubmitting.value = true
    const item = {
        id: props.itemId,
        type: resolvedItemType.value,
        itemType: resolvedItemType.value,
        title: props.title,
        enTitle: props.enTitle,
        itemKey: props.itemKey,
        subNavName: props.tripData?.displaySubNav || props.tripData?.subNavName || props.itemType || '',
        image: props.banner,
        banner: props.banner,
        region: props.tripData?.region || '',
        town: props.tripData?.town || '',
        tripData: props.tripData
    }
    try {
        const result = await toggleFavorite(item)
        notifyFavoriteResult(result)
        emit('favorite-change', result)
    } catch (error) {
        notifyApiError(error, { action: '收藏操作', dedupeKey: 'favorite:toggle' })
    } finally {
        favoriteSubmitting.value = false
    }
}

const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})

const resolvedDetailItem = ref(null)
const infoDialogVisible = ref(false)
const bannerCarouselRef = ref(null)
const activeBannerIndex = ref(0)

const openInfoDialog = () => {
    infoDialogVisible.value = true
}

const handleBannerChange = (currentIndex) => {
    activeBannerIndex.value = Number(currentIndex) || 0
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

function mergeTripData(detailTripData, propsTripData) {
    const fromDetail = detailTripData && typeof detailTripData === 'object' ? detailTripData : {}
    const fromProps = propsTripData && typeof propsTripData === 'object' ? propsTripData : {}
    return {
        ...fromProps,
        ...fromDetail,
        childSpots: Array.isArray(fromProps.childSpots) && fromProps.childSpots.length
            ? fromProps.childSpots
            : (Array.isArray(fromDetail.childSpots) ? fromDetail.childSpots : []),
        parentSpotTitle: fromProps.parentSpotTitle || fromDetail.parentSpotTitle || '',
        parentSpotId: fromProps.parentSpotId ?? fromDetail.parentSpotId ?? null,
        parentSpotOpenPayload: fromProps.parentSpotOpenPayload || fromDetail.parentSpotOpenPayload || null,
        belongsToSpot: fromDetail.belongsToSpot || fromProps.belongsToSpot || '',
        parentItemId: fromDetail.parentItemId ?? fromProps.parentItemId ?? null,
    }
}

const routeInfo = computed(() => {
    if (resolvedDetailItem.value?.tripData) {
        return mergeTripData(resolvedDetailItem.value.tripData, props.tripData)
    }
    if (props.tripData && Object.keys(props.tripData).length > 0) {
        return props.tripData
    }
    return getDefaultFreeInfo(props.title)
})

const dialogTitle = computed(() => resolvedDetailItem.value?.title || props.title || '')
const dialogEnTitle = computed(() => resolvedDetailItem.value?.enTitle || props.enTitle || '')

const scenicItemImageSource = computed(() => {
    const imgSource = routeInfo.value?.imgSource
    return Array.isArray(imgSource) ? imgSource : []
})

const infoSourceRows = computed(() => {
    if (Array.isArray(routeInfo.value?.source)) return routeInfo.value.source
    if (Array.isArray(props.tripData?.source)) return props.tripData.source
    return []
})

const sourceEntryName = computed(() => {
    return String(infoSourceRows.value?.[0]?.title || '').trim() || '该条目'
})

const isScenicInfo = computed(() => resolvedItemType.value === '景点信息')
const isRestaurantInfo = computed(() => resolvedItemType.value === '餐厅信息')

const childSpots = computed(() => {
    const raw = routeInfo.value?.childSpots
    if (!Array.isArray(raw)) return []
    return raw.filter((spot) => spot && typeof spot === 'object' && spot.title)
})

const isSubSpotDialog = computed(() => props.parentSpotTitle && props.parentSpotId)

const siblingSpots = computed(() => {
    if (!isSubSpotDialog.value) return []
    return childSpots.value.filter((spot) => spot.title !== props.title)
})

const parentSpotCard = computed(() => {
    const payload = routeInfo.value?.parentSpotOpenPayload
    if (payload && typeof payload === 'object' && payload.title) {
        return payload
    }
    if (!props.parentSpotTitle) return null
    return {
        id: props.parentSpotId,
        title: props.parentSpotTitle,
        img: props.banner,
        banner: props.banner,
    }
})

const childSpotsSectionTitle = computed(() => {
    if (isSubSpotDialog.value) return ''
    if (!childSpots.value.length) return ''
    return '此地还可游览'
})

const dialogZIndex = computed(() => Z_INDEX.dialog.base + (props.stackLayer || 0) * 20)

const loadDetailFromApi = async () => {
    if (props.itemId == null || props.itemId === '') return
    const detailKey = String(props.itemId)
    if (resolvedDetailItem.value?.id != null && String(resolvedDetailItem.value.id) === detailKey) return
    try {
        const detail = await loadCatalogItemDetail(props.itemId)
        if (!detail) {
            resolvedDetailItem.value = null
            return
        }
        resolvedDetailItem.value = {
            ...detail,
            tripData: mergeTripData(detail.tripData, props.tripData),
        }
    } catch (error) {
        notifyApiError(error, { action: '加载详情', dedupeKey: 'free-info:detail' })
    }
}

const resolveChildSpotImage = (spot) => {
    const raw = spot?.img || spot?.banner || ''
    return resolveDataImage(raw, '')
}

const openRelatedSpot = (spot) => {
    if (!spot) return

    const siblingList = childSpots.value
    const parentTitle = isSubSpotDialog.value ? props.parentSpotTitle : props.title
    const parentId = isSubSpotDialog.value ? props.parentSpotId : props.itemId
    const parentPayload = isSubSpotDialog.value
        ? routeInfo.value?.parentSpotOpenPayload
        : {
            title: props.title,
            enTitle: props.enTitle,
            banner: props.banner,
            id: props.itemId,
            itemKey: props.itemKey,
            tripType: '景点信息',
            itemType: '景点信息',
            tripData: {
                ...routeInfo.value,
                childSpots: siblingList,
            },
        }

    emit('open-related-spot', {
        ...spot,
        tripType: spot.tripType || '景点信息',
        itemType: spot.itemType || '景点信息',
        parentSpotTitle: parentTitle,
        parentSpotId: parentId,
        tripData: {
            ...(spot.tripData || {}),
            childSpots: siblingList,
            parentSpotTitle: parentTitle,
            parentSpotId: parentId,
            parentSpotOpenPayload: parentPayload,
        },
    })
}

const openParentSpot = () => {
    const payload = routeInfo.value?.parentSpotOpenPayload
    if (payload && typeof payload === 'object') {
        emit('open-parent-spot', payload)
        return
    }
    if (!props.parentSpotId) return
    emit('open-parent-spot', {
        id: props.parentSpotId,
        title: props.parentSpotTitle,
        tripType: '景点信息',
        itemType: '景点信息',
    })
}

const dialogImages = computed(() => {
    const imageGroups = isRestaurantInfo.value
        ? [routeInfo.value?.img]
        : [
            routeInfo.value?.images,
            routeInfo.value?.banners,
            routeInfo.value?.bannerList,
            routeInfo.value?.imgs,
            routeInfo.value?.img,
            routeInfo.value?.cover ? [routeInfo.value.cover] : [],
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
    const raw = routeInfo.value?.imgSource ?? scenicItemImageSource.value
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
    if (!visible) {
        resolvedDetailItem.value = null
        return
    }
    activeBannerIndex.value = 0
    void loadDetailFromApi()
    nextTick(() => {
        if (bannerCarouselRef.value?.setActiveItem) {
            bannerCarouselRef.value.setActiveItem(0)
        }
    })
})
</script>

<template>
    <el-dialog v-model="dialogVisible" :show-close="false" width="980px" class="free-info-dialog" align-center
        :z-index="dialogZIndex" :append-to-body="true" :lock-scroll="true">
        <template #header="{ close }">
            <div class="dlg-header">
                <div class="dlg-title-wrap">
                    <span class="dlg-title">{{ dialogTitle }}<span v-if="dialogEnTitle">（{{ dialogEnTitle
                            }}）</span></span>
                </div>
                <div class="dlg-header-right">
                    <el-button text class="favorite-btn" :disabled="favoriteSubmitting" :class="{ active: isFavorite }"
                        @click="handleToggleFavorite">
                        {{ isFavorite ? '★' : '☆' }}
                    </el-button>
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
                <!-- 母景点弹窗：显示包含的子景点 -->
                <div v-if="isScenicInfo && !isSubSpotDialog && childSpots.length" class="child-spots-section">
                    <div class="child-spots-title">{{ childSpotsSectionTitle }}</div>
                    <div class="child-spots-grid">
                        <button v-for="spot in childSpots" :key="spot.itemKey || spot.id || spot.title" type="button"
                            class="child-spot-card" @click="openRelatedSpot(spot)">
                            <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)" :alt="spot.title"
                                class="child-spot-thumb" />
                            <span v-else class="child-spot-thumb child-spot-thumb--empty">{{ spot.title?.slice(0, 1) ||
                                '景'
                                }}</span>
                            <span class="child-spot-name">{{ spot.title }}</span>
                        </button>
                    </div>
                </div>
                <!-- 子景点弹窗：左侧所属景点 + 竖线 + 右侧同区域其他景点 -->
                <div v-if="isScenicInfo && isSubSpotDialog" class="sibling-spots-section">
                    <div class="sibling-spots-layout">
                        <div class="sibling-parent-block">
                            <span class="sibling-parent-label">所属景点</span>
                            <div class="sibling-spots-grid sibling-spots-grid--single">
                                <button v-if="parentSpotCard" type="button" class="child-spot-card"
                                    @click="openParentSpot">
                                    <img v-if="resolveChildSpotImage(parentSpotCard)"
                                        :src="resolveChildSpotImage(parentSpotCard)" :alt="parentSpotTitle"
                                        class="child-spot-thumb" />
                                    <span v-else class="child-spot-thumb child-spot-thumb--empty">{{
                                        parentSpotTitle?.slice(0, 1) || '景' }}</span>
                                    <span class="child-spot-name">{{ parentSpotTitle }}</span>
                                </button>
                            </div>
                        </div>
                        <span class="sibling-divider" aria-hidden="true"></span>
                        <div class="sibling-others-block">
                            <span class="sibling-label">同区域其他景点</span>
                            <div v-if="siblingSpots.length" class="sibling-spots-grid">
                                <button v-for="spot in siblingSpots" :key="spot.itemKey || spot.id || spot.title"
                                    type="button" class="child-spot-card" @click="openRelatedSpot(spot)">
                                    <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)"
                                        :alt="spot.title" class="child-spot-thumb" />
                                    <span v-else class="child-spot-thumb child-spot-thumb--empty">{{
                                        spot.title?.slice(0, 1) ||
                                        '景'
                                        }}</span>
                                    <span class="child-spot-name">{{ spot.title }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
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
            </div>
        </template>
    </el-dialog>
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
    padding: 6px 12px;
    font-size: 12px;
    line-height: 1.5;
    color: #374151;
    white-space: normal;
    word-break: break-word;
}

.child-spots-section {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid #e5efec;
}

.child-spots-title {
    font-size: 18px;
    font-weight: 800;
    color: #1a7a6f;
    margin-bottom: 12px;
    line-height: 1.5;
    letter-spacing: 0.5px;
}

.sibling-spots-section {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid #e5efec;
}

.sibling-spots-layout {
    display: flex;
    align-items: flex-start;
    gap: 14px;
}

.sibling-parent-block {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.sibling-parent-label {
    font-size: 12px;
    font-weight: 600;
    color: #5f6b76;
    letter-spacing: 0.5px;
}

.sibling-divider {
    flex: 0 0 2px;
    align-self: stretch;
    min-height: 48px;
    background: #279486;
    border-radius: 1px;
}

.sibling-others-block {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.sibling-label {
    font-size: 12px;
    font-weight: 600;
    color: #5f6b76;
    letter-spacing: 0.5px;
}

.sibling-spots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 10px;
}

.sibling-spots-grid--single {
    grid-template-columns: minmax(100px, 120px);
    width: fit-content;
    max-width: 100%;
}

.child-spots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
}

.child-spot-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 8px;
    border: 1px solid #dcefe9;
    border-radius: 10px;
    background: #f7faf9;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:hover {
        border-color: #33b1a3;
        box-shadow: 0 2px 8px rgba(39, 148, 134, 0.12);
    }
}

.child-spot-thumb {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 6px;
    background: #e5e7eb;
}

.child-spot-thumb--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 700;
    color: #6b7280;
}

.child-spot-name {
    font-size: 12px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
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

@media (max-width: 480px) {
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

    .sibling-spots-layout {
        flex-direction: column;
        gap: 12px;
    }

    .sibling-divider {
        display: none;
    }

    .sibling-parent-block,
    .sibling-others-block {
        width: 100%;
    }

    .sibling-spots-grid--single {
        grid-template-columns: repeat(auto-fill, minmax(96px, 120px));
    }

    .child-spots-grid,
    .sibling-spots-grid {
        grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    }
}
</style>
