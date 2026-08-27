<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import InfoSourceDialog from './InfoSourceDialog.vue'
import { ArrowLeft, ArrowRight, InfoFilled } from '@element-plus/icons-vue'
import { resolveDataImageWithStatus, DEFAULT_DATA_IMAGE } from '@/utils/dataImageResolver'
import { isFavorite as checkFavorite, toggleFavorite } from '@/utils/favoritesStore'
import { notifyFavoriteResult } from '@/utils/favoriteMessages'
import { notifyApiError } from '@/utils/apiFeedback'
import { ElMessage } from 'element-plus'
import { loadCatalogItemDetail } from '@/utils/contentRepository'
import { mergeImageSourceIntoTripData } from '@/utils/freeInfoImageUtils'
import { pickRelatedSpotCoverPath } from '@/utils/freeInfoRelations'
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
        town: props.tripData?.town || '',
        locationLabel: props.tripData?.locationLabel || '',
        postcode: props.tripData?.postcode || '',
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
const failedDialogImageIndexes = ref(new Set())
const imagePathWarningShownForOpen = ref(false)
const initialRawImagePaths = ref([])
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

function mergeTripData(detailTripData, propsTripData, sourceItem = null) {
    const fromDetail = detailTripData && typeof detailTripData === 'object' ? detailTripData : {}
    const fromProps = propsTripData && typeof propsTripData === 'object' ? propsTripData : {}
    const merged = {
        ...fromProps,
        ...fromDetail,
        childSpots: Array.isArray(fromProps.childSpots) && fromProps.childSpots.length
            ? fromProps.childSpots
            : (Array.isArray(fromDetail.childSpots) ? fromDetail.childSpots : []),
        siblingSpots: Array.isArray(fromProps.siblingSpots) && fromProps.siblingSpots.length
            ? fromProps.siblingSpots
            : (Array.isArray(fromDetail.siblingSpots) ? fromDetail.siblingSpots : []),
        hasChildSpots: Boolean(fromDetail.hasChildSpots ?? fromProps.hasChildSpots ?? false),
        parentSpotTitle: fromProps.parentSpotTitle || fromDetail.parentSpotTitle || '',
        parentSpotId: fromProps.parentSpotId ?? fromDetail.parentSpotId ?? null,
        parentSpotOpenPayload: fromProps.parentSpotOpenPayload || fromDetail.parentSpotOpenPayload || null,
        belongsToSpot: fromDetail.belongsToSpot || fromProps.belongsToSpot || '',
        parentItemId: fromDetail.parentItemId ?? fromProps.parentItemId ?? null,
    }
    return mergeImageSourceIntoTripData(sourceItem, merged)
}

