<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="18">
        <h2 class="page-title">
          {{ pageTitle }}
          <el-tag v-if="searchQuery" type="info" class="search-tag" closable @close="clearSearch">
            搜索: {{ searchQuery }}
          </el-tag>
        </h2>
        
        <div v-loading="loading">
          <ArticleCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
            :highlight-query="searchQuery"
            @tag-click="handleTagSelect"
          />
          
          <el-empty v-if="!loading && articles.length === 0" :description="emptyDescription" />
        </div>
        
        <Pagination
          v-model="currentPage"
          :total="pagination.total"
          :page-size="pagination.limit"
          @change="handlePageChange"
        />
      </el-col>
      
      <el-col :span="6">
        <TagFilter
          :tags="tags"
          :counts="tagCounts"
          :selected-tag="selectedTag"
          @select="handleTagSelect"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'
import ArticleCard from '../components/ArticleCard.vue'
import TagFilter from '../components/TagFilter.vue'
import Pagination from '../components/Pagination.vue'

const route = useRoute()
const router = useRouter()

const articles = ref([])
const tags = ref([])
const tagCounts = ref({})
const loading = ref(false)
const selectedTag = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pagination = ref({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0
})

const pageTitle = computed(() => {
  if (searchQuery.value) {
    return '搜索结果'
  }
  return selectedTag.value ? `标签: ${selectedTag.value}` : '最新文章'
})

const emptyDescription = computed(() => {
  if (searchQuery.value) {
    return '未找到匹配的文章'
  }
  return '暂无文章'
})

onMounted(() => {
  if (route.query.tag) {
    selectedTag.value = route.query.tag
  }
  if (route.query.search) {
    searchQuery.value = route.query.search
  }
  fetchArticles()
  fetchTags()
})

watch(() => route.query, (newQuery) => {
  if (newQuery.tag !== selectedTag.value) {
    selectedTag.value = newQuery.tag || null
  }
  if (newQuery.search !== searchQuery.value) {
    searchQuery.value = newQuery.search || ''
  }
  currentPage.value = 1
  fetchArticles()
})

async function fetchArticles() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pagination.value.limit
    }
    if (selectedTag.value) {
      params.tag = selectedTag.value
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const response = await api.get('/articles', { params })
    articles.value = response.data.articles
    pagination.value = response.data.pagination
  } catch (error) {
    console.error('Failed to fetch articles:', error)
  } finally {
    loading.value = false
  }
}

async function fetchTags() {
  try {
    const response = await api.get('/tags')
    tags.value = response.data.tags
    tagCounts.value = response.data.counts || {}
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

function handlePageChange(page) {
  currentPage.value = page
  fetchArticles()
}

function handleTagSelect(tag) {
  selectedTag.value = tag
  currentPage.value = 1
  
  const query = {}
  if (tag) query.tag = tag
  if (searchQuery.value) query.search = searchQuery.value
  
  router.replace({ query })
  fetchArticles()
}

function clearSearch() {
  const query = {}
  if (selectedTag.value) query.tag = selectedTag.value
  router.replace({ query })
}
</script>

<style scoped>
.home {
  padding-top: 20px;
}

.page-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-tag {
  font-size: 14px;
  font-weight: normal;
}
</style>
