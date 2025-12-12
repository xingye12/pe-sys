<template>
  <div class="video-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>视频管理与智能分析</span>
          <div>
            <el-button type="success" @click="uploadVisible = true">上传视频</el-button>
            <el-button type="primary" @click="handleBatchAnalyze">批量分析</el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="queryForm">
        <el-form-item label="班级">
          <el-select v-model="queryForm.classId" placeholder="请选择">
            <el-option label="全部" value="" />
            <el-option v-for="item in classList" :key="item.classId" :label="item.className" :value="item.classId" />
          </el-select>
        </el-form-item>
        <el-form-item label="分析状态">
          <el-select v-model="queryForm.status" placeholder="请选择">
            <el-option label="全部" value="" />
            <el-option label="待分析" value="pending" />
            <el-option label="分析中" value="analyzing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="videoList" v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="videoName" label="视频名称" width="200" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="studentName" label="学生" width="100" />
        <el-table-column prop="project" label="考试项目" width="120" />
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column prop="status" label="分析状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="AI评分" width="100" />
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button size="small" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" type="primary" @click="handleAnalyze(row)" :disabled="row.status === 'analyzing'">
              {{ row.status === 'completed' ? '重新分析' : '分析' }}
            </el-button>
            <el-button size="small" type="success" @click="handleViewResult(row)" v-if="row.status === 'completed'">
              查看结果
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 视频预览对话框 -->
    <el-dialog v-model="previewVisible" title="视频预览" width="800px">
      <video :src="currentVideo.url" controls style="width: 100%; max-height: 500px;" />
    </el-dialog>

    <!-- 分析结果对话框 -->
    <el-dialog v-model="resultVisible" title="AI分析结果" width="900px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="学生姓名">{{ analysisResult.studentName }}</el-descriptions-item>
        <el-descriptions-item label="考试项目">{{ analysisResult.project }}</el-descriptions-item>
        <el-descriptions-item label="AI评分">
          <el-tag size="large" :type="getScoreType(analysisResult.score)">
            {{ analysisResult.score }} 分
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="动作标准度">{{ analysisResult.accuracy }}%</el-descriptions-item>
      </el-descriptions>

      <el-divider>动作姿态分析</el-divider>
      <div class="posture-analysis">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>关键帧分析</template>
              <div ref="keyframeChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>问题统计</template>
              <div ref="issueChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-divider>技术问题列表</el-divider>
      <el-table :data="analysisResult.issues" style="width: 100%">
        <el-table-column prop="timestamp" label="时间点" width="100" />
        <el-table-column prop="issueType" label="问题类型" width="150" />
        <el-table-column prop="description" label="问题描述" />
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="suggestion" label="改进建议" />
      </el-table>

      <el-divider>综合评价</el-divider>
      <el-alert :title="analysisResult.summary" type="info" :closable="false" />
    </el-dialog>

    <!-- 视频上传对话框 -->
    <el-dialog v-model="uploadVisible" title="上传视频文件" width="600px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="班级">
          <el-select v-model="uploadForm.classId" placeholder="请选择班级" style="width: 100%">
            <el-option v-for="item in classList" :key="item.classId" :label="item.className" :value="item.classId" />
          </el-select>
        </el-form-item>
        <el-form-item label="学生">
          <el-select v-model="uploadForm.studentId" placeholder="请选择学生" style="width: 100%">
            <el-option v-for="item in studentList" :key="item.studentId" :label="item.name" :value="item.studentId" />
          </el-select>
        </el-form-item>
        <el-form-item label="考试项目">
          <el-input v-model="uploadForm.examProject" placeholder="例如：800米跑、立定跳远等" />
        </el-form-item>
        <el-form-item label="视频文件">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :file-list="uploadFileList"
            :on-change="handleFileChange"
            :limit="10"
            accept="video/*"
            multiple
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将视频文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">
                支持 mp4, avi, mov 等视频格式，单个文件不超过 500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitUpload" :loading="uploading">
          确认上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { adminApi } from '@/api'

const loading = ref(false)
const classList = ref<any[]>([])
const videoList = ref<any[]>([])
const previewVisible = ref(false)
const resultVisible = ref(false)
const currentVideo = ref<any>({})
const analysisResult = ref<any>({})
const keyframeChart = ref<HTMLElement>()
const issueChart = ref<HTMLElement>()

