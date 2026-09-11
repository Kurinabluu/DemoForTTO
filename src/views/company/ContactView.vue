<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  COMPANY,
} from '@/data/companyProfile'
import { buildInquirySourceSection } from '@/utils/inquirySource'
import { getAuthToken } from '@/utils/authStore'
import { isApiEnabled, submitInquiry } from '@/utils/ttoApi'
import { notifyApiError, notifySuccess } from '@/utils/apiFeedback'

const route = useRoute()

const inquiryFormRef = ref(null)
const inquirySubmitting = ref(false)
const inquiryForm = ref({
  contactName: '',
  phone: '',
  email: '',
  inquiryType: '',
  content: '',
})

async function resetInquiryForm() {
  inquiryFormRef.value?.resetFields()
  await nextTick()
  inquiryFormRef.value?.clearValidate()
}

const inquiryRules = {
  contactName: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
  phone: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
  inquiryType: [{ required: true, message: '请选择咨询类型', trigger: 'blur' }],
  content: [{ required: true, message: '该项不能为空', trigger: 'blur' }],
}

const canSubmitInquiry = computed(() => {
  const form = inquiryForm.value
  return Boolean(form.contactName.trim() && form.phone.trim() && form.inquiryType.trim() && form.content.trim())
})

const inquiryTypeOptions = [
  { label: '一日游 / 多日游', value: '一日游 / 多日游' },
  { label: '门票 / 热门项目', value: '门票 / 热门项目' },
  { label: '包车 / 商务接送', value: '包车 / 商务接送' },
  { label: '定制 / 地陪 / 管家', value: '定制 / 地陪 / 管家' },
  { label: '退款 / 改期 / 售后', value: '退款 / 改期 / 售后' },
  { label: '其他', value: '其他' },
]

const contactFaqs = [
  {
    q: '你们的工作时间是几点？',
    a: `${COMPANY.hoursAu}；${COMPANY.hoursCn}。`,
  },
  {
    q: '一般多久会回复？',
    a: '我们会尽量在工作时间内优先处理。内容较多时可能需要核对后再回复。',
  },
  {
    q: '如果我只是先了解，不是马上下单，也可以留言吗？',
    a: '可以。你可以先写想了解的内容，我们会根据留言继续和你沟通。',
  },
]

const sourceSection = buildInquirySourceSection('contact-page', 'contact-form', 'hero')

async function submitContactInquiry() {
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
        inquiryType: inquiryForm.value.inquiryType.trim(),
        sourceSection,
        sourcePageKey: 'contact-page',
        sourceModuleKey: 'contact-form',
        sourceEntryKey: route.query.from ? String(route.query.from) : 'hero',
        content: inquiryForm.value.content.trim(),
      }, getAuthToken())
    }

    await resetInquiryForm()
    notifySuccess('咨询已提交，我们会尽快联系你')
  } catch (error) {
    notifyApiError(error, { action: '提交咨询' })
  } finally {
    inquirySubmitting.value = false
  }
}
</script>

