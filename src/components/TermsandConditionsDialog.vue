<script setup>
import { ref } from 'vue'
import LegalDocShell from '@/components/LegalDocShell.vue'

defineProps({
    asPage: { type: Boolean, default: false },
})

const showTemrsDialog = ref(false)

defineExpose({
    showTemrsDialog,
})
</script>

<template>
    <LegalDocShell v-model:visible="showTemrsDialog" :as-page="asPage" title="TTO服务条款与条件">
        <div class="policy-section">
            <h2>一、接受条款</h2>
            <div class="policy-info">通过访问、浏览或使用TasTrips.Online（以下简称"TTO"）网站及相关服务，即表示你已阅读、理解并同意受本条款与条件的约束。</div>
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
            <h2>七、知识产权与内容授权</h2>
            <h3>版权归属</h3>
            <ul>
                <li class="policy-paragraph">TTO网站的整体设计、标识、图形及由TTO独立创作的原创文字、图片、视频等内容（“TTO原创内容”），其版权及相关知识产权均归TTO所有</li>
            </ul>
            <h3>第三方内容的引用</h3>
            <ul>
                <li class="policy-paragraph">为提供准确信息，本站部分事实性描述参考或引用了受许可的第三方内容。对于依据 《知识共享 署名-相同方式共享 协议》（如CC BY-SA
                    4.0）授权的第三方内容（如维基百科），我们已在具体页面中遵循其署名要求</li>
                <li class="policy-paragraph">许可证名称与链接：知识共享 署名-相同方式共享 4.0 国际许可协议（CC BY-SA 4.0），
                    <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank"
                        rel="noopener noreferrer" class="license-link-theme">https://creativecommons.org/licenses/by-sa/4.0/</a>
                </li>
            </ul>
            <h3>对你的授权与限制</h3>
            <ul>
                <li class="policy-paragraph">
                    对于TTO原创内容：你可为个人、非商业目的浏览、下载或打印。未经TTO明确书面许可，你不得出于任何商业目的复制、转载、修改或公开发布本站的TTO原创内容</li>
                <li class="policy-paragraph">对于本站引用的知识共享协议内容：你可根据该等内容原始的《知识共享 署名-相同方式共享 协议》
                    所规定的条款（包括商业使用）进行再利用，但必须遵守该协议规定的署名和相同方式共享等条件</li>
                <li class="policy-paragraph">
                    禁止混淆与滥用：在任何情况下，你均不得使用TTO的名称、Logo，或以致使他人误认为你的作品、网站或服务与TTO存在关联、赞助或认可的方式，使用本站的任何内容</li>
            </ul>
        </div>
        <div class="policy-section">
            <h2>八、隐私保护</h2>
            <ul>
                <li class="policy-paragraph">个人信息处理遵循隐私政策规定</li>
                <li class="policy-paragraph">我们采取合理措施保护用户数据安全，但无法保证互联网传输的绝对安全</li>
            </ul>
        </div>
        <div class="policy-section">
            <h2>九、条款修改</h2>
            <ul>
                <li class="policy-paragraph">我们保留不时修改本条款的权利，修改后的条款将在官网公布后生效</li>
                <li class="policy-paragraph">继续使用服务视为接受修改内容</li>
            </ul>
        </div>
        <div class="policy-section">
            <h2>十、争议解决</h2>
            <ul>
                <li class="policy-paragraph">双方应优先通过友好协商解决争议</li>
                <li class="policy-paragraph">若协商不成，本条款之解释、效力及争议解决均适用法律为塔斯马尼亚所在地法律</li>
            </ul>
        </div>
        <div class="contact-info">
            <span>最后更新：<i class="fowe7" style="font-style: italic;">2025年12月7日</i>&nbsp;&nbsp;</span><span>生效日期：<i
                    class="fowe7" style="font-style: italic;">2025年12月7日</i></span><br>
            工作时间：周一至周五 9:00-17:00（塔斯马尼亚时间）；周一至周五 10:00-18:00（中国时间）
            <br>请定期查阅本页面以了解条款更新情况。如有任何疑问，请点击“联系我们”获取更多帮助。
        </div>
    </LegalDocShell>
</template>

<style lang="scss" scoped>
.policy-section {
    margin-bottom: 20px;
}

.policy-section h2 {
    font-size: 16px;
    font-weight: bold;
    margin: 15px 0 10px 0;
    color: #33b1a3;
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

.license-link-theme {
    color: #33b1a3;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
}

.license-link-theme:hover {
    color: #279486;
}

.contact-info {
    text-align: center;
    margin-top: 15px;
    color: #666;
    font-style: italic;
}
</style>