// 上传相关
const uploadVisible = ref(false)
const uploading = ref(false)
const uploadFileList = ref<any[]>([])
const studentList = ref<any[]>([])
const uploadForm = ref({
  classId: '',
  studentId: '',
  examProject: ''
})

const queryForm = ref({
  classId: '',
  status: ''
})

const getStatusType = (status: string) => {
  const map: any = {
    pending: 'info',
    analyzing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: any = {
    pending: '待分析',
    analyzing: '分析中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}

const getScoreType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 80) return ''
  if (score >= 60) return 'warning'
  return 'danger'
}

const getSeverityType = (severity: string) => {
  const map: any = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return map[severity] || 'info'
}

const loadVideoList = async () => {
  loading.value = true
  try {
    const res = await adminApi.getVideoList(queryForm.value)
    videoList.value = res.data || []
  } catch (error) {
    ElMessage.error('加载视频列表失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  loadVideoList()
}

const handlePreview = (row: any) => {
  currentVideo.value = row
  previewVisible.value = true
}

const handleAnalyze = async (row: any) => {
  try {
    await adminApi.analyzeVideo(row.videoId)
    ElMessage.success('视频分析任务已提交')
    loadVideoList()
  } catch (error) {
    ElMessage.error('分析失败')
  }
}

const handleBatchAnalyze = () => {
  ElMessage.info('批量分析功能开发中')
}

const handleViewResult = async (row: any) => {
  // 模拟分析结果数据
  analysisResult.value = {
    studentName: row.studentName,
    project: row.project,
    score: row.score || 85,
    accuracy: 92,
    issues: [
      { timestamp: '00:05', issueType: '起跑姿势', description: '起跑时重心偏高', severity: 'medium', suggestion: '降低重心，身体前倾' },
      { timestamp: '00:12', issueType: '摆臂动作', description: '手臂摆动幅度不足', severity: 'low', suggestion: '加大摆臂幅度' }
    ],
    summary: '整体动作较为标准，起跑和摆臂环节有改进空间。建议加强核心力量训练，提高动作协调性。'
  }
  resultVisible.value = true
  
  await nextTick()
  initCharts()
}

const initCharts = () => {
  // 关键帧分析图表
  if (keyframeChart.value) {
    const chart = echarts.init(keyframeChart.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['起跑', '加速', '途中跑', '冲刺', '终点'] },
      yAxis: { type: 'value', max: 100 },
      series: [{
        data: [85, 90, 88, 92, 95],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }]
    })
  }
  
  // 问题统计图表
  if (issueChart.value) {
    const chart = echarts.init(issueChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: [
          { value: 2, name: '起跑姿势' },
          { value: 1, name: '摆臂动作' },
          { value: 1, name: '步频节奏' }
        ]
      }]
    })
  }
}

// 上传相关方法
const handleFileChange = (file: any, files: any[]) => {
  uploadFileList.value = files
}

const loadStudentsByClass = async (classId: string) => {
  if (!classId) {
    studentList.value = []
    return
  }
  try {
    const res = await adminApi.getClassStudents(classId)
    studentList.value = res.data || []
  } catch (error) {
    ElMessage.error('获取学生列表失败')
    studentList.value = []
  }
}

const handleSubmitUpload = async () => {
  if (!uploadForm.value.classId) {
    ElMessage.warning('请选择班级')
    return
  }
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请选择要上传的视频文件')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('classId', uploadForm.value.classId)
    formData.append('examProject', uploadForm.value.examProject)

    uploadFileList.value.forEach(file => {
      formData.append('files', file.raw)
    })

    await adminApi.uploadVideos(formData)
    ElMessage.success('视频上传成功')
    uploadVisible.value = false
    uploadForm.value = { classId: '', studentId: '', examProject: '' }
    uploadFileList.value = []
    loadVideoList()
  } catch (error) {
    ElMessage.error('视频上传失败')
  } finally {
    uploading.value = false
  }
}

// 监听班级变化，加载学生列表
watch(() => uploadForm.value.classId, (newClassId) => {
  loadStudentsByClass(newClassId)
})

onMounted(() => {
  loadVideoList()
})
</script>

<style scoped lang="scss">
.video-manage {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .posture-analysis {
    margin: 20px 0;
  }
}
</style>
