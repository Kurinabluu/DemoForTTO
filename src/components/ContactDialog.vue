<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Z_INDEX } from '@/constants/zIndex'
import { getAuthToken } from '@/utils/authStore'
import { isApiEnabled, submitInquiry } from '@/utils/ttoApi'
import { buildInquirySourceSection } from '@/utils/inquirySource'

const props = defineProps({
    visible: { type: Boolean, default: false },
    sourcePage: { type: String, default: '未知页面' },
    sourceModule: { type: String, default: '联系我们' },
    sourcePageKey: { type: String, default: '' },
    sourceModuleKey: { type: String, default: '' },
    sourceEntryKey: { type: String, default: '' },
    inquiryType: { type: String, default: 'contact' },
})

const emit = defineEmits(['update:visible'])

const isMobile = ref(false)
const mobileBreakpoint = 768
const inquiryFormRef = ref(null)
const inquirySubmitting = ref(false)
const inquiryForm = ref({
    contactName: '',
    phone: '',
    email: '',
    content: '',
})

const inquiryRules = {
    contactName: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
    phone: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
    content: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
}

const canSubmitInquiry = computed(() => {
    const form = inquiryForm.value
    return Boolean(form.contactName.trim() && form.phone.trim() && form.content.trim())
})

const sourceSection = computed(() => buildInquirySourceSection(
    props.sourcePageKey || props.sourcePage,
    props.sourceModuleKey || props.sourceModule,
    props.sourceEntryKey,
))

const checkDeviceType = () => {
    isMobile.value = window.innerWidth <= mobileBreakpoint
}

const handleResize = () => {
    checkDeviceType()
}

const handleClosed = () => {
    inquiryFormRef.value?.clearValidate()
    inquirySubmitting.value = false
}

const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
})

const fullscreen = computed(() => isMobile.value)

const submitContactInquiry = async () => {
    if (inquirySubmitting.value || !inquiryFormRef.value || !canSubmitInquiry.value) return

    const valid = await inquiryFormRef.value.validate().catch(() => false)
    if (!valid) return

    inquirySubmitting.value = true
    try {
        if (isApiEnabled()) {
            await submitInquiry({
                contactName: inquiryForm.value.contactName.trim(),
                phone: inquiryForm.value.phone.trim(),
                email: inquiryForm.value.email.trim(),
                inquiryType: props.inquiryType,
                sourceSection: sourceSection.value,
                sourcePageKey: props.sourcePageKey || props.sourcePage,
                sourceModuleKey: props.sourceModuleKey || props.sourceModule,
                sourceEntryKey: props.sourceEntryKey || '',
                content: inquiryForm.value.content.trim(),
            }, getAuthToken())
        }

        inquiryForm.value = { contactName: '', phone: '', email: '', content: '' }
        dialogVisible.value = false
        ElMessage.success('咨询已提交，我们会尽快联系你')
    } catch (error) {
        ElMessage.error(error?.message || '提交失败，请稍后重试')
    } finally {
        inquirySubmitting.value = false
    }
}

onMounted(() => {
    checkDeviceType()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<template>
    <el-dialog v-model="dialogVisible" title="咨询方式" :close-on-click-modal="true" align-center
        class="contact-dialog" :z-index="Z_INDEX.dialog.high" :append-to-body="true" :lock-scroll="true"
        :fullscreen="fullscreen" @closed="handleClosed">
        <div class="consultation-content">
            <div class="consultation-item">
                <i class="contact-icon phone-icon"></i>
                <div class="contact-details">
                    <div class="contact-label">电话咨询</div>
                    <div class="contact-value">(+61)0488 388 188</div>
                </div>
            </div>
            <div class="consultation-item">
                <i class="contact-icon email-icon"></i>
                <div class="contact-details">
                    <div class="contact-label">邮件咨询</div>
                    <div class="contact-value">tto.advisory@gmail.com</div>
                </div>
            </div>
            <div class="consultation-item">
                <i class="contact-icon wechat-icon"></i>
                <div class="contact-details">
                    <div class="contact-label">微信咨询</div>
                    <div class="contact-value">微信号：TasmaniaTrips</div>
                    <div class="contact-note">欢迎加微咨询（输入微信号“TasmaniaTrips”进行搜索）</div>
                </div>
            </div>
            <el-form id="contact-inquiry-form" ref="inquiryFormRef" :model="inquiryForm" :rules="inquiryRules"
                label-position="top" class="contact-inquiry-form" @submit.prevent="submitContactInquiry">
                <div class="form-title">留言咨询</div>
                <el-form-item label="联系人" prop="contactName">
                    <el-input v-model="inquiryForm.contactName" placeholder="请输入联系人" />
                </el-form-item>
                <el-form-item label="电话" prop="phone">
                    <el-input v-model="inquiryForm.phone" placeholder="请输入电话" />
                </el-form-item>
                <el-form-item label="邮箱">
                    <el-input v-model="inquiryForm.email" placeholder="邮箱（选填）" />
                </el-form-item>
                <el-form-item label="咨询内容" prop="content">
                    <el-input v-model="inquiryForm.content" type="textarea" :rows="3" placeholder="请描述您的咨询内容" />
                </el-form-item>
            </el-form>
        </div>
        <template #footer>
            <div class="contact-dialog-footer">
                <el-button type="primary" native-type="submit" form="contact-inquiry-form" :loading="inquirySubmitting"
                    :disabled="!canSubmitInquiry">
                    提交咨询
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.consultation-content .consultation-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
}

.consultation-content .consultation-item:last-child {
    border-bottom: none;
}

.contact-icon {
    width: 20px;
    height: 20px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

.contact-icon.phone-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333b1a3'%3E%3Cpath d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'/%3E%3C/svg%3E");
}

.contact-icon.email-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333b1a3'%3E%3Cpath d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/%3E%3C/svg%3E");
}

.contact-icon.wechat-icon {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2333b1a3'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'/%3E%3C/svg%3E");
}

.contact-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
}

.contact-value {
    font-size: 16px;
    color: #333;
    font-weight: 500;
}

.contact-note {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
}

.contact-inquiry-form {
    margin-top: 14px;
}

.form-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
}

.contact-dialog-footer {
    display: flex;
    justify-content: flex-end;
}
</style>