const routeInfo = computed(() => {
    if (resolvedDetailItem.value?.tripData) {
        return mergeTripData(
            resolvedDetailItem.value.tripData,
            props.tripData,
            resolvedDetailItem.value,
        )
    }
    if (props.tripData && Object.keys(props.tripData).length > 0) {
        const hasContent = props.tripData.route || props.tripData.desc
            || (Array.isArray(props.tripData.features) && props.tripData.features.length)
        if (hasContent) return props.tripData
        // tripData 稀疏时（如仅含 locationLabel/postcode），用默认值补全内容
        return { ...getDefaultFreeInfo(props.title), ...props.tripData }
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
const isLodgingInfo = computed(() => resolvedItemType.value === '住宿信息')
const shouldAlignImageSourceRight = computed(() => isScenicInfo.value || isLodgingInfo.value)

const scenicAddressText = computed(() => {
    if (!isScenicInfo.value) return ''
    const route = String(routeInfo.value?.route || '').trim()
    if (!route) return ''
    const title = String(dialogTitle.value || props.title || '').trim()
    const defaultRoute = title ? `${title}信息` : '未知信息信息'
    if (route === defaultRoute) return ''
    return route
})

const childSpots = computed(() => {
    const raw = routeInfo.value?.childSpots
    if (!Array.isArray(raw)) return []
    return raw.filter((spot) => spot && typeof spot === 'object' && spot.title)
})

const hasChildSpots = computed(() => {
    return Boolean(routeInfo.value?.hasChildSpots) || childSpots.value.length > 0
})

const isSubSpotDialog = computed(() => props.parentSpotTitle && props.parentSpotId)

const siblingSpots = computed(() => {
    if (!isSubSpotDialog.value) return []
    const raw = routeInfo.value?.siblingSpots
    if (!Array.isArray(raw)) return []
    return raw.filter((spot) => spot && typeof spot === 'object' && spot.title && spot.title !== props.title)
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
        img: '',
        banner: '',
    }
})

const childSpotsSectionTitle = computed(() => {
    if (!hasChildSpots.value) return ''
    return '此地还可游览'
})

const MOTHER_VISIBLE_SPOT_COUNT = 5
const SUB_VISIBLE_SPOT_COUNT = 2

const childSpotsCarouselOffset = ref(0)
const siblingSpotsCarouselOffset = ref(0)

function getSpotCarouselView(items, offset, visibleCount) {
    const list = Array.isArray(items) ? items : []
    const count = Math.max(1, Number(visibleCount) || 1)
    const hasOverflow = list.length > count
    const maxOffset = Math.max(0, list.length - count)

    return {
        spots: hasOverflow ? list.slice(offset, offset + count) : list,
        canGoPrev: hasOverflow && offset > 0,
        canGoNext: hasOverflow && offset < maxOffset,
        hasOverflow,
    }
}

const motherChildSpotsCarouselView = computed(() =>
    getSpotCarouselView(childSpots.value, childSpotsCarouselOffset.value, MOTHER_VISIBLE_SPOT_COUNT)
)

const subChildSpotsCarouselView = computed(() =>
    getSpotCarouselView(childSpots.value, childSpotsCarouselOffset.value, SUB_VISIBLE_SPOT_COUNT)
)

const siblingSpotsCarouselView = computed(() =>
    getSpotCarouselView(siblingSpots.value, siblingSpotsCarouselOffset.value, SUB_VISIBLE_SPOT_COUNT)
)

function shiftSpotCarousel(offsetRef, items, direction, visibleCount) {
    const list = Array.isArray(items) ? items : []
    const count = Math.max(1, Number(visibleCount) || 1)
    if (list.length <= count) return
    const maxOffset = Math.max(0, list.length - count)
    if (direction === 'prev') {
        offsetRef.value = Math.max(0, offsetRef.value - 1)
        return
    }
    offsetRef.value = Math.min(maxOffset, offsetRef.value + 1)
}

function shiftChildSpotsCarousel(direction, visibleCount = SUB_VISIBLE_SPOT_COUNT) {
    shiftSpotCarousel(childSpotsCarouselOffset, childSpots.value, direction, visibleCount)
}

function shiftSiblingSpotsCarousel(direction) {
    shiftSpotCarousel(siblingSpotsCarouselOffset, siblingSpots.value, direction, SUB_VISIBLE_SPOT_COUNT)
}

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
            tripData: mergeTripData(detail.tripData, props.tripData, detail),
        }
        await nextTick()
        scheduleNotifyImagePathIssues()
    } catch (error) {
        notifyApiError(error, { action: '加载详情', dedupeKey: 'free-info:detail' })
    }
}

const resolveChildSpotImage = (spot) => {
    const raw = pickRelatedSpotCoverPath(spot)
    if (!raw) return ''
    return resolveDataImageWithStatus(raw, { variant: 'thumb' }).src
}

const dedupeImagePaths = (paths) => {
    const seen = new Set()
    const result = []
    for (const raw of paths) {
        const path = String(raw || '').trim()
        if (!path || seen.has(path)) continue
        seen.add(path)
        result.push(path)
    }
    return result
}

function isLikelyResolvedAssetUrl(path) {
    const value = String(path || '').trim()
    if (!value) return false
    return /^(https?:|data:|blob:)/i.test(value)
        || value.includes('/node_modules/.vite/')
        || value.includes('.thumb.webp')
        || value.includes('.original.webp')
        || /^\/src\/assets\//.test(value)
}

