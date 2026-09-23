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
        {{ tag }}<span v-if="counts[tag]" class="tag-count">({{ counts[tag] }})</span>
      </el-tag>
    </div>
    <div class="tag-summary">
      <span class="tag-total">共 {{ tags.length }} 个标签</span>
      <a class="archive-link" href="/api/tags/archive" :download="archiveFilename">
        下载标签汇总
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tags: {
    type: Array,
    default: () => []
  },
  counts: {
    type: Object,
    default: () => ({})
  },
  selectedTag: {
    type: String,
    default: null
  }
})

const archiveFilename = 'tags-archive.json'

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

.tag-count {
  margin-left: 2px;
  font-size: 12px;
  opacity: 0.8;
}

.tag-summary {
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 12px;
}

.archive-link {
  color: #409eff;
  text-decoration: none;
}

.archive-link:hover {
  text-decoration: underline;
}
</style>
