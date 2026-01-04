<script setup>
// 搜索相关数据
import { Location, Phone, Message, ArrowUp, ArrowDown, ChatRound } from '@element-plus/icons-vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from '@/stores/nav';
import ComingSoonDialog from '@/components/ComingSoonDialog.vue';
import RefundPolicy from '@/components/RefundPolicy.vue';
import PrivacyPolicy from '@/components/PrivacyPolicy.vue';
import TermsandConditionsDialog from '@/components/TermsandConditionsDialog.vue';
import AboutUsDialog from '@/components/AboutUsDialog.vue';

const navStore = useNavStore();
const router = useRouter();

const comingSoonDialogRef = ref(null);
const refundPolicyRef = ref(null);
const privacyPolicyRef = ref(null);
const termsandConditionsDialogRef = ref(null);
const aboutUsDialogRef = ref(null);

// 计算属性：根据当前路由和子导航状态确定哪个导航项应该有clicked类
const activeNavItem = computed(() => {
    const currentRoute = router.currentRoute.value;
    const path = currentRoute.path;
    const subNavName = currentRoute.query.subNavName || '';

    // 只在/DemoForTTO/trips/freeinfo路径下判断
    if (path === '/DemoForTTO/trips/freeinfo') {
        if (subNavName === '特别活动') {
            return '特别推荐';
        } else if (subNavName === '景点') {
            return '网站首页';
        }
    }
    return ''; // 默认没有活动项
});

function onNavClick(event, navName = '') {
    // 获取点击的文本内容
    const textContent = event.currentTarget.textContent.trim();

    const clickedElement = event.currentTarget;
    const btnsContainer = clickedElement.closest('.btns');
    const candidates = btnsContainer.querySelectorAll('.ul-css li, i');

    // // 特别推荐：跳转到免费信息并选择"特别活动"子导航
    // if (textContent === '特别推荐') {
    //     // 保存需要选择的子导航
    //     navStore.saveSelectedSubNav('特别活动');
    //     // 跳转到免费信息页面
    //     // router.push('/DemoForTTO/trips/freeinfo');
    // }
    // // 网站首页：处理点击事件，保存子导航状态但不进行重复的路由跳转
    // else 
    // if (textContent === '网站首页') {
    //     // 保存需要选择的子导航
    //     navStore.saveSelectedSubNav('景点');
    //     // 路由跳转由模板中的RouterLink处理，这里只需要保存状态
    // }
    // // 其他导航项：弹出敬请期待对话框
    // else 
    // if (textContent === '行业新闻' || textContent === '特别推荐' || textContent === '用户注册') {
    // if (comingSoonDialogRef.value) {
    comingSoonDialogRef.value.showComingDialog = true;
    // }
    // return
    // }


    // 由于现在使用computed属性动态控制clicked类，这里不再需要手动切换类名
    // 仅保留其他必要的逻辑

}

// 联系我们弹窗
const isContactDialogVisible = ref(false)
function openContactDialog() {
    isContactDialogVisible.value = true
}
function closeContactDialog() {
    isContactDialogVisible.value = false
}
const footerModules = import.meta.glob('@/assets/img/*footer*.jpg', { eager: true });
const footerSlides = Object.values(footerModules).map((mod) => (typeof mod === 'string' ? mod : mod.default));

// 首次访问免责声明弹窗
const showDisclaimerModal = ref(false)

const acceptDisclaimer = () => {
    showDisclaimerModal.value = false
}
const rejectDisclaimer = () => {
    showDisclaimerModal.value = false
    // 尝试关闭页面，不行则跳转空白页
    window.close()
    // setTimeout(() => {
    //   if (!document.hidden) {
    //     location.replace('about:blank')
    //   }
    // }, 200)
}

// 滚动到页面顶部
function scrollToTop() {
    // 使用window.scrollTo({ behavior: 'smooth' })实现平滑滚动到顶部
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })

    // 临时禁用路由跳转后的滚动恢复
    // 1. 保存当前滚动位置为0（顶部）
    try {
        localStorage.setItem('tto_last_scroll_y', '0');
    } catch (e) {
        // ignore
    }

    // 2. 使用setTimeout确保在路由跳转完成后再次滚动到顶部
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, 100); // 延迟100ms执行
}