function extractRawImagePathsFrom(source) {
    if (!source || typeof source !== 'object') return []

    const imageGroups = isRestaurantInfo.value
        ? [source.img]
        : [
            source.images,
            source.banners,
            source.bannerList,
            source.imgs,
            source.img,
            source.cover ? [source.cover] : [],
        ]

    return dedupeImagePaths(
        imageGroups.flatMap((group) => {
            if (Array.isArray(group)) return group
            if (group) return [group]
            return []
        }).filter((path) => !isLikelyResolvedAssetUrl(path))
    )
}

function captureInitialRawImagePaths() {
    initialRawImagePaths.value = extractRawImagePathsFrom(props.tripData)
}

const dialogImagePaths = computed(() => {
    return dedupeImagePaths([
        ...extractRawImagePathsFrom(routeInfo.value),
        ...initialRawImagePaths.value,
    ])
})

const dialogImageSlides = computed(() => {
    const paths = dialogImagePaths.value
    if (paths.length === 0) {
        return [{
            originalPath: '',
            displaySrc: DEFAULT_DATA_IMAGE,
            previewSrc: DEFAULT_DATA_IMAGE,
            usedFallback: false,
            isIntentionalDefault: true,
            errorReason: '',
        }]
    }

    return paths.map((path) => {
        const thumb = resolveDataImageWithStatus(path, { variant: 'thumb' })
        const original = resolveDataImageWithStatus(path, { variant: 'original' })
        return {
            originalPath: path,
            displaySrc: thumb.src,
            previewSrc: original.src,
            usedFallback: thumb.usedFallback,
            isIntentionalDefault: false,
            errorReason: thumb.errorReason,
        }
    })
})

function getDialogImageDisplaySrc(index) {
    if (failedDialogImageIndexes.value.has(index)) {
        return DEFAULT_DATA_IMAGE
    }
    return dialogImageSlides.value[index]?.displaySrc || DEFAULT_DATA_IMAGE
}

function getDialogImagePreviewSrc(index) {
    if (failedDialogImageIndexes.value.has(index)) {
        return DEFAULT_DATA_IMAGE
    }
    return dialogImageSlides.value[index]?.previewSrc || DEFAULT_DATA_IMAGE
}

const dialogPreviewSrcList = computed(() =>
    dialogImageSlides.value.map((_, index) => getDialogImagePreviewSrc(index))
)

function handleDialogImageError(index) {
    const slide = dialogImageSlides.value[index]
    if (!slide?.originalPath || slide.isIntentionalDefault) return
    if (failedDialogImageIndexes.value.has(index)) return
    failedDialogImageIndexes.value = new Set([...failedDialogImageIndexes.value, index])
    scheduleNotifyImagePathIssues()
}

function scheduleNotifyImagePathIssues() {
    nextTick(() => {
        notifyImagePathIssues()
        window.setTimeout(() => notifyImagePathIssues(), 450)
    })
}

function notifyImagePathIssues() {
    if (!dialogVisible.value || imagePathWarningShownForOpen.value) return

    const hasImageIssue = dialogImageSlides.value.some((slide, index) => {
        if (slide.isIntentionalDefault || !slide.originalPath) return false
        if (slide.usedFallback) return true
        if (failedDialogImageIndexes.value.has(index)) return true
        return Boolean(
            !isLikelyResolvedAssetUrl(slide.originalPath)
            && getDialogImageDisplaySrc(index) === DEFAULT_DATA_IMAGE
        )
    })

    if (!hasImageIssue) return

    ElMessage.warning({
        message: '部分图片无法加载，已显示默认图',
        duration: 4500,
        showClose: true,
        appendTo: typeof document !== 'undefined' ? document.body : undefined,
        customClass: 'free-info-image-path-message',
        zIndex: Z_INDEX.dialog.high + 100,
    })
    imagePathWarningShownForOpen.value = true
}

const failedDialogImageIndexesKey = computed(() => [...failedDialogImageIndexes.value].sort().join(','))

