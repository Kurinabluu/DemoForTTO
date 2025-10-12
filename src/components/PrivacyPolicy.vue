<script setup>
import { ref, defineExpose, onMounted, onBeforeUnmount } from 'vue'

const showPrivacyPolicyDialog = ref(false)
const isMobile = ref(window.innerWidth <= 768)

const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
})

defineExpose({
    showPrivacyPolicyDialog
})
</script>

<template>
    <!-- <div> -->
    <el-dialog v-model="showPrivacyPolicyDialog" title="TTO隐私保护政策" width="800" max-width="500px" :fullscreen="isMobile"
        align-center center z-index="9500">
        <div class="policy-text">
            <div class="policy-section">
                <h2>隐私保护承诺</h2>
                <div class="policy-info">TTO深知个人信息的重要性，我们承诺以最严格的标准保护您的隐私权。本政策将清晰说明我们如何收集、使用、存储和保护您的个人信息。</div>
            </div>
            <div class="policy-section">
                <h2>第一章 信息收集范围</h2>
                <ul>
                    <li class="policy-paragraph">基础信息：姓名、联系方式、证件信息等必要预订信息</li>
                    <li class="policy-paragraph">行程偏好：饮食需求、住宿偏好、活动兴趣等个性化信息</li>
                    <li class="policy-paragraph">设备信息：IP地址、浏览器类型、设备型号等用于改善服务质量</li>
                </ul>
            </div>

            <div class="policy-section">
                <h2>第二章 信息使用原则</h2>

                <ul>
                    <li class="policy-paragraph">仅用于为您提供预订服务、行程安排和客户支持</li>
                    <li class="policy-paragraph">不会将您的个人信息分享给任何第三方，除非获得您的明确同意或法律要求</li>
                    <li class="policy-paragraph">不会用于广告或营销目的</li>
                    <li class="policy-paragraph">在获得明确同意后，用于发送个性化旅行建议和优惠信息</li>
                    <li class="policy-paragraph">用于履行法律义务和保障交易安全</li>
                </ul>
            </div>

            <div class="policy-section">
                <h2>第三章 信息共享与保护</h2>

                <h3>我们仅在必要范围内与以下第三方共享信息：</h3>
                <ul>
                    <li class="policy-paragraph">酒店、景点、交通等服务提供商</li>
                    <li class="policy-paragraph">支付处理机构和金融机构</li>
                    <li class="policy-paragraph">法律要求的政府机构</li>
                </ul>
                <h3>所有数据合作伙伴均受严格保密协议约束</h3>
                <h3>我们采取加密技术、访问控制等多重措施保护您的信息</h3>

            </div>

            <div class="policy-section">
                <h2>第四章 您的权利</h2>
                <ul>
                    <li class="policy-paragraph">若实际服务与承诺严重不符：</li>
                    <li class="policy-paragraph">更正权：要求更新或修正不准确的信息</li>
                    <li class="policy-paragraph">删除权：在法律法规允许范围内要求删除个人信息</li>
                    <li class="policy-paragraph">撤回同意权：通过客服渠道撤回已授权的信息使用</li>
                </ul>

            </div>

            <div class="policy-section">
                <h2>第五章 Cookie与追踪技术</h2>
                <ul>
                    <li class="policy-paragraph">我们使用Cookie提升网站体验</li>
                    <li class="policy-paragraph">您可通过浏览器设置管理Cookie偏好</li>
                    <li class="policy-paragraph">我们使用数据分析工具改善服务质量</li>
                </ul>
            </div>
            <div class="policy-section">
                <h2>第六章 政策更新</h2>
                <ul>
                    <li class="policy-paragraph">本政策可能随服务发展而更新</li>
                    <li class="policy-paragraph">重大变更将通过官网公告或邮件通知</li>
                    <li class="policy-paragraph">继续使用我们的服务视为接受更新后的政策</li>
                </ul>
            </div>

            <div class="contact-info">
                如对隐私政策有任何疑问，请点击“联系我们”获取更多帮助。<br>
                工作时间：周一至周五 9:00-17:00（塔斯马尼亚时间）；周一至周五 10:00-18:00（中国时间）
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="showPrivacyPolicyDialog = false">
                    确定
                </el-button>
            </div>
        </template>
    </el-dialog>
    <!-- </div> -->
</template>

<style lang="scss" scoped>
.policy-text {
    font-size: 14px;
    line-height: 1.8;
    color: #333;
    text-align: justify;
    padding: 10px 0;
    height: 600px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #dcdfe6 #f5f7fa;
}

.policy-text::-webkit-scrollbar {
    width: 6px;
}

.policy-text::-webkit-scrollbar-track {
    background: #f5f7fa;
    border-radius: 3px;
}

.policy-text::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 3px;
}

.policy-text::-webkit-scrollbar-thumb:hover {
    background: #c0c4cc;
}

.policy-section {
    margin-bottom: 20px;
}

.policy-section h2 {
    font-size: 16px;
    font-weight: bold;
    margin: 15px 0 10px 0;
    color: #1890ff;
}

.policy-section h3 {
    font-size: 15px;
    font-weight: bold;
    margin: 12px 0 8px 0;
    color: #333;
}

.policy-paragraph {
    float: none;
    margin-bottom: 8px;
    white-space: pre-wrap;
    list-style-type: disc;
    margin-left: 20px;
}

.policy-info {
    text-indent: 2em;
}

.policy-paragraph,
.policy-info {
    margin-bottom: 8px;
    white-space: pre-wrap;
}

.refund-table {
    margin: 10px 0 20px 0;
    width: 100%;
}

.refund-table th {
    background-color: #fafafa;
}

.dialog-footer {
    text-align: center;
}

.tips {
    background-color: #f0f9ff;
    border-left: 4px solid #1890ff;
    padding: 10px;
    margin: 15px 0;
    border-radius: 4px;
}

.contact-info {
    text-align: center;
    margin-top: 15px;
    color: #666;
    font-style: italic;
}

// 平板设备适配 (768px - 1024px)
@media (min-width: 769px) and (max-width: 1024px) {
    .policy-text {
        height: 600px;
        font-size: 15px;
    }
}

// 手机设备适配 (小于768px)
@media (max-width: 768px) {
    .policy-text {
        height: 100%;
        font-size: 13px;
        padding: 5px 0;
    }

    .policy-section h2 {
        font-size: 15px;
        margin: 12px 0 8px 0;
    }

    .policy-section h3 {
        font-size: 14px;
        margin: 10px 0 6px 0;
    }

    .refund-table {
        margin: 8px 0 15px 0;
    }

    .refund-table .el-table__cell {
        padding: 6px 4px;
        font-size: 12px;
    }
}

// 小屏幕手机适配 (小于480px)
@media (max-width: 480px) {
    .policy-text {
        // height: 250px;
    }

    .tips {
        padding: 8px;
    }
}
</style>