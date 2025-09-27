<script setup>
import { onMounted } from 'vue';

onMounted(() => {
    window.scrollTo({
        top: 0,
        // behavior: 'smooth'
    })
})
</script>

<template>
    <div class="disclaimer">
        <div class="card">
            <h1 class="title">免责条款</h1>
            <div class="content">
                <p>
                    本网站之全部内容，不对任何本网站的使用者（以下简称使用者）构成任何的旅行建议或行程建议。使用者因浏览本网站而决定产生的旅行主意或行程主意由使用者自主判断和决定，本网站与其运营公司不对这些决定负任何责任。
                </p>
            </div>
        </div>
    </div>

</template>

<style lang="scss" scoped>
.disclaimer {
    width: 100%;
    padding: 24px 20px 40px;
    box-sizing: border-box;
}

.card {
    max-width: 1000px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    padding: 28px 32px;
    color: #333;
}

.title {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #101010;
    letter-spacing: 4px;
    position: relative;
}

.title::after {
    content: "";
    display: block;
    width: 36px;
    height: 2px;
    background-color: #609AB1;
    margin-top: 10px;
}

.content {
    margin-top: 18px;
    font-size: 16px;
    line-height: 1.9;
    color: #333;
}

.content p {
    margin: 0;
    text-align: justify;
}

/* 平板（768px-1024px） */
@media (min-width: 769px) and (max-width: 1024px) {
    .card {
        max-width: 860px;
        padding: 24px 28px;
    }

    .title {
        font-size: 22px;
        letter-spacing: 3px;
    }

    .content {
        font-size: 15px;
        line-height: 1.8;
    }
}

/* 手机（<=768px） */
@media (max-width: 768px) {
    .disclaimer {
        padding: 16px 12px 28px;
    }

    .card {
        max-width: 95vw;
        padding: 18px 16px;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
    }

    .title {
        font-size: 20px;
        letter-spacing: 2px;
    }

    .content {
        font-size: 14px;
        line-height: 1.7;
    }
}

/* 超小屏（<=375px） */
@media (max-width: 375px) {
    .card {
        padding: 16px 14px;
    }

    .title {
        font-size: 18px;
        letter-spacing: 2px;
    }

    .content {
        font-size: 13px;
        line-height: 1.6;
    }
}

/* 极小屏（<=320px） */
@media (max-width: 320px) {
    .card {
        padding: 14px 12px;
    }

    .title {
        font-size: 16px;
        letter-spacing: 1px;
    }

    .content {
        font-size: 12px;
        line-height: 1.55;
    }
}
</style>