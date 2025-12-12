<template>
  <div class="class-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>班级管理</span>
          <div>
            <el-button type="success" @click="handleAddClass">添加班级</el-button>
            <el-button type="primary" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="classList" style="width: 100%" v-loading="loading">
        <el-table-column prop="className" label="班级名称" width="180" />
        <el-table-column prop="grade" label="年级" width="120" />
        <el-table-column prop="teacherName" label="班主任" width="150" />
        <el-table-column prop="studentCount" label="学生人数" width="120" />
        <el-table-column prop="avgScore" label="平均成绩" width="120" />
        <el-table-column prop="passRate" label="及格率" width="120">
          <template #default="{ row }">{{ row.passRate }}%</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button size="small" type="primary" @click="handlePublishTask(row)">发布任务</el-button>
            <el-button size="small" type="danger" @click="handleDeleteClass(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 班级详情对话框 -->
    <el-dialog v-model="detailVisible" title="班级详情" width="80%">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="学生列表" name="students">
          <el-table :data="studentList" style="width: 100%">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="studentId" label="学号" />
            <el-table-column prop="classId" label="班级" />
            <el-table-column prop="teacherName" label="班主任" />
            <el-table-column label="性别">
              <template #default="{ row }">
                <span>{{ row.studentId % 2 === 0 ? '女' : '男' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="考试任务" name="tasks">
          <el-table :data="taskList" style="width: 100%">
            <el-table-column prop="taskName" label="任务名称" />
            <el-table-column prop="project" label="考试项目" />
            <el-table-column prop="startTime" label="开始时间" />
            <el-table-column prop="endTime" label="结束时间" />
            <el-table-column prop="status" label="状态" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 发布任务对话框 -->
    <el-dialog v-model="taskVisible" title="发布考试任务" width="600px">
      <el-form :model="taskForm" label-width="100px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.taskName" />
        </el-form-item>
        <el-form-item label="考试项目">
          <el-select v-model="taskForm.projects" multiple placeholder="请选择">
            <el-option label="50米跑" value="50m" />
            <el-option label="800米跑" value="800m" />
            <el-option label="立定跳远" value="jump" />
            <el-option label="仰卧起坐" value="situp" />
            <el-option label="跳绳" value="rope" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="taskForm.startTime" type="datetime" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="taskForm.endTime" type="datetime" />
        </el-form-item>
        <el-form-item label="任务说明">
          <el-input v-model="taskForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitTask">发布</el-button>
      </template>
    </el-dialog>

    <!-- 添加班级对话框 -->
    <el-dialog v-model="classDialogVisible" title="添加班级" width="500px">
      <el-form :model="classForm" :rules="classRules" ref="classFormRef" label-width="80px">
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="classForm.className" placeholder="请输入班级名称，如：初一1班" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="classForm.grade" placeholder="请选择年级" style="width: 100%">
            <el-option label="初一" value="初一" />
            <el-option label="初二" value="初二" />
            <el-option label="初三" value="初三" />
            <el-option label="高一" value="高一" />
            <el-option label="高二" value="高二" />
            <el-option label="高三" value="高三" />
          </el-select>
        </el-form-item>
        <el-form-item label="班主任" prop="teacherId">
          <el-select v-model="classForm.teacherId" placeholder="请选择班主任" style="width: 100%">
            <el-option v-for="item in teacherList" :key="item.teacherId" :label="item.name" :value="item.teacherId" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="classDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitClass" :loading="submitting">
          添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api'

const loading = ref(false)
const classList = ref([])
const detailVisible = ref(false)
const taskVisible = ref(false)
const classDialogVisible = ref(false)
const activeTab = ref('students')
const classDetail = ref<any>(null)
const studentList = ref([])
const taskList = ref([])
const currentClass = ref<any>(null)
const teacherList = ref([])
const submitting = ref(false)

const taskForm = ref({
  taskName: '',
  projects: [],
  startTime: '',
  endTime: '',
  description: ''
})

const classForm = ref({
  className: '',
  grade: '',
  teacherId: ''
})

const classRules = {
  className: [
    { required: true, message: '请输入班级名称', trigger: 'blur' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  teacherId: [
    { required: true, message: '请选择班主任', trigger: 'change' }
  ]
}

const classFormRef = ref()

const loadClassList = async () => {
  loading.value = true
  try {
    const res = await adminApi.getClassList()
    classList.value = res.data || []
  } catch (error) {
    ElMessage.error('加载班级列表失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadClassList()
}

const handleAddClass = () => {
  classForm.value = {
    className: '',
    grade: '',
    teacherId: ''
  }
  classDialogVisible.value = true
  loadTeacherList()
}

const loadTeacherList = async () => {
  try {
    // 直接从teacher表获取所有教师
    const res = await adminApi.getTeacherList()
    teacherList.value = res.data || []
  } catch (error) {
    console.error('获取教师列表失败:', error)
    ElMessage.error('获取教师列表失败')
  }
}

const handleSubmitClass = async () => {
  if (!classFormRef.value) return

  try {
    await classFormRef.value.validate()
    submitting.value = true

    await adminApi.createClass(classForm.value)
    ElMessage.success('班级添加成功')
    classDialogVisible.value = false
    loadClassList()
  } catch (error) {
    ElMessage.error('班级添加失败')
  } finally {
    submitting.value = false
  }
}

const handleViewDetail = async (row: any) => {
  currentClass.value = row
  detailVisible.value = true
  // 加载班级详情数据
  try {
    const [classRes, studentRes] = await Promise.all([
      adminApi.getClassDetail(row.classId),
      adminApi.getClassStudents(row.classId)
    ])
    classDetail.value = classRes.data
    studentList.value = studentRes.data || []
    // TODO: 加载考试任务列表
    taskList.value = []
  } catch (error) {
    ElMessage.error('加载班级详情失败')
  }
}

const handlePublishTask = (row: any) => {
  currentClass.value = row
  taskVisible.value = true
}

const handleDeleteClass = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除班级 "${row.className}" 吗？如果班级中有学生，将无法删除。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await adminApi.deleteClass(row.classId)
    ElMessage.success('班级删除成功')
    loadClassList()
  } catch (error) {
    if (error !== 'cancel') {
      // 显示具体的错误信息
      const errorMessage = error.response?.data?.message || error.message || '班级删除失败'
      ElMessage.error(errorMessage)
    }
  }
}

const handleSubmitTask = async () => {
  try {
    await adminApi.publishTask({
      classId: currentClass.value.classId,
      ...taskForm.value
    })
    ElMessage.success('任务发布成功')
    taskVisible.value = false
  } catch (error) {
    ElMessage.error('任务发布失败')
  }
}


onMounted(() => {
  loadClassList()
})
</script>

<style scoped lang="scss">
.class-manage {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
