<template>
  <div class="student-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生管理</span>
          <el-button type="primary" @click="handleAdd">添加学生</el-button>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form :inline="true" :model="queryForm">
        <el-form-item label="班级">
          <el-select v-model="queryForm.classId" placeholder="请选择班级" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="item in classList" :key="item.classId" :label="`${item.classId}班`" :value="item.classId" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="queryForm.name" placeholder="请输入学生姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 学生列表 -->
      <el-table :data="studentList" v-loading="loading" style="width: 100%">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="studentId" label="学号" width="100" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="className" label="班级" width="120">
          <template #default="{ row }">
            {{ row.classId }}班
          </template>
        </el-table-column>
        <el-table-column prop="teacherName" label="班主任" width="120" />
        <el-table-column prop="password" label="密码" width="120">
          <template #default="{ row }">
            <span>******</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <!-- 添加/编辑学生对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑学生' : '添加学生'" width="500px">
      <el-form :model="studentForm" :rules="rules" ref="studentFormRef" label-width="80px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="studentForm.name" placeholder="请输入学生姓名" />
        </el-form-item>
        <el-form-item label="班级" prop="classId">
          <el-select v-model="studentForm.classId" placeholder="请选择班级" style="width: 100%">
            <el-option v-for="item in classList" :key="item.classId" :label="`${item.classId}班`" :value="item.classId" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="studentForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importVisible" title="批量导入学生" width="600px">
      <el-upload
        class="upload-demo"
        drag
        :auto-upload="false"
        :file-list="importFileList"
        :on-change="handleImportFileChange"
        accept=".xlsx,.xls,.csv"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持 Excel 文件格式，包含：姓名、班级
          </div>
        </template>
      </el-upload>

      <el-divider content-position="left">或手动添加</el-divider>

      <el-form :model="batchForm" label-width="80px">
        <el-form-item label="班级">
          <el-select v-model="batchForm.classId" placeholder="请选择班级" style="width: 100%">
            <el-option v-for="item in classList" :key="item.classId" :label="`${item.classId}班`" :value="item.classId" />
          </el-select>
        </el-form-item>
        <el-form-item label="学生名单">
          <el-input
            v-model="batchForm.students"
            type="textarea"
            :rows="5"
            placeholder="请输入学生名单，每行一个姓名"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchImport" :loading="importing">
          确认导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { adminApi } from '@/api'

const loading = ref(false)
const studentList = ref([])
const classList = ref([])
const dialogVisible = ref(false)
const importVisible = ref(false)
const submitting = ref(false)
const importing = ref(false)
const isEdit = ref(false)
const currentStudentId = ref(null)

const queryForm = reactive({
  classId: '',
  name: ''
})

const studentForm = reactive({
  name: '',
  classId: '',
  password: ''
})

const batchForm = reactive({
  classId: '',
  students: ''
})

const importFileList = ref([])

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const rules = {
  name: [
    { required: true, message: '请输入学生姓名', trigger: 'blur' }
  ],
  classId: [
    { required: true, message: '请选择班级', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const studentFormRef = ref()

const loadStudentList = async () => {
  loading.value = true
  try {
    const params = {
      ...queryForm,
      page: pagination.page,
      size: pagination.size
    }
    const res = await adminApi.getStudentList(params)
    studentList.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    ElMessage.error('获取学生列表失败')
  } finally {
    loading.value = false
  }
}

const loadClassList = async () => {
  try {
    const res = await adminApi.getClassList()
    classList.value = res.data || []
  } catch (error) {
    ElMessage.error('获取班级列表失败')
  }
}

const handleQuery = () => {
  pagination.page = 1
  loadStudentList()
}

const handleReset = () => {
  queryForm.classId = ''
  queryForm.name = ''
  handleQuery()
}

const handleAdd = () => {
  isEdit.value = false
  currentStudentId.value = null
  Object.assign(studentForm, {
    name: '',
    classId: '',
    password: '123456'
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  currentStudentId.value = row.studentId
  Object.assign(studentForm, {
    name: row.name,
    classId: row.classId,
    password: row.password
  })
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该学生吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await adminApi.deleteStudent(row.studentId)
    ElMessage.success('删除成功')
    loadStudentList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!studentFormRef.value) return

  try {
    await studentFormRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await adminApi.updateStudent(currentStudentId.value, studentForm)
      ElMessage.success('更新成功')
    } else {
      await adminApi.createStudent(studentForm)
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    loadStudentList()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '添加失败')
  } finally {
    submitting.value = false
  }
}

const handleBatchImport = async () => {
  if (!batchForm.classId) {
    ElMessage.warning('请选择班级')
    return
  }

  if (!batchForm.students.trim()) {
    ElMessage.warning('请输入学生名单')
    return
  }

  importing.value = true
  try {
    const names = batchForm.students.trim().split('\n').filter(name => name.trim())
    const students = names.map(name => ({
      name: name.trim(),
      classId: batchForm.classId,
      password: '123456'
    }))

    await adminApi.batchCreateStudents(students)
    ElMessage.success(`成功导入 ${students.length} 个学生`)
    importVisible.value = false
    batchForm.students = ''
    loadStudentList()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const handleImportFileChange = (file: any, files: any[]) => {
  importFileList.value = files
}

const handleSizeChange = (size: number) => {
  pagination.size = size
  loadStudentList()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadStudentList()
}

const getClassName = (classId: number) => {
  const classMap: Record<number, string> = {
    1: '高一1班',
    2: '高二2班',
    3: '高三3班',
    4: '初一1班',
    5: '初二2班',
    6: '初三3班'
  }
  return classMap[classId] || `${classId}班`
}

onMounted(() => {
  loadClassList()
  loadStudentList()
})
</script>

<style scoped lang="scss">
.student-management {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .el-pagination {
    margin-top: 20px;
    text-align: right;
  }
}
</style>