<template>
  <article class="company-doc contact-page">
    <header class="hero">
      <h1>联系我们</h1>
      <p class="lead">
        如果你对网站内容、服务项目或咨询方式有疑问，欢迎通过电话、邮箱、微信或留言表单联系我们。
      </p>
    </header>

    <section class="panel panel--info">
      <h2>快速联系</h2>
      <dl class="facts contact-facts">
        <div>
          <dt>电话</dt>
          <dd>{{ COMPANY.phone }}</dd>
        </div>
        <div>
          <dt>邮箱</dt>
          <dd>{{ COMPANY.email }}</dd>
        </div>
        <div>
          <dt>微信</dt>
          <dd>{{ COMPANY.wechat }}</dd>
        </div>
        <div>
          <dt>地址</dt>
          <dd>1/18 WENDOVER PLACE NEW TOWN, TAS 7008, Australia</dd>
        </div>
      </dl>
    </section>

    <section class="panel">
      <h2>留言咨询</h2>
      <el-form ref="inquiryFormRef" :model="inquiryForm" :rules="inquiryRules" label-position="top" class="contact-form"
        @submit.prevent="submitContactInquiry">
        <el-form-item label="咨询类型" prop="inquiryType">
          <el-select v-model="inquiryForm.inquiryType" placeholder="请选择咨询类型" class="w100">
            <el-option v-for="option in inquiryTypeOptions" :key="option.value" :label="option.label"
              :value="option.value" />
          </el-select>
        </el-form-item>
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
          <el-input v-model="inquiryForm.content" type="textarea" :rows="4"
            placeholder="请描述您的需求，例如：日期、人数、出发地、想问的服务内容" />
        </el-form-item>
        <div class="contact-form__actions">
          <el-button type="primary" native-type="submit" :loading="inquirySubmitting" :disabled="!canSubmitInquiry">
            提交咨询
          </el-button>
        </div>
      </el-form>
    </section>

    <section class="panel">
      <h2>常见问题</h2>
      <ul class="faq-list">
        <li v-for="faq in contactFaqs" :key="faq.q" class="faq-item">
          <div class="faq-q">{{ faq.q }}</div>
          <div class="faq-a">{{ faq.a }}</div>
        </li>
      </ul>
    </section>

  </article>
</template>

<style lang="scss" scoped>
.company-doc {
  width: 90%;
  box-sizing: border-box;
  margin: 24px auto 72px;
  color: #333;
  line-height: 1.8;
}

.hero {
  margin-bottom: 24px;
  padding: 8px 0 18px;
  border-bottom: 1px solid #edf2f1;
}

.hero h1 {
  margin: 0 0 10px;
  font-size: 38px;
  line-height: 1.2;
  color: #111827;
}

.lead {
  max-width: 820px;
  margin: 0;
  color: #4b5563;
  font-size: 17px;
}

.panel {
  margin-bottom: 28px;
}

.panel h2 {
  margin: 0 0 14px;
  font-size: 24px;
  line-height: 1.3;
  color: #1a7a6f;
}

.panel--info,
.panel--scenarios {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.facts {
  display: grid;
  gap: 12px;
  margin: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.facts div {
  display: grid;
  gap: 4px;
  align-items: start;
  padding: 14px 16px;
  border: 1px solid #e5efec;
  border-radius: 5px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

dt {
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0;
  color: #33b1a3;
}

dd {
  margin: 0;
  color: #111827;
  font-size: 17px;
  line-height: 1.6;
}

.scenario-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.scenario-card {
  position: relative;
  padding: 16px 16px 14px 18px;
  border: 1px solid #e5efec;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  overflow: hidden;
}

.scenario-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #33b1a3 0%, #1a7a6f 100%);
}

.scenario-card__title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 6px;
}

.scenario-card__desc,
.scenario-card__hint,
.contact-note,
.faq-a {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
}

.scenario-card__hint {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 5px;
  background: #f7fbfa;
  border: 1px solid #e5efec;
  color: #334155;
}

.contact-note {
  color: #4b5563;
  margin-bottom: 16px;
  font-size: 16px;
}

.contact-form {
  max-width: 100%;
  padding: 18px 18px 10px;
  border: 1px solid #e4ecea;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.contact-form__actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 12px;
}

.contact-form :deep(.el-form-item__label) {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.contact-form :deep(.el-input__wrapper),
.contact-form :deep(.el-textarea__inner) {
  font-size: 15px;
}

.contact-form :deep(.el-button) {
  font-size: 15px;
  font-weight: 600;
}

.faq-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.faq-item {
  padding: 14px 0;
  border-bottom: 1px solid #edf2f1;
}

.faq-item:last-child {
  border-bottom: 0;
}

.faq-q {
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.faq-a {
  color: #4b5563;
}

@media (max-width: 767px) {
  .company-doc {
    width: 92%;
    margin: 18px auto 56px;
  }

  .hero h1 {
    font-size: 30px;
  }

  .facts {
    grid-template-columns: 1fr;
  }

  .facts div {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .scenario-list {
    grid-template-columns: 1fr;
  }
}
</style>
