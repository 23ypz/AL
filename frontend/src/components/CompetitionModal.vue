<template>
  <div class="competition-modal-overlay">
    <div class="competition-modal">
      <header class="modal-header">
        <h2>{{ isEdit ? '编辑竞赛' : '新增竞赛' }}</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </header>
      
      <form class="modal-content" @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-group">
            <label>竞赛名称 *</label>
            <input v-model="formData.name" type="text" required />
          </div>
          
          <div class="form-group">
            <label>竞赛级别 *</label>
            <select v-model="formData.level" required>
              <option value="">请选择</option>
              <option value="A">A类 - 国家级重大赛事</option>
              <option value="B">B类 - 国家级一般赛事</option>
              <option value="C">C类 - 省级赛事</option>
              <option value="D">D类 - 校级赛事</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>竞赛类别 *</label>
            <input v-model="formData.category" type="text" required />
          </div>
          
          <div class="form-group">
            <label>主办方 *</label>
            <input v-model="formData.organizer" type="text" required />
          </div>
          
          <div class="form-group">
            <label>承办方</label>
            <input v-model="formData.co_organizer" type="text" />
          </div>
          
          <div class="form-group">
            <label>举办时间</label>
            <input v-model="formData.event_time" type="text" />
          </div>
          
          <div class="form-group">
            <label>报名时间</label>
            <input v-model="formData.registration_time" type="text" />
          </div>
          
          <div class="form-group">
            <label>参赛对象</label>
            <input v-model="formData.target_participants" type="text" />
          </div>
          
          <div class="form-group">
            <label>学历要求</label>
            <input v-model="formData.education_requirement" type="text" />
          </div>
          
          <div class="form-group">
            <label>组队要求</label>
            <input v-model="formData.team_requirement" type="text" />
          </div>
          
          <div class="form-group">
            <label>报名费用</label>
            <input v-model="formData.registration_fee" type="text" />
          </div>
          
          <div class="form-group">
            <label>官方网站</label>
            <input v-model="formData.official_website" type="url" />
          </div>
          
          <div class="form-group">
            <label>联系邮箱</label>
            <input v-model="formData.contact_email" type="email" />
          </div>
          
          <div class="form-group">
            <label>联系电话</label>
            <input v-model="formData.contact_phone" type="text" />
          </div>
          
          <div class="form-group">
            <label>获奖比例</label>
            <input v-model="formData.award_ratio" type="text" />
          </div>
          
          <div class="form-group">
            <label>参赛规模</label>
            <input v-model="formData.participant_scale" type="text" />
          </div>
          
          <div class="form-group">
            <label>参赛高校</label>
            <input v-model="formData.participating_universities" type="text" />
          </div>
          
          <div class="form-group">
            <label>增长趋势</label>
            <input v-model="formData.growth_trend" type="text" />
          </div>
          
          <div class="form-group">
            <label>热度评分 (0.0-10.0)</label>
            <input v-model="formData.popularity_score" type="number" min="0" max="10" step="0.1" />
          </div>
        </div>
        
        <!-- 文本域字段 -->
        <div class="form-group full-width">
          <label>竞赛简介</label>
          <textarea v-model="formData.description" rows="3"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>竞赛形式</label>
          <textarea v-model="formData.competition_format" rows="3"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>知识领域</label>
          <textarea v-model="formData.knowledge_areas" rows="3"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>技术技能</label>
          <textarea v-model="formData.technical_skills" rows="3"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>竞赛流程</label>
          <textarea v-model="formData.competition_process" rows="3"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>评审标准</label>
          <textarea v-model="formData.evaluation_criteria" rows="3"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>奖项设置</label>
          <textarea v-model="formData.award_settings" rows="3"></textarea>
        </div>
        
        <div class="form-group full-width">
          <label>历年题目</label>
          <textarea v-model="formData.historical_topics" rows="3"></textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" class="secondary" @click="handleClose">取消</button>
          <button type="submit" class="primary" :disabled="loading">
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  competition: Object,
  isEdit: Boolean
});

const emit = defineEmits(['close', 'save']);

const loading = ref(false);
const formData = reactive({
  name: '',
  level: '',
  category: '',
  description: '',
  organizer: '',
  co_organizer: '',
  official_website: '',
  contact_email: '',
  contact_phone: '',
  event_time: '',
  registration_time: '',
  duration: '',
  target_participants: '',
  education_requirement: '',
  team_requirement: '',
  registration_fee: '',
  technical_requirements: '',
  competition_format: '',
  knowledge_areas: '',
  technical_skills: '',
  competition_process: '',
  evaluation_criteria: '',
  award_settings: '',
  award_ratio: '',
  participant_scale: '',
  participating_universities: '',
  historical_topics: '',
  growth_trend: '',
  popularity_score: 0.0
});

// 如果是编辑模式，填充数据
watch(() => props.competition, (comp) => {
  if (comp && props.isEdit) {
    Object.assign(formData, comp);
  }
}, { immediate: true });

function handleClose() {
  emit('close');
}

async function handleSubmit() {
  loading.value = true;
  try {
    emit('save', { ...formData });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.competition-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.competition-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.5rem;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background: #f3f4f6;
    }
  }
}

.modal-content {
  padding: 24px;

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 20px;

    &.full-width {
      grid-column: span 2;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #374151;
      font-size: 0.9rem;
    }

    input, select, textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: #3b82f6;
      }
    }

    textarea {
      resize: vertical;
      min-height: 80px;
    }
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;

    button {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &.primary {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        color: white;

        &:hover:not(:disabled) {
          opacity: 0.9;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;

        &:hover {
          background: #e5e7eb;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .competition-modal-overlay {
    padding: 16px;
  }

  .competition-modal {
    width: 100%;
    max-width: none;
    max-height: 95vh;
  }

  .modal-content {
    padding: 20px;

    .form-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .form-group.full-width {
      grid-column: span 1;
    }

    .form-actions {
      flex-direction: column;

      button {
        width: 100%;
      }
    }
  }
}
</style>