// 显示ComingSoonDialog
function showComingSoonDialog() {
    if (comingSoonDialogRef.value) {
        comingSoonDialogRef.value.showComingDialog = true;
    }
}
function showRefundPolicy() {
    if (refundPolicyRef.value) {
        refundPolicyRef.value.showRefundPolicyDialog = true;
    }
}
function showPrivacyPolicy() {
    if (privacyPolicyRef.value) {
        privacyPolicyRef.value.showPrivacyPolicyDialog = true;
    }
}
function showTermsandConditionsDialog() {
    if (termsandConditionsDialogRef.value) {
        termsandConditionsDialogRef.value.showTemrsDialog = true;
    }
}
function showAboutUsDialog() {
    if (aboutUsDialogRef.value) {
        aboutUsDialogRef.value.showAboutUsDialog = true;
    }
}

// 组件挂载时检查是否首次访问
onMounted(() => {
    // 检查是否是首次访问
    if (navStore.isFirstVisit()) {
        // 首次访问，显示免责声明
        showDisclaimerModal.value = true
    }
})
</script>

<template>
    <el-container>
        <el-header class="fs15 bgfff">
            <span class="logo fowe7 no-select pointer">
                <!-- <RouterLink to="/DemoForTTO/trips/freeinfo"> -->
                <RouterLink to="/DemoForTTO/service/car">
                    <img src="@/assets/img/header_logo.png" alt="TasTrips.Online" class="logo-img logo-desktop" onerror="this.onerror=null; this.style.display='none'; 
                                 const span=document.createElement('span'); 
                                 span.innerText='TasTrips.Online'; 
                                 span.style.display='inline-block'; 
                                 span.style.height='100%'; 
                                 span.style.color='#101010'; 
                                 span.style.fontWeight='700';
                                 // 根据屏幕宽度设置响应式样式
                                 const isMobile = window.innerWidth <= 768;
                                 span.style.lineHeight=isMobile ? '32px' : '48px'; 
                                 span.style.fontSize=isMobile ? '18px' : '20px'; 
                                 this.parentNode.appendChild(span);" />
                </RouterLink>
            </span>
            <span class="btns no-select">
                <ul class="ul-css fs16 clearfix">
                    <li class="pointer" @click="showAboutUsDialog">关于我们</li>
                    <li class="pointer dropdown">
                        <el-dropdown class="language-dropdown">
                            <span class="el-dropdown-link">
                                语言/語言/LANGUAGE<el-icon class="el-icon--right"><arrow-down /></el-icon>
                            </span>
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item>中文简体</el-dropdown-item>
                                    <el-dropdown-item disabled>中文繁體</el-dropdown-item>
                                    <el-dropdown-item disabled>ENGLISH</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </li>
                    <!-- <li class="pointer" :class="{ clicked: activeNavItem === '网站首页' }"
                        @click="onNavClick($event, '网站首页');">
                        <RouterLink :to="{ path: '/DemoForTTO/trips/freeinfo', query: { subNavName: '景点' } }">网站首页
                        <RouterLink :to="{ path: '/DemoForTTO/service/car' }" @click="scrollToTop()">网站首页
                        </RouterLink>
                    </li> -->
                    <!-- 特别推荐页面考虑跳转【免费信息】中的"特别活动" -->
                    <!-- <li class="pointer" :class="{ clicked: activeNavItem === '特别推荐' }" @click="onNavClick($event);">
                        <RouterLink :to="{ path: '/DemoForTTO/trips/freeinfo', query: { subNavName: '特别活动' } }">特别推荐
                        </RouterLink>
                    </li> -->
                    <!-- <li class="pointer" @click="onNavClick($event)">特别推荐</li> -->
                    <li class="pointer" @click="onNavClick($event)">付款与退款</li>
                    <li class="pointer" @click="onNavClick($event)">用户注册/登录</li>
                    <li class="pointer" @click="onNavClick($event)">成为会员</li>
                    <!-- <li class="pointer" @click="onNavClick($event)"><RouterLink to="/DemoForTTO/service">八大服务</RouterLink></li> -->
                    <!-- <li class="pointer" @click="onNavClick($event); openContactDialog()">联系我们</li> -->
                    <li class="pointer" @click="openContactDialog()">联系我们</li>
                </ul>
                <!-- <i class="flri pointer" @click="onNavClick">Operating By WorldTrips.Online</i> -->
            </span>
        </el-header>

        <!-- <HomeView /> -->
        <RouterView />
        <ComingSoonDialog ref="comingSoonDialogRef" />
        <AboutUsDialog ref="aboutUsDialogRef" />

        <!-- 联系我们弹窗 -->
        <el-dialog v-model="isContactDialogVisible" append-to-body align-center width="520px" class="contact-dialog"
            @close="closeContactDialog">
            <template #header>
                <div style="font-weight:700; letter-spacing:2px; color:#3dc7be;">联系我们</div>
            </template>
            <div class="contact-modal">
                <div class="contact-modal-info">
                    <div class="item">
                        <el-icon>
                            <Phone />
                        </el-icon>
                        <span>电话：0488 388 188</span>
                    </div>
                    <div class="item">
                        <el-icon>
                            <Message />
                        </el-icon>
                        <span>邮箱：tto.operator@gmail.com（24 小时受理）</span>
                    </div>
                    <div class="item">
                        <el-icon>
                            <i></i>
                        </el-icon>
                        <span>地址：1/18 WENDOVER PLACE NEW TOWN, TAS 7008, Australia</span>
                    </div>
                </div>
            </div>
            <template #footer>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <!-- <el-button @click="closeContactDialog">关闭</el-button> -->
                    <el-button type="primary" @click="closeContactDialog">确定</el-button>
                </div>
            </template>
        </el-dialog>

        <el-footer>
            <div class="footer-content">
                <!-- 关于我们 -->
                <div class="footer-section">
                    <div class="logo-section">
                        <!-- <div class="logo-circle">
                <span class="logo-text">LINGBA</span>
              </div> -->
                        <div class="company-name"><img src="@/assets/img/header_logo.png" alt="TasTrips.Online"
                                class="logo-img logo-desktop" /></div>
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
                            <span>(+61)0488 388 188</span>
                        </div>
                        <div class="contact-item">
                            <el-icon>
                                <Message />
                            </el-icon>
                            <!-- <span>tto.operator@gmail.com（业务用邮箱）</span> -->
                            <span>tto.advisory@gmail.com（咨询用邮箱）</span>
                        </div>
                        <div class="contact-item">
                            <el-icon>
                                <ChatRound />
                            </el-icon>
                            <!-- <span>tto.operator@gmail.com（业务用邮箱）</span> -->
                            <span>TasmaniaTrips（欢迎添加微信咨询）</span>
                        </div>
                        <!-- <div class="contact-item">
                            <el-icon />
                            <span>tto.advisory@gmail.com（咨询用邮箱）</span>
                        </div> -->
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
                        <div class="nav-item">
                            <RouterLink to="/DemoForTTO/service/car" @click="scrollToTop()">
                                <!-- <RouterLink :to="{ path: '/DemoForTTO/trips/freeinfo', query: { subNavName: '景点' } }"
                                @click="navStore.saveSelectedSubNav('景点'); scrollToTop()">
                                网站首页 <span>Home</span>
                            </RouterLink> -->
                                <!-- <RouterLink :to="{ path: '/DemoForTTO/trips/freeinfo' }" @click="scrollToTop()"> -->
                                网站首页 <span>Home</span>
                            </RouterLink>
                        </div>
                        <div class="nav-item" @click="showComingSoonDialog">
                            <!-- <RouterLink :to="{ path: '/DemoForTTO/trips/oneday', query: { dayTripTab: '景点一日游' } }"
                                @click="navStore.saveSelectedSubNav('景点一日游'); scrollToTop()">
                                精品路线 <span>Tourist route</span>
                            </RouterLink> -->
                            精品路线 <span>Tourist route</span>
                        </div>
                        <div class="nav-item">
                            <!-- <RouterLink to="/DemoForTTO/service/ticket" @click="scrollToTop()"> -->
                            <RouterLink to="/DemoForTTO/service/car" @click="scrollToTop()">
                                八大服务 <span>Service</span>
                            </RouterLink>
                        </div>
                        <div class="nav-item" @click="showAboutUsDialog">关于我们 <span>About
                                us</span></div>
                        <div class="nav-item" @click="openContactDialog">联系我们 <span>Contact us</span></div>
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
                            <img :src="src" alt="route" class="route-img" @click="showComingSoonDialog" />
                        </div>
                    </div>
                </div>
                <div class="web-msg">
                    <div class="important-msg">
                        <ul>
                            <li @click="showRefundPolicy">退款政策</li>
                            <li @click="showDisclaimerModal = true">
                                <!-- showDisclaimerModal -->
                                <!-- <RouterLink to="/DemoForTTO/disclaimer">免责条款</RouterLink> -->
                                免责条款
                            </li>
                            <li @click="showPrivacyPolicy">隐私政策</li>
                            <li @click="showTermsandConditionsDialog">条款与条件</li>
                        </ul>
                    </div>
                    <div class="declaration center">TasTrips.Online由TASMANIA TRIPS PTY LTD（塔斯马尼亚旅行有限公司）运营</div>
                    <div class="copyright center">© 2025 TasTrips.Online 保留所有权利。</div>
                </div>
            </div>
        </el-footer>

        <!-- 免责声明弹窗 -->
        <el-dialog v-model="showDisclaimerModal" align-center width="520px" :close-on-click-modal="false"
            :show-close="false" :append-to-body="true" :lock-scroll="true">
            <template #header>
                <div style="font-weight:700; letter-spacing:2px; color:#3dc7be;">免责条款提示</div>
            </template>
            <div style="color:#333; line-height:1.8; text-align:justify;">
                【免责条款】本网站之全部内容，不对任何本网站的使用者（以下简称使用者）构成任何的旅行建议或行程建议。
                使用者因浏览本网站而决定产生的旅行主意或行程主意由使用者自主判断和决定，本网站与其运营公司不对这些决定负任何责任。
            </div>
            <template #footer>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <el-button type="primary" @click="acceptDisclaimer">确定</el-button>
                </div>
            </template>
        </el-dialog>
        <!-- 退款政策弹窗 -->
        <RefundPolicy ref="refundPolicyRef" />
        <!-- 隐私政策弹窗 -->
        <PrivacyPolicy ref="privacyPolicyRef" />
        <!-- 条款与条件弹窗 -->
        <TermsandConditionsDialog ref="termsandConditionsDialogRef" />
    </el-container>