const openRelatedSpot = (spot, source = 'child') => {
    if (!spot) return

    const parentChildren = Array.isArray(routeInfo.value?.parentSpotOpenPayload?.tripData?.childSpots)
        ? routeInfo.value.parentSpotOpenPayload.tripData.childSpots.filter((spotItem) => spotItem && spotItem.title)
        : []
    const currentChildList = childSpots.value
    const siblingList = source === 'sibling'
        ? (parentChildren.length ? parentChildren : siblingSpots.value)
            .filter((spotItem) => spotItem && spotItem.title && spotItem.title !== spot.title)
        : currentChildList.filter((spotItem) => spotItem && spotItem.title && spotItem.title !== spot.title)
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
            childSpots: Array.isArray(spot.tripData?.childSpots) ? spot.tripData.childSpots : [],
            siblingSpots: siblingList,
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
        childSpotsCarouselOffset.value = 0
        siblingSpotsCarouselOffset.value = 0
        failedDialogImageIndexes.value = new Set()
        initialRawImagePaths.value = []
        imagePathWarningShownForOpen.value = false
        return
    }
    captureInitialRawImagePaths()
    childSpotsCarouselOffset.value = 0
    siblingSpotsCarouselOffset.value = 0
    activeBannerIndex.value = 0
    failedDialogImageIndexes.value = new Set()
    imagePathWarningShownForOpen.value = false
    void loadDetailFromApi()
    scheduleNotifyImagePathIssues()
    nextTick(() => {
        if (bannerCarouselRef.value?.setActiveItem) {
            bannerCarouselRef.value.setActiveItem(0)
        }
    })
}, { immediate: true })

onMounted(() => {
    if (dialogVisible.value) {
        captureInitialRawImagePaths()
        scheduleNotifyImagePathIssues()
    }
})

watch([childSpots, siblingSpots], () => {
    childSpotsCarouselOffset.value = 0
    siblingSpotsCarouselOffset.value = 0
})

watch([dialogImageSlides, failedDialogImageIndexesKey], () => {
    if (!dialogVisible.value) return
    scheduleNotifyImagePathIssues()
}, { deep: true })
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
            <div class="dlg-banner w100" v-if="dialogImageSlides.length">
                <el-carousel ref="bannerCarouselRef" :autoplay="false" :interval="0" indicator-position="inside"
                    arrow="hover" height="400px" @change="handleBannerChange">
                    <el-carousel-item v-for="(slide, index) in dialogImageSlides" :key="`${slide.originalPath}-${index}`">
                        <el-image :src="getDialogImageDisplaySrc(index)" :alt="getImageAltText(index)"
                            class="carousel-image pointer" fit="cover"
                            :preview-src-list="dialogPreviewSrcList"
                            :initial-index="index" :zoom-rate="1.2" :max-scale="7" :min-scale="0.2"
                            :lazy="index > 0" show-progress show-close show-toolbar show-index
                            :preview-teleported="true" :z-index="Z_INDEX.dialog.imagePreview"
                            @error="handleDialogImageError(index)" />
                    </el-carousel-item>
                </el-carousel>
            </div>
            <p v-if="currentImageSourceMeta" :class="['img-source-note', { 'img-source-note--align-right': shouldAlignImageSourceRight }]">
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
                <div v-if="scenicAddressText" class="scenic-address">
                    <span class="scenic-address-label">地址</span>
                    <span class="scenic-address-text">{{ scenicAddressText }}</span>
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
                <div class="tag-row">
                    <span class="mini-tag" v-for="(tag, index) in routeInfo.tags" :key="index">{{ tag }}</span>
                </div>
                <!-- 母景点弹窗：显示包含的子景点 -->
                <div v-if="isScenicInfo && !isSubSpotDialog && hasChildSpots" class="child-spots-section">
                    <div class="child-spots-title">{{ childSpotsSectionTitle }}</div>
                    <div class="spot-carousel">
                        <button v-if="motherChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                            :class="{ 'spot-carousel-nav--disabled': !motherChildSpotsCarouselView.canGoPrev }"
                            :disabled="!motherChildSpotsCarouselView.canGoPrev" aria-label="查看上一组"
                            @click="shiftChildSpotsCarousel('prev', MOTHER_VISIBLE_SPOT_COUNT)">
                            <el-icon class="spot-carousel-nav-icon">
                                <ArrowLeft />
                            </el-icon>
                        </button>
                        <div class="spot-carousel-cards">
                            <button v-for="spot in motherChildSpotsCarouselView.spots"
                                :key="spot.itemKey || spot.id || spot.title" type="button" class="child-spot-card"
                                :title="spot.title" @click="openRelatedSpot(spot, 'child')">
                                <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)"
                                    :alt="spot.title" class="child-spot-thumb" loading="lazy" decoding="async" />
                                <span v-else class="child-spot-thumb child-spot-thumb--empty">{{
                                    spot.title?.slice(0, 1) || '景' }}</span>
                                <span class="child-spot-name" :title="spot.title">{{ spot.title }}</span>
                                <span v-if="spot.enTitle" class="child-spot-en-name" :title="spot.enTitle">{{
                                    spot.enTitle }}</span>
                            </button>
                        </div>
                        <button v-if="motherChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                            :class="{ 'spot-carousel-nav--disabled': !motherChildSpotsCarouselView.canGoNext }"
                            :disabled="!motherChildSpotsCarouselView.canGoNext" aria-label="查看更多"
                            @click="shiftChildSpotsCarousel('next', MOTHER_VISIBLE_SPOT_COUNT)">
                            <el-icon class="spot-carousel-nav-icon">
                                <ArrowRight />
                            </el-icon>
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
                                    :title="parentSpotTitle" @click="openParentSpot">
                                    <img v-if="resolveChildSpotImage(parentSpotCard)"
                                        :src="resolveChildSpotImage(parentSpotCard)" :alt="parentSpotTitle"
                                        class="child-spot-thumb" loading="lazy" decoding="async" />
                                    <span v-else class="child-spot-thumb child-spot-thumb--empty">{{
                                        parentSpotTitle?.slice(0, 1) || '景' }}</span>
                                    <span class="child-spot-name" :title="parentSpotTitle">{{ parentSpotTitle }}</span>
                                    <span v-if="parentSpotCard.enTitle" class="child-spot-en-name"
                                        :title="parentSpotCard.enTitle">{{ parentSpotCard.enTitle }}</span>
                                </button>
                            </div>
                        </div>
                        <span v-if="siblingSpots.length" class="sibling-divider" aria-hidden="true"></span>
                        <div v-if="siblingSpots.length" class="sibling-others-block">
                            <span class="sibling-label">同区域其他景点</span>
                            <div class="spot-carousel">
                                <button v-if="siblingSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                                    :class="{ 'spot-carousel-nav--disabled': !siblingSpotsCarouselView.canGoPrev }"
                                    :disabled="!siblingSpotsCarouselView.canGoPrev" aria-label="查看上一组"
                                    @click="shiftSiblingSpotsCarousel('prev')">
                                    <el-icon class="spot-carousel-nav-icon">
                                        <ArrowLeft />
                                    </el-icon>
                                </button>
                                <div class="spot-carousel-cards spot-carousel-cards--sub">
                                    <button v-for="spot in siblingSpotsCarouselView.spots"
                                        :key="spot.itemKey || spot.id || spot.title" type="button"
                                        class="child-spot-card" :title="spot.title"
                                        @click="openRelatedSpot(spot, 'sibling')">
                                        <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)"
                                            :alt="spot.title" class="child-spot-thumb" loading="lazy"
                                            decoding="async" />
                                        <span v-else class="child-spot-thumb child-spot-thumb--empty">{{
                                            spot.title?.slice(0, 1) || '景' }}</span>
                                        <span class="child-spot-name" :title="spot.title">{{ spot.title }}</span>
                                        <span v-if="spot.enTitle" class="child-spot-en-name" :title="spot.enTitle">{{
                                            spot.enTitle }}</span>
                                    </button>
                                </div>
                                <button v-if="siblingSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                                    :class="{ 'spot-carousel-nav--disabled': !siblingSpotsCarouselView.canGoNext }"
                                    :disabled="!siblingSpotsCarouselView.canGoNext" aria-label="查看更多"
                                    @click="shiftSiblingSpotsCarousel('next')">
                                    <el-icon class="spot-carousel-nav-icon">
                                        <ArrowRight />
                                    </el-icon>
                                </button>
                            </div>
                        </div>
                        <span v-if="hasChildSpots" class="sibling-divider" aria-hidden="true"></span>
                        <div v-if="hasChildSpots" class="sibling-others-block sibling-children-block">
                            <span class="sibling-label">{{ childSpotsSectionTitle }}</span>
                            <div class="spot-carousel">
                                <button v-if="subChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                                    :class="{ 'spot-carousel-nav--disabled': !subChildSpotsCarouselView.canGoPrev }"
                                    :disabled="!subChildSpotsCarouselView.canGoPrev" aria-label="查看上一组"
                                    @click="shiftChildSpotsCarousel('prev')">
                                    <el-icon class="spot-carousel-nav-icon">
                                        <ArrowLeft />
                                    </el-icon>
                                </button>
                                <div class="spot-carousel-cards spot-carousel-cards--sub">
                                    <button v-for="spot in subChildSpotsCarouselView.spots"
                                        :key="spot.itemKey || spot.id || spot.title" type="button"
                                        class="child-spot-card" :title="spot.title"
                                        @click="openRelatedSpot(spot, 'child')">
                                        <img v-if="resolveChildSpotImage(spot)" :src="resolveChildSpotImage(spot)"
                                            :alt="spot.title" class="child-spot-thumb" loading="lazy"
                                            decoding="async" />
                                        <span v-else class="child-spot-thumb child-spot-thumb--empty">{{
                                            spot.title?.slice(0, 1) || '景' }}</span>
                                        <span class="child-spot-name" :title="spot.title">{{ spot.title }}</span>
                                        <span v-if="spot.enTitle" class="child-spot-en-name" :title="spot.enTitle">{{
                                            spot.enTitle }}</span>
                                    </button>
                                </div>
                                <button v-if="subChildSpotsCarouselView.hasOverflow" type="button" class="spot-carousel-nav"
                                    :class="{ 'spot-carousel-nav--disabled': !subChildSpotsCarouselView.canGoNext }"
                                    :disabled="!subChildSpotsCarouselView.canGoNext" aria-label="查看更多"
                                    @click="shiftChildSpotsCarousel('next')">
                                    <el-icon class="spot-carousel-nav-icon">
                                        <ArrowRight />
                                    </el-icon>
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

