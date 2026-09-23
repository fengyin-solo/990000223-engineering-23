<template>
  <div class="tag-filter">
    <h4 class="filter-title">标签筛选</h4>
    <div class="tag-list">
      <el-tag
        :type="selectedTag === null ? '' : 'info'"
        class="tag-item"
        @click="selectTag(null)"
        effect="dark"
      >
        全部
      </el-tag>
      <el-tag
        v-for="tag in tags"
        :key="tag"
        :type="selectedTag === tag ? '' : 'info'"
        :effect="selectedTag === tag ? 'dark' : 'plain'"
        class="tag-item"
        @click="selectTag(tag)"
      >
        {{ tag }}
      </el-tag>
    </div>
    <div class="tag-archive">
      <span class="tag-count">共 {{ tags.length }} 个标签</span>
      <el-link
        type="primary"
        :underline="false"
        href="/api/tags/archive"
        class="archive-link"
      >
        下载标签归档
      </el-link>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  selectedTag: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select'])

function selectTag(tag) {
  emit('select', tag)
}
</script>

<style scoped>
.tag-filter {
  margin-bottom: 20px;
}

.filter-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
}

.tag-archive {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
}

.tag-count {
  color: #909399;
}

.archive-link {
  font-size: 13px;
}
</style>