</template>

<style lang="scss">
.el-header .ul-css .el-dropdown {
    // position: relative;
    color: #111;
    font-size: 16px;
}

.el-dropdown-menu {
    z-index: 3000 !important;
}
</style>
<style lang="scss" scoped>
.clicked {
    color: #2da099;
    border-bottom: 1px #2da099 solid
}

// 使用hover样式替代点击切换类名
.ul-css li {
    transition: all 0.3s ease;
    cursor: pointer;
}

.ul-css li:not(.dropdown):hover {
    color: #2da099;
    border-bottom: 1px #2da099 solid;
}

.el-container {
    min-height: 100vh;


    .el-header {
        position: sticky;
        top: 0;
        height: 70px;
        line-height: 70px;
        // background-color: #39c5bb;
        z-index: 2000;
        overflow: visible;

        .logo,
        .btns {
            text-align: center;
        }

        .logo {
            // font-size: 24px;

            .logo-img {
                width: 200px;
                vertical-align: middle;
            }
        }

        .btns {
            position: absolute;
            right: 40px;
            color: #111;

            .ul-css {
                // display: inline-block;

                li {
                    float: left;
                    // width: 70px;
                    // min-width: 70px;
                    // float: none;
                    height: 55px;
                    margin-left: 30px;
                }
            }

            i {
                display: inline-block;
                height: 40px;
                line-height: 70px;
                font-size: 14px;
            }
        }

    }

    .el-footer {
        // height: 620px;
        height: auto;
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
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                height: 420px;
                border-radius: 10px;
                text-align: left;
                // height: 400px;

                padding: {
                    top: 25px;
                }

                // 第一个方块 - 关于我们
                &:first-child {
                    // .logo-section {
                    //     // margin-bottom: 20px;
                    // }

                    .about-text {
                        flex: 1;
                        margin-bottom: 10px;
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

                    .company-name {
                        // font-size: 25px;
                        font-weight: bold;
                        font-style: italic;

                        .logo-img {
                            width: 215px;
                            margin-top: -15px;
                            vertical-align: middle;
                        }
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
                            color: #3dc7be;
                        }

                        i {
                            width: 1em;
                            height: 1em;
                        }

                        i:last-child {
                            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M8.5 12c0 .8-.7 1.5-1.5 1.5S5.5 12.8 5.5 12s.7-1.5 1.5-1.5S8.5 11.2 8.5 12zm7 0c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5S15.5 11.2 15.5 12z'/%3E%3C/svg%3E");
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
                        background-color: #3dc7be;
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
                    color: #3dc7be;
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
                            color: #2da099;
                        }

                        // 英文部分使用指定颜色
                        span {
                            color: #3dc7be;
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

                    a:hover {
                        color: #111827
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

/* 联系我们弹窗样式 */
.contact-modal {
    color: #333;

    .contact-modal-info {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;

            .el-icon {
                font-size: 18px;
                color: #3dc7be;
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
            // min-height: 620px;

            .footer-content {
                grid-template-columns: 1fr 1fr;
                // gap: 24px;
                gap: 80px 24px;
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
            padding: 8px 0 12px 8px;

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
                    justify-content: space-evenly;
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
            // min-height: 680px;
            padding: 16px 0 16px;

            .footer-content {
                grid-template-columns: 1fr;
                gap: 90px;
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
            // min-height: 720px;
            padding: 12px 0 12px;

            .footer-content {
                gap: 20px;
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
                                color: #3dc7be;
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
            // min-height: 760px;
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

                            i {
                                width: 1em;
                                height: 1em;
                                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M8.5 12c0 .8-.7 1.5-1.5 1.5S5.5 12.8 5.5 12s.7-1.5 1.5-1.5S8.5 11.2 8.5 12zm7 0c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5.7-1.5 1.5-1.5S15.5 11.2 15.5 12z'/%3E%3C/svg%3E");
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

// 联系我们弹窗
@media (max-width: 375px) {
    :deep(.contact-dialog) {
        .el-dialog__body {
            padding: 12px 14px !important;
        }

    }
}

@media (min-width: 376px) and (max-width:768px) {
    :deep(.contact-dialog) {
        .el-dialog__body {
            height: 88%;
        }
    }
}

@media (max-width: 375px) {
    :deep(.contact-dialog) {
        .el-dialog__body {
            height: 85%;
        }
    }
}

@media (max-width: 320px) {
    :deep(.contact-dialog) {
        .el-dialog__body {
            height: 80%;
        }
    }
}

// :deep(.contact-dialog) {
//     // .el-dialog {
//     // width: 400px;
//     // }

//     // :deep(.el-dialog__wrapper) {
//     //     display: flex;
//     //     align-items: center;
//     //     justify-content: center;
//     // }

//     // .el-dialog__footer {
//     //     text-align: right !important;
//     // }

//     @media (max-width:768px) {
//         .el-dialog__body {
//             height: 80%;
//         }
//     }</style>