.img-source-note--align-right,
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

.section-title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 12px;
}

.scenic-address {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding: 12px 14px;
    background: #f0faf8;
    border-left: 3px solid #279486;
    border-radius: 0 8px 8px 0;
}

.scenic-address-label {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    color: #279486;
    letter-spacing: 0.5px;
    line-height: 1;
}

.scenic-address-text {
    font-size: 15px;
    line-height: 1.6;
    color: #374151;
    font-weight: 500;
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
    overflow: hidden;
}

.sibling-spots-layout {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    min-width: 0;
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
    overflow: hidden;
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
    width: 120px;
    max-width: 100%;
    grid-template-columns: 120px;
}

.spot-carousel {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    overflow: hidden;
}

.spot-carousel-cards {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    overflow: hidden;
}

.spot-carousel-cards--sub {
    flex: 0 0 auto;
    grid-template-columns: repeat(2, 120px);
    min-width: calc(2 * 120px + 10px);
}

.spot-carousel-nav {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    padding: 0;
    border: none;
    background: transparent;
    color: #b8c0cc;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
        color: #6b7280;
    }

    &:disabled,
    &.spot-carousel-nav--disabled {
        color: #d1d5db;
        cursor: not-allowed;
    }
}

.spot-carousel-nav-icon {
    font-size: 44px;
    line-height: 1;
}

.child-spot-card {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    min-width: 0;
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
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    display: block;
}

.child-spot-en-name {
    font-size: 12px;
    font-weight: 400;
    color: #6b7280;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    display: block;
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

    .img-source-note--align-right,
    .img-source-note--scenic {
        text-align: right;
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
        width: 120px;
        grid-template-columns: 120px;
    }

    .spot-carousel-cards {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .spot-carousel-cards--sub {
        grid-template-columns: repeat(2, 120px);
        min-width: calc(2 * 120px + 10px);
    }

    .spot-carousel-nav {
        width: 30px;
    }

    .spot-carousel-nav-icon {
        font-size: 38px;
    }

}

:global(.free-info-image-path-message) {
    z-index: 13000 !important;
}
</style>
