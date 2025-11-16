<script setup>
import { ref, defineExpose, onMounted, onBeforeUnmount } from 'vue'

const showTemrsDialog = ref(false)
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
    showTemrsDialog
})
</script>

<template>
    <!-- <div> -->
    <el-dialog v-model="showTemrsDialog" title="TTO服务条款与条件" width="800" max-width="500px" :fullscreen="isMobile"
        align-center center z-index="9500">
        <div class="policy-text">
            <div class="policy-section">
                <h2>一、接受条款</h2>
                <div class="policy-info">通过访问、浏览或使用TasTrips.Online（以下简称"TTO"）网站及相关服务，即表示您已阅读、理解并同意受本条款与条件的约束。</div>
            </div>

            <div class="policy-section">
                <h2>二、服务说明</h2>

                <ul>
                    <li class="policy-paragraph">TTO提供塔斯马尼亚地区旅游咨询、行程规划、票务代订、包车服务及相关旅游配套服务</li>
                    <li class="policy-paragraph">所有服务详情以官网最新公布信息为准，我们保留调整服务内容的权利</li>
                </ul>
            </div>

            <div class="policy-section">
                <h2>三、预订与付款</h2>
                <ul>
                    <li class="policy-paragraph">预订需提供准确完整的个人信息</li>
                    <li class="policy-paragraph">付款方式包括信用卡、银行转账及其他指定支付渠道</li>
                    <li class="policy-paragraph">部分服务需支付定金，余额需在指定日期前结清</li>
                </ul>
            </div>

            <div class="policy-section">
                <h2>四、取消与改期</h2>
                <ul>
                    <li class="policy-paragraph">取消政策详见单独的退款保障协议</li>
                    <li class="policy-paragraph">改期请求需至少提前7个工作日提出</li>
                    <li class="policy-paragraph">旺季期间可能适用特殊取消条款</li>
                </ul>

            </div>

            <div class="policy-section">
                <h2>五、用户责任</h2>
                <ul>
                    <li class="policy-paragraph">确保提供的信息真实有效</li>
                    <li class="policy-paragraph">遵守当地法律法规及风俗习惯</li>
                    <li class="policy-paragraph">妥善保管个人财物及旅行证件</li>
                    <li class="policy-paragraph">按时到达指定集合地点</li>
                </ul>
            </div>
            <div class="policy-section">
                <h2>六、责任限制</h2>
                <h3>因下列原因造成的损失，TTO不承担责任：</h3>
                <ul>
                    <li class="policy-paragraph">不可抗力事件（自然灾害、疫情、罢工等）</li>
                    <li class="policy-paragraph">用户自身过错或疏忽</li>
                    <li class="policy-paragraph">第三方服务提供商的责任</li>
                    <li class="policy-paragraph">用户未遵守相关指示</li>
                </ul>
                <h3>在任何情况下，TTO的赔偿责任不超过相关订单金额</h3>
            </div>
            <div class="policy-section">
                <h2>七、知识产权</h2>
                <ul>
                    <li class="policy-paragraph">网站内容、标识、设计均受版权保护</li>
                    <li class="policy-paragraph">未经授权，不得使用、复制或修改任何内容</li>
                </ul>
            </div>
            <div class="policy-section">
                <h2>八、隐私保护</h2>
                <ul>
                    <li class="policy-paragraph">个人信息处理遵循隐私政策规定</li>
                    <li class="policy-paragraph">我们采取合理措施保护用户数据安全</li>
                </ul>
            </div>
            <div class="policy-section">
                <h2>九、条款修改</h2>
                <ul>
                    <li class="policy-paragraph">我们保留修改本条款的权利</li>
                    <li class="policy-paragraph">修改后的条款将在官网公布后生效</li>
                    <li class="policy-paragraph">继续使用服务视为接受修改内容</li>
                </ul>
            </div>
            <div class="policy-section">
                <h2>十、争议解决</h2>
                <ul>
                    <li class="policy-paragraph">优先通过友好协商解决争议</li>
                    <li class="policy-paragraph">适用法律为塔斯马尼亚所在地法律</li>
                </ul>
            </div>
            <div class="contact-info">
                <span>最后更新：<i class="fowe7" style="font-style: italic;">2024年1月15日</i>&nbsp;&nbsp;</span><span>生效日期：<i
                        class="fowe7" style="font-style: italic;">2024年1月22日</i></span><br>
                工作时间：周一至周五 9:00-17:00（塔斯马尼亚时间）；周一至周五 10:00-18:00（中国时间）
                <br>请定期查阅本页面以了解条款更新情况。如有任何疑问，请点击“联系我们”获取更多帮助。
            </div>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" @click="showTemrsDialog = false">
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