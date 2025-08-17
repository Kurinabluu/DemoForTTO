<script setup>
// 搜索相关数据
import { Location, Phone, Message, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import HomeView from '@/views/HomeView.vue';

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

</script>

<template>
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

        <!-- <HomeView /> -->
        <RouterView />

        <el-footer>
            <div class="footer-content">
                <!-- 关于我们 -->
                <div class="footer-section">
                    <div class="logo-section">
                        <!-- <div class="logo-circle">
                <span class="logo-text">LINGBA</span>
              </div> -->
                        <div class="company-name">TasmaniaTrips.Online</div>
                    </div>
                    <div class="about-text">
                        旅游是一种社会行为，古已有之。
                        <!-- 古今中外，史上很早就出现了旅游活动， -->
                        中国是史上最早出现旅游活动的国家之一。从春秋战国时期孔子“周游列国”到明朝徐霞客写下了《游大理日记》、《三峡》、
                        《游雁荡山日记》等等的宝贵游记。现代社会，随着世界经济的增长和科技的进步，人们出游的需求与日俱增，
                        本公司便是有感于此而创立，立意为人民的出行提供专业、
                        适宜的行程安排，提供适时又有温度的服务，提供安全、安心的保障和后勤服务。
                        诚会天下游者，祝所有游者健康、平安、喜乐、祥和、家庭幸福、旅途愉快，若是有缘，必定江湖相见，请请。
                    </div>
                    <div class="contact-info">
                        <div class="contact-item">
                            <el-icon>
                                <Location />
                            </el-icon>
                            <span>1/18 WENDOVER PLACE NEW TOWN,TASMANIA 7008 AUSTRALIA.</span>
                        </div>
                        <div class="contact-item">
                            <el-icon>
                                <Phone />
                            </el-icon>
                            <span>0488 388 188</span>
                        </div>
                        <div class="contact-item">
                            <el-icon>
                                <Message />
                            </el-icon>
                            <span>tto.operator@gmail.com</span>
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
                        <!-- 伊朗波鲁埃新建攀岩建筑项目，由"新浪潮"建筑公司承建，位于伊朗最高峰前，项目总投资约500万美元，预计明年完工。 -->
                        2025塔斯马尼亚亮点：1月杜松子酒节狂欢，4-9月惠灵顿山追极光，每周六萨拉曼卡市集淘宝。
                    </div>
                    <div class="news-date">{{ new Date().toLocaleDateString() }}</div>
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
                            <li>免责条款</li>
                            <li>隐私政策</li>
                            <li>条款与条件</li>
                        </ul>
                    </div>
                    <div class="declaration center">TasmaniaTrips.Online由TASMANIA TRIPS PTY LTD（塔斯马尼亚旅行有限公司）运营</div>
                    <div class="copyright center">© 2025 TasmaniaTrips.Online 保留所有权利。</div>
                </div>
            </div>
        </el-footer>

    </el-container>
</template>

<style lang="scss" scoped>
.clicked {
    color: #0052cc;

    border: {
        bottom: 1px #0052CC solid
    }
}

.el-container {
    min-height: 100vh;


    .el-header {
        // position: sticky;
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

                padding: {
                    top: 25px;
                }

                margin: {
                    bottom: 25px; //增加适配

                }

                text-align: left;
                // height: 400px;
                height: 420px;
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

/* 超小屏幕设备适配（iPhone 4、iPhone 5、iPhone SE等，<=375px） */
@media (max-width: 375px) {
    .el-container {
        .el-header {
            padding: 6px 8px;

            .logo {
                font-size: 16px;
            }

            .btns {
                margin-top: 4px;

                .ul-css {
                    gap: 4px;

                    li {
                        height: 36px;
                        padding: 0 4px;
                        font-size: 12px;
                    }
                }
            }
        }

        .el-footer {
            min-height: 720px;
            padding: 12px 0 12px;

            .footer-content {
                gap: 8px;
                padding: 0 8px;
            }

            .footer-section {
                padding: 6px 0;
                height: auto;

                // 第一个方块 - 关于我们
                &:first-child {
                    .logo-section {
                        margin-bottom: 12px;

                        .company-name {
                            font-size: 20px;
                        }
                    }

                    .about-text {
                        font-size: 12px;
                        line-height: 1.6;
                        margin-bottom: 12px;
                        padding-top: 12px;
                    }

                    .contact-info {
                        .contact-item {
                            margin-bottom: 6px;
                            font-size: 11px;
                            line-height: 1.4;
                            flex-wrap: wrap;

                            .el-icon {
                                margin-right: 6px;
                                font-size: 14px;
                                flex-shrink: 0;
                            }

                            span {
                                word-break: break-word;
                                hyphens: auto;
                            }
                        }
                    }
                }

                // 第二个方块 - 最新资讯
                &:nth-child(2) {
                    .section-title {
                        margin-bottom: 12px;

                        h3 {
                            font-size: 16px;
                        }
                    }

                    .news-content {
                        font-size: 12px;
                        line-height: 1.5;
                        margin-bottom: 8px;
                        padding-top: 12px;
                    }

                    .news-date {
                        font-size: 10px;
                    }
                }

                // 第三个方块 - 快速导航
                &:nth-child(3) {
                    .section-title {
                        margin-bottom: 12px;

                        h3 {
                            font-size: 16px;
                        }
                    }

                    .nav-links {
                        .nav-item {
                            font-size: 12px;
                            margin-bottom: 6px;
                            line-height: 1.3;

                            span {
                                margin-left: 4px;
                                font-size: 11px;
                            }
                        }
                    }
                }

                // 第四个方块 - 精品路线
                &:nth-child(4) {
                    .section-title {
                        margin-bottom: 12px;

                        h3 {
                            font-size: 16px;
                        }
                    }

                    .route-grid {
                        gap: 6px;
                        padding-top: 12px;

                        .route-img {
                            width: 60px;
                            height: 60px;
                        }
                    }
                }
            }

            .web-msg {
                max-width: 96%;
                margin-top: 8px;
                font-size: 10px;

                .important-msg {
                    margin-bottom: 4px;

                    ul {
                        gap: 10px;
                    }

                    li {
                        font-size: 10px;
                    }
                }
            }
        }
    }
}

/* 极超小屏幕设备适配（iPhone 4等，<=320px） */
@media (max-width: 320px) {
    .el-container {
        .el-header {
            padding: 4px 6px;

            .logo {
                font-size: 14px;
            }

            .btns {
                margin-top: 3px;

                .ul-css {
                    gap: 2px;

                    li {
                        height: 32px;
                        padding: 0 2px;
                        font-size: 11px;
                    }
                }
            }
        }

        .el-footer {
            min-height: 760px;
            padding: 8px 0 8px;

            .footer-content {
                gap: 6px;
                padding: 0 6px;
            }

            .footer-section {
                padding: 4px 0;

                // 第一个方块 - 关于我们
                &:first-child {
                    .logo-section {
                        margin-bottom: 8px;

                        .company-name {
                            font-size: 18px;
                        }
                    }

                    .about-text {
                        font-size: 11px;
                        line-height: 1.5;
                        margin-bottom: 8px;
                        padding-top: 8px;
                    }

                    .contact-info {
                        .contact-item {
                            margin-bottom: 4px;
                            font-size: 10px;
                            line-height: 1.3;

                            .el-icon {
                                margin-right: 4px;
                                font-size: 12px;
                            }

                            span {
                                word-break: break-all;
                            }
                        }
                    }
                }

                // 其他方块
                .section-title {
                    margin-bottom: 8px;

                    h3 {
                        font-size: 14px;
                    }
                }

                .news-content {
                    font-size: 11px;
                    line-height: 1.4;
                    margin-bottom: 6px;
                    padding-top: 8px;
                }

                .nav-links {
                    .nav-item {
                        font-size: 11px;
                        margin-bottom: 4px;
                        line-height: 1.2;

                        span {
                            margin-left: 2px;
                            font-size: 10px;
                        }
                    }
                }

                .route-grid {
                    gap: 4px;
                    padding-top: 8px;

                    .route-img {
                        width: 50px;
                        height: 50px;
                    }
                }
            }

            .web-msg {
                max-width: 98%;
                margin-top: 6px;
                font-size: 9px;

                .important-msg {
                    margin-bottom: 3px;

                    ul {
                        gap: 8px;
                    }

                    li {
                        font-size: 9px;
                    }
                }
            }
        }
    }
}
</style>