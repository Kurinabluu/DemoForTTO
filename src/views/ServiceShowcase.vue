<template>
    <div class="service-showcase">
        <!-- 顶部服务标题（左上角） -->
        <h1 class="service-title fowe7" v-if="titleText">{{ titleText }}</h1>

        <!-- 主要服务介绍区域 -->
        <div class="hero-section">
            <div class="hero-content">
                <div class="hero-image">
                    <div class="image-placeholder"></div>
                </div>
                <div class="hero-text">
                    <h2 class="subtitle">{{ config.heroTitle }}</h2>
                    <p class="description">{{ config.heroDesc }}</p>
                    <ul class="features-list">
                        <li class="feature-item" v-for="(f, i) in config.features" :key="i">
                            <span class="feature-dot center fff fowe7">√</span>
                            {{ f }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- 服务套餐区域 -->
        <div class="packages-section">
            <h2 class="section-title">{{ config.packagesTitle }}</h2>
            <div class="packages-grid">
                <div class="package-card" v-for="p in config.packages" :key="p.id">
                    <div class="package-image">
                        <div class="image-placeholder"></div>
                    </div>
                    <div class="package-content">
                        <h3 class="package-title">{{ p.title }}</h3>
                        <p class="package-description">{{ p.description }}</p>
                        <span class="package-price">
                            <i class="package-num">100</i>
                            <i class="package-text">¥ /人</i>
                        </span>
                        <button class="consult-btn flri" @click="openConsultationDialog">立即咨询</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 服务优势区域 -->
        <div class="advantages-section">
            <h2 class="section-title">{{ config.advantagesTitle }}</h2>
            <div class="advantages-flex">
                <div class="advantage-item" v-for="a in config.advantages" :key="a.id">
                    <div class="advantage-detail">
                        <div class="advantage-icon">
                            <!-- <i :class="a.icon"></i> -->
                            <!-- 待修改成动态值----------------------- -->
                            <img src="../assets/img/carService/carType.png" alt="车辆图片">
                        </div>
                        <h3 class="advantage-title">{{ a.title }}</h3>
                        <p class="advantage-description">{{ a.description }}</p>
                    </div>
                    <div class="advantage-condition">
                        <div class="advantage-icon">
                            <!-- <i :class="a.icon"></i> -->
                            <!-- 待修改成动态值----------------------- -->
                            <!-- v-if="condition" -->
                            <img src="../assets/img/carService/condition.png" alt="">
                        </div>
                        <h3 class="advantage-title">{{ a.conTitle }}</h3>
                        <p class="advantage-description">{{ a.conDes }}</p>
                    </div>
                </div>
                <!-- <img src="../assets/img/condition.png" alt="" style="float: left;width: 80%;height: 80%;"> -->
            </div>
        </div>
        <!-- 目前是包车服务中 -->
        <!-- 联系方式区域 -->
        <div class="contact-section">
            <h2 class="section-title">{{ config.contactTitle }}</h2>
            <p class="contact-intro">{{ config.contactIntro }}</p>
            <div class="contact-info">
                <div class="contact-item"><i class="contact-icon phone-icon"></i><span>(+61)0488 388 188</span></div>
                <div class="contact-item"><i class="contact-icon email-icon"></i><span>tto.advisory@gmail.com</span>
                </div>
                <div class="contact-item"><i class="contact-icon wechat-icon"></i><span>Tasmania Trips(欢迎加微咨询)</span>
                </div>
            </div>
        </div>

        <!-- 咨询弹窗 -->
        <ContactDialog v-model:visible="consultationDialogVisible" />
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ContactDialog from '@/components/ContactDialog.vue'

// 接收配置
const props = defineProps({
    config: { type: Object, required: true }
})

const consultationDialogVisible = ref(false)
const openConsultationDialog = () => {
    consultationDialogVisible.value = true
}

// 优先显示服务名；若未提供则回退到主标题
const titleText = computed(() => props.config?.serviceName || props.config?.heroTitle || '')
</script>

<style lang="scss" scoped>
.service-showcase {
    width: 90%;
    margin: 0 auto;
    background: #fff;
    color: #333;
    letter-spacing: 0;
    /* 全局去除字距 */

    .service-title {
        font-size: 30px;
        color: #111827;
        margin: 0 0 16px 0;
    }

    .hero-section {
        margin-bottom: 80px;
    }

    .hero-content {
        display: flex;
        gap: 40px;
        align-items: center;
    }

    .hero-image {
        flex: 0 0 50%;
        height: 400px;
        background-color: #39c5bb;
        /* 直接给容器上色，确保可见 */
        border-radius: 8px;
        overflow: hidden;
    }

    .image-placeholder {
        width: 100%;
        height: 100%;
        background-color: #39c5bb;
    }

    .hero-text {
        flex: 0 0 50%;
    }

    .subtitle {
        font-size: 28px;
        font-weight: 700;
        color: #333;
        margin-bottom: 16px;
        text-align: left;
        letter-spacing: 0;
    }

    .description {
        font-size: 16px;
        line-height: 1.8;
        color: #444;
        margin-bottom: 24px;
        text-align: left;
        letter-spacing: 0;
    }

    .features-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .feature-item {
        display: flex;
        float: none;
        align-items: center;
        margin-bottom: 12px;
        font-size: 16px;
        color: #333;
    }

    .feature-dot {
        width: 20px;
        height: 20px;
        line-height: 20px;
        font-size: 10px;
        background-color: #39c5bb;
        border-radius: 50%;
        margin-right: 12px;
        flex-shrink: 0;
    }

    .packages-section {
        margin-bottom: 80px;
    }

    .contact-section {
        background-color: #eff6ff;
        padding: 20px;
        margin-bottom: 60px;
        border-radius: 5px;
    }

    .section-title {
        font-size: 26px;
        font-weight: 700;
        color: #111;
        text-align: left;
        margin: 0 0 20px 0;
        letter-spacing: 0;
    }

    .packages-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 60px;
    }

    .package-card {
        background: #fff;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, .1);
        transition: transform .3s, box-shadow .3s;
    }

    .package-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, .15);
    }

    .package-image {
        height: 200px;
    }

    .package-content {
        padding: 24px;

        .package-price {
            .package-num {
                font-size: 24px;
                margin-right: 5px;
            }
        }
    }

    .package-title {
        font-size: 18px;
        font-weight: 700;
        color: #111;
        margin-bottom: 8px;
        letter-spacing: 0;
        text-align: left;
    }

    .package-description {
        font-size: 14px;
        color: #555;
        line-height: 1.6;
        margin-bottom: 16px;
        text-align: left;
    }

    .consult-btn {
        padding: 5px 20px;
        background: #3b82f6;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color .3s;
        margin-bottom: 20px;
    }

    .consult-btn:hover {
        background: #2563eb;
    }

    .advantages-section {
        margin-bottom: 80px;
    }

    .advantages-flex {
        display: flex;
        justify-content: space-between;
        gap: 30px;
    }

    .advantage-item {
        text-align: center;

        .advantage-condition {
            margin-top: 20px
        }
    }

    .advantage-icon {
        // width: 80px;
        // height: 80px;
        // background: #3b82f6;
        // background: url('../assets/img/carType.png') no-repeat center;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;

        img {
            width: 300px;
        }
    }

    .advantage-icon i {
        font-size: 32px;
        color: #fff;
    }

    .advantage-title {
        font-size: 16px;
        font-weight: 700;
        color: #111;
        margin-bottom: 8px;
        letter-spacing: 0;
    }

    .advantage-description {
        font-size: 13px;
        color: #555;
        line-height: 1.5;
    }

    .contact-intro {
        font-size: 14px;
        color: #555;
        text-align: left;
        margin-bottom: 20px;
    }

    .contact-info {
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-width: 600px;
    }

    .contact-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #333;
    }

    .contact-icon {
        width: 20px;
        height: 20px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
    }

    .contact-icon.phone-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'/%3E%3C/svg%3E");
    }

    .contact-icon.email-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E");
    }

    .contact-icon.wechat-icon {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M8.5 12c0 .8-.7 1.5-1.5 1.5S5.5 12.8 5.5 12s.7-1.5 1.5-1.5S8.5 11.2 8.5 12zm7 0c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5S15.5 11.2 15.5 12z'/%3E%3C/svg%3E");
    }

}

@media (min-width: 768px) and (max-width: 1024px) {
    .service-showcase {
        padding: 30px 15px;
        margin-top: 20px;
    }

    .service-showcase .hero-image {
        height: 350px;
    }

    .service-showcase .subtitle {
        font-size: 24px;
    }

    .service-showcase .packages-grid {
        grid-template-columns: repeat(1, 1fr);
        gap: 20px;
    }
}

@media (max-width: 768px) {
    .service-showcase {
        padding: 20px 15px;
        margin-top: 20px;
    }

    .service-showcase .hero-content {
        flex-direction: column;
        gap: 20px;
    }

    .service-showcase .hero-image {
        width: 100%;
        height: 250px;
        flex: none;
    }

    .service-showcase .subtitle {
        font-size: 22px;
        text-align: center;
    }

    .service-showcase .description {
        font-size: 14px;
        text-align: center;
    }

    .service-showcase .packages-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }
}

@media (max-width: 375px) {
    .service-showcase {
        padding: 15px 10px;
        margin-top: 20px;
    }

    .service-showcase .hero-image {
        height: 200px;
    }

    .service-showcase .section-title {
        font-size: 22px;
    }
}
</style>
