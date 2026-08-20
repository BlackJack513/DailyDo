<template>
  <div class="h-full flex flex-col">
    <PageHeader
      title="待办列表"
      :subtitle="`${pendingTodos.length} 待处理 · ${inProgressTodos.length} 进行中 · ${blockedTodos.length} 等待中 · ${doneTodos.length} 已完成`"
    >
      <template #actions>
        <TemplateDropdown @create="createFromTemplate" />
        <button @click="openNewTodoModal" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新建待办
        </button>
      </template>
    </PageHeader>

    <!-- Quick Add -->
    <div class="px-8 pb-4">
      <div class="flex items-center gap-3 bg-surface-secondary border border-border rounded-xl px-4 py-3">
        <svg class="w-5 h-5 text-content-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <input
          v-model="quickTitle"
          @keydown.enter="quickAdd"
          class="flex-1 bg-transparent text-sm text-content placeholder-content-tertiary outline-none"
          placeholder="快速添加待办，按回车确认..."
        />
        <button
          v-if="quickTitle.trim()"
          @click="quickAdd"
          class="text-primary hover:text-primary-hover text-sm font-medium"
        >
          添加
        </button>
      </div>
    </div>

    <!-- Kanban Board (wide screen) -->
    <div class="flex-1 px-8 pb-6 overflow-y-auto hidden lg:block">
      <!-- Today's Kanban Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span class="text-sm font-semibold text-content">今日待办</span>
          <span class="text-xs text-content-tertiary">{{ store.currentDate }}</span>
        </div>
        <button
          @click="toggleAllColumns"
          class="flex items-center gap-1.5 text-xs text-content-tertiary hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-surface-secondary"
        >
          <svg
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="{ 'rotate-[-90deg]': allCollapsed }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {{ allCollapsed ? '全部展开' : '全部折叠' }}
        </button>
      </div>
      <!-- Use flex-wrap so collapsed columns shrink and historical items flow up -->
      <div class="flex flex-wrap gap-4">
        <!-- Pending Column -->
        <KanbanColumn
          title="待处理"
          :todos="pendingTodos"
          status-color="border-amber-400"
          @drop="handleDrop"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
          @history="handleHistory"
        />
        <!-- In Progress Column -->
        <KanbanColumn
          title="进行中"
          :todos="inProgressTodos"
          status-color="border-blue-400"
          @drop="handleDrop"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
          @history="handleHistory"
        />
        <!-- Blocked Column -->
        <KanbanColumn
          title="等待中"
          :todos="blockedTodos"
          status-color="border-amber-500"
          @drop="handleDrop"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
          @history="handleHistory"
        />
        <!-- Done Column -->
        <KanbanColumn
          title="已完成"
          :todos="doneTodos"
          :max-visible="3"
          status-color="border-green-400"
          @drop="handleDrop"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
          @history="handleHistory"
          @showMore="showDoneModal = true"
        />
      </div>

      <!-- Historical Incomplete Todos (below kanban) -->
      <div v-if="historicalGroups.length > 0" class="mt-8">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 h-px bg-border"></div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="text-sm font-semibold text-content-tertiary">历史未完成</span>
          </div>
          <div class="flex-1 h-px bg-border"></div>
        </div>
        <div class="space-y-4">
          <div v-for="group in historicalGroups" :key="group.date" class="space-y-2">
            <h3 class="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
              {{ group.label }}
              <span class="font-normal normal-case">· {{ group.todos.length }} 项未完成</span>
            </h3>
            <TodoItem
              v-for="todo in group.todos"
              :key="todo.id"
              :todo="todo"
              :show-date="true"
              :drag-mousedown="onHistMouseDown"
              :dragging="histDragState && histDragState.todo.id === todo.id"
              @toggle-status="handleToggle"
              @edit="handleEdit"
              @delete="handleDelete"
              @detail="handleDetail"
            />
          </div>
        </div>
      </div>

      <!-- Empty -->
      <EmptyState
        v-if="store.currentTodos.length === 0 && historicalGroups.length === 0"
        text="今天还没有待办"
        hint="使用上方输入框快速添加，或点击「新建待办」创建"
      />
    </div>

    <!-- Compact List (narrow screen) -->
    <div class="flex-1 px-4 pb-6 overflow-y-auto lg:hidden">
      <!-- Today's Todos -->
      <div class="flex items-center gap-2 mb-3">
        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span class="text-sm font-semibold text-content">今日待办</span>
      </div>
      <div class="space-y-2">
        <CompactTodoItem
          v-for="todo in store.currentTodos"
          :key="todo.id"
          :todo="todo"
          @toggle="handleToggle"
          @edit="handleEdit"
          @delete="handleDelete"
          @detail="handleDetail"
        />
      </div>

      <!-- Historical Incomplete Todos -->
      <div v-if="historicalGroups.length > 0" class="mt-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="flex-1 h-px bg-border"></div>
          <span class="text-xs font-semibold text-content-tertiary">历史未完成</span>
          <div class="flex-1 h-px bg-border"></div>
        </div>
        <div v-for="group in historicalGroups" :key="group.date" class="mt-3 space-y-2">
          <h3 class="text-xs font-semibold text-content-tertiary uppercase tracking-wider">
            {{ group.label }}
            <span class="font-normal normal-case">· {{ group.todos.length }} 项未完成</span>
          </h3>
          <CompactTodoItem
            v-for="todo in group.todos"
            :key="todo.id"
            :todo="todo"
            :drag-mousedown="onHistMouseDown"
            :dragging="histDragState && histDragState.todo.id === todo.id"
            @toggle="handleToggle"
            @edit="handleEdit"
            @delete="handleDelete"
            @detail="handleDetail"
          />
        </div>
      </div>

      <!-- Empty -->
      <EmptyState
        v-if="store.currentTodos.length === 0 && historicalGroups.length === 0"
        text="今天还没有待办"
        hint="使用上方输入框快速添加，或点击「新建待办」创建"
      />
    </div>

    <!-- Add/Edit Modal -->
    <AddTodoModal
      :show="showFullModal"
      :todo="editingTodo"
      :locked-fields="modalLockedFields"
      @close="closeFullModal"
      @submit="handleSubmit"
    />

    <!-- Detail Modal -->
    <TodoDetailModal
      :show="showDetailModal"
      :todo="detailTodo"
      @close="closeDetailModal"
      @delete="handleDetailDelete"
      @toggle-step="handleStepToggle"
      @refresh="handleDetailRefresh"
    />

    <!-- Activity History Modal -->
    <ActivityHistoryModal
      :show="showHistoryModal"
      :todo-id="historyTodo?.id"
      :todo-title="historyTodo?.title"
      :todo-created-at="historyTodo?.created_at"
      @close="closeHistoryModal"
    />

    <!-- Completed Todos Modal -->
    <div v-if="showDoneModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showDoneModal = false"></div>
      <div class="relative w-full max-w-2xl mx-4 bg-surface rounded-2xl shadow-2xl border border-border max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-content">今日已完成</h3>
              <p class="text-xs text-content-tertiary">{{ doneTodos.length }} 项任务已完成</p>
            </div>
          </div>
          <button
            @click="showDoneModal = false"
            class="p-2 rounded-xl hover:bg-surface-tertiary text-content-tertiary transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="doneTodos.length === 0" class="text-center py-12 text-content-tertiary">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm">暂无已完成任务</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="todo in doneTodos"
              :key="todo.id"
              class="group flex items-start gap-3 p-3 rounded-xl border border-border hover:border-green-300 hover:bg-green-50/50 transition-all"
            >
              <div class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-content line-through">{{ todo.title }}</p>
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <span class="inline-flex items-center gap-1 text-xs" :class="getPriorityColor(todo.priority)">
                    <span class="w-1.5 h-1.5 rounded-full" :class="getPriorityDot(todo.priority)"></span>
                    {{ getPriorityLabel(todo.priority) }}
                  </span>
                  <span
                    v-for="tag in todo.tags || []"
                    :key="tag.id"
                    class="text-xs px-1.5 py-0.5 rounded font-medium"
                    :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                  >
                    {{ tag.name }}
                  </span>
                  <span
                    v-if="todo.recurrence_type && todo.recurrence_type !== 'none'"
                    class="text-xs text-content-tertiary flex items-center gap-0.5"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {{ getRecurrenceLabel(todo.recurrence_type) }}
                  </span>
                </div>
                <!-- Steps progress -->
                <div v-if="todo.steps && todo.steps.length > 0" class="mt-2">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                      <div
                        class="h-full bg-green-500 rounded-full transition-all"
                        :style="{ width: (todo.steps.filter(s => s.completed).length / todo.steps.length * 100) + '%' }"
                      ></div>
                    </div>
                    <span class="text-xs text-green-600 font-medium">
                      {{ todo.steps.filter(s => s.completed).length }}/{{ todo.steps.length }}
                    </span>
                  </div>
                  <div class="mt-1.5 space-y-1">
                    <div
                      v-for="step in todo.steps"
                      :key="step.id"
                      class="flex items-center gap-2 text-xs"
                    >
                      <div class="w-3.5 h-3.5 rounded flex items-center justify-center" :class="step.completed ? 'bg-green-500' : 'border border-border'">
                        <svg v-if="step.completed" class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <span :class="step.completed ? 'text-content-tertiary line-through' : 'text-content'">{{ step.title }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Action buttons -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  @click="handleDetail({ todo }); showDoneModal = false"
                  class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary"
                  title="查看详情"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  @click="handleEdit(todo); showDoneModal = false"
                  class="p-1.5 rounded-lg hover:bg-surface-tertiary text-content-tertiary"
                  title="编辑"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  @click="handleDelete(todo); showDoneModal = false"
                  class="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                  title="删除"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Double-click hint -->
    <div v-if="store.currentTodos.length > 0" class="px-8 pb-2 hidden lg:block">
      <p class="text-xs text-content-tertiary flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        双击待办卡片可查看详情
      </p>
    </div>

    <!-- Delete Confirm -->
    <div v-if="deletingTodo" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="deletingTodo = null"></div>
      <div class="relative bg-surface rounded-2xl shadow-2xl border border-border p-6 w-80">
        <h3 class="text-lg font-semibold text-content mb-2">移入回收站</h3>
        <p class="text-sm text-content-secondary text-muted mb-4">
          确定要将「{{ deletingTodo.title }}」移入回收站吗？回收站中的项目将在 7 天后自动删除。
        </p>
        <div class="flex justify-end gap-3">
          <button @click="deletingTodo = null" class="btn-secondary">取消</button>
          <button @click="confirmDelete" class="btn-danger">删除</button>
        </div>
      </div>
    </div>

    <!-- Historical Drag Ghost Element -->
    <Teleport to="body">
      <div
        v-if="histDragState && histDragState.active"
        data-drag-ghost
        class="fixed z-[9999] pointer-events-none"
        :style="{
          left: histDragState.x + 'px',
          top: histDragState.y + 'px',
          transform: 'translate(-50%, -50%) rotate(3deg)',
          opacity: 0.9,
        }"
      >
        <div
          class="flex items-start gap-3 p-3 rounded-xl border-2 border-primary bg-surface shadow-2xl min-w-[250px] max-w-[320px]"
        >
          <div
            class="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center border-border"
          ></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium leading-tight text-content truncate">{{ histDragState.todo.title }}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <span
                class="inline-flex items-center gap-1 text-xs"
                :class="getHistPriorityColor(histDragState.todo.priority)"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="getHistPriorityDot(histDragState.todo.priority)"></span>
                {{ getHistPriorityLabel(histDragState.todo.priority) }}
              </span>
              <span
                v-for="tag in histDragState.todo.tags || []"
                :key="tag.id"
                class="tag-badge text-xs px-1.5 py-0.5 rounded"
                :style="{ backgroundColor: tag.color + '20', color: tag.color }"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Historical Drag Warning Dialog -->
    <div v-if="showHistWarning" class="fixed inset-0 z-[10000] flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div class="relative bg-surface rounded-2xl shadow-2xl border border-border p-6 w-96 mx-4">
        <h3 class="text-lg font-semibold text-content mb-2">将历史待办移入今日</h3>
        <p class="text-sm text-content-secondary text-muted mb-4">
          此操作会将「{{ histDragTodo?.title }}」的日期重置为今天（{{ store.currentDate }}），并设置状态为「{{
            getHistStatusLabel(histDragTargetStatus)
          }}」。 该操作不可逆，原始日期的记录将被修改。
        </p>
        <label class="flex items-center gap-2 mb-5 cursor-pointer select-none">
          <input type="checkbox" v-model="skipHistWarning" class="w-4 h-4 rounded border-border" />
          <span class="text-sm text-content-secondary text-muted">不再提醒</span>
        </label>
        <div class="flex justify-end gap-3">
          <button @click="cancelHistDrag" class="btn-secondary">取消</button>
          <button @click="confirmHistDrag" class="btn-primary">确认移动</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * TodayView — 今日待办看板视图
 *
 * 职责：
 *   1. 展示今日待办的看板视图（待处理/进行中/等待中/已完成）
 *   2. 支持快速添加、从模板创建、编辑、删除、详情查看等操作
 *   3. 支持历史未完成待办的展示和拖拽到今日
 *
 * 设计要点：
 *   - 所有优先级/重复类型的显示逻辑统一使用 helpers.js 的共享函数
 *   - 模板创建流程通过 templateService 加载完整数据（含自定义字段值）
 *   - 历史拖拽使用原生鼠标事件（Tauri v1 下 HTML5 drag API 有兼容性问题）
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '../stores/app'
import * as db from '../utils/db'
import TodoItem from '../components/TodoItem.vue'
import AddTodoModal from '../components/AddTodoModal.vue'
import TodoDetailModal from '../components/TodoDetailModal.vue'
import KanbanColumn from '../components/KanbanColumn.vue'
import CompactTodoItem from '../components/CompactTodoItem.vue'
import ActivityHistoryModal from '../components/ActivityHistoryModal.vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import TemplateDropdown from '@/components/TemplateDropdown.vue'

// ─── 共享工具导入 ─────────────────────────────────────────────
// 统一使用 helpers.js 中的函数，消除本文件中的重复定义
import {
  priorityLabel,
  priorityColor,
  priorityDot,
  recurrenceLabel,
  safeJsonParseArray,
  formatDate,
} from '../utils/helpers'

const store = useAppStore()

// ─── 弹窗状态 ─────────────────────────────────────────────────

const showFullModal = ref(false)       // 新建/编辑待办弹窗
const editingTodo = ref(null)          // 当前编辑的待办对象
const deletingTodo = ref(null)         // 待删除的待办对象
const detailTodo = ref(null)           // 详情弹窗中的待办
const showDetailModal = ref(false)     // 详情弹窗开关
const modalLockedFields = ref([])      // 弹窗中被锁定的字段列表

// 活动历史弹窗
const showHistoryModal = ref(false)
const historyTodo = ref(null)

// 已完成弹窗
const showDoneModal = ref(false)

// ─── 快速添加 ─────────────────────────────────────────────────

const quickTitle = ref('')
const allCollapsed = ref(false)

// ─── 历史拖拽状态 ─────────────────────────────────────────────
// 使用原生鼠标事件而非 HTML5 drag API，因为 Tauri v1 下后者有兼容性问题

const histDragState = ref(null)  // 拖拽状态对象 { todo, startX, startY, x, y, active, targetStatus }
const histDragTodo = ref(null)   // 被拖拽的历史待办
const histDragTargetStatus = ref('pending')  // 拖拽目标状态
const showHistWarning = ref(false)  // 是否显示历史拖拽确认弹窗
const skipHistWarning = ref(false)  // 是否跳过后续确认
const HIST_DRAG_THRESHOLD = 5      // 拖拽触发阈值（像素）

// ─── 计算属性 ─────────────────────────────────────────────────

/** 按状态分类的今日待办 */
const pendingTodos = computed(() => store.currentTodos.filter(t => t.status === 'pending'))
const inProgressTodos = computed(() => store.currentTodos.filter(t => t.status === 'in_progress'))
const blockedTodos = computed(() => store.currentTodos.filter(t => t.status === 'blocked'))
const doneTodos = computed(() => store.currentTodos.filter(t => t.status === 'done'))

/**
 * 历史未完成待办按日期分组。
 * 分组逻辑：今天 → 显示日期标签；昨天 → "昨日"；更早 → "X月X日 周X"
 */
const historicalGroups = computed(() => {
  const today = formatDate(new Date())
  const yesterday = formatDate(new Date(Date.now() - 86400000))
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  const pastIncomplete = store.incompleteTodos.filter(t => t.todo_date < today)

  const groupMap = {}
  for (const todo of pastIncomplete) {
    const date = todo.todo_date
    if (!groupMap[date]) {
      let label
      if (date === yesterday) {
        label = '昨日'
      } else {
        const d = new Date(date + 'T00:00:00')
        label = `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
      }
      groupMap[date] = { date, label, todos: [] }
    }
    groupMap[date].todos.push(todo)
  }

  // 每组内按创建时间倒序排列
  for (const group of Object.values(groupMap)) {
    group.todos.sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })
  }

  return Object.values(groupMap).sort((a, b) => b.date.localeCompare(a.date))
})

// ─── 生命周期 ─────────────────────────────────────────────────

onMounted(async () => {
  await store.loadTags()
  await store.loadTodosForDate(store.currentDate)
  await store.loadIncompleteTodos()
  await store.loadOverviewStats()

  // 加载历史拖拽跳过偏好设置
  try {
    const skip = await db.getSetting('skip_historical_drag_warning')
    if (skip === 'true') skipHistWarning.value = true
  } catch (e) {
    console.error('Failed to load skip warning setting:', e)
  }

  // 检查是否从小窗模式返回，有待处理的数据
  if (store.pendingQuickAdd) {
    const data = store.pendingQuickAdd
    editingTodo.value = {
      title: data.title || '',
      priority: data.priority || 'medium',
      tags: (data.tagIds || []).map(id => store.tags.find(t => t.id === id)).filter(Boolean),
      todo_date: store.currentDate,
      _isNew: true,
    }
    showFullModal.value = true
    store.pendingQuickAdd = null
  } else if (store.pendingEditTodo) {
    editingTodo.value = store.pendingEditTodo
    showFullModal.value = true
    store.pendingEditTodo = null
  }
})

onUnmounted(() => {
  // 清理拖拽事件监听器，防止内存泄漏
  document.removeEventListener('mousemove', onHistMouseMove)
  document.removeEventListener('mouseup', onHistMouseUp)
})

// ─── 小窗模式 → 完整模式的监听 ────────────────────────────────

watch(
  () => store.pendingQuickAdd,
  data => {
    if (data) {
      editingTodo.value = {
        title: data.title || '',
        priority: data.priority || 'medium',
        tags: (data.tagIds || []).map(id => store.tags.find(t => t.id === id)).filter(Boolean),
        todo_date: store.currentDate,
        _isNew: true,
      }
      showFullModal.value = true
      store.pendingQuickAdd = null
    }
  },
)

watch(
  () => store.pendingEditTodo,
  todo => {
    if (todo) {
      editingTodo.value = todo
      showFullModal.value = true
      store.pendingEditTodo = null
    }
  },
)

// ─── 待办操作方法 ─────────────────────────────────────────────

/** 快速添加待办（仅标题，默认中优先级） */
async function quickAdd() {
  if (!quickTitle.value.trim()) return
  await store.addTodo({
    title: quickTitle.value.trim(),
    todo_date: store.currentDate,
    priority: 'medium',
  })
  quickTitle.value = ''
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

/** 切换待办状态（待处理↔已完成等） */
async function handleToggle(todo) {
  await store.toggleTodoStatus(todo)
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

/** 看板拖放：更新待办状态 */
async function handleDrop({ todoId, newStatus }) {
  const todo = store.currentTodos.find(t => t.id === todoId)
  if (!todo || todo.status === newStatus) return
  await store.updateTodo({ ...todo, status: newStatus })
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

/** 打开编辑弹窗 */
function handleEdit(todo) {
  editingTodo.value = todo
  showFullModal.value = true
}

/** 打开新建弹窗 */
function openNewTodoModal() {
  editingTodo.value = null
  showFullModal.value = true
}

/** 标记待删除 */
function handleDelete(todo) {
  deletingTodo.value = todo
}

/** 打开详情弹窗 */
function handleDetail({ todo }) {
  detailTodo.value = todo
  showDetailModal.value = true
}

function closeDetailModal() {
  showDetailModal.value = false
  detailTodo.value = null
}

function handleDetailDelete(todo) {
  closeDetailModal()
  deletingTodo.value = todo
}

function handleHistory(todo) {
  historyTodo.value = todo
  showHistoryModal.value = true
}

function closeHistoryModal() {
  showHistoryModal.value = false
  historyTodo.value = null
}

/** 切换步骤完成状态 */
async function handleStepToggle(step) {
  await store.toggleStep(step.id)
  // 刷新详情弹窗中的待办数据
  if (detailTodo.value) {
    const updated = store.currentTodos.find(t => t.id === detailTodo.value.id)
    if (updated) {
      detailTodo.value = updated
    }
  }
}

/** 刷新详情弹窗中的附件数据 */
async function handleDetailRefresh() {
  if (detailTodo.value) {
    const attachments = await db.getAttachmentsByTodoId(detailTodo.value.id)
    detailTodo.value = { ...detailTodo.value, attachments }
  }
}

/** 确认删除（移入回收站） */
async function confirmDelete() {
  if (deletingTodo.value) {
    await store.removeTodo(deletingTodo.value.id)
    deletingTodo.value = null
    await store.loadOverviewStats()
    await store.loadIncompleteTodos()
  }
}

/** 提交新建/编辑表单 */
async function handleSubmit(data) {
  if (editingTodo.value && !editingTodo.value._isNew) {
    await store.updateTodo(data)
  } else {
    await store.addTodo(data)
  }
  closeFullModal()
  await store.loadOverviewStats()
  await store.loadIncompleteTodos()
}

function closeFullModal() {
  showFullModal.value = false
  editingTodo.value = null
  modalLockedFields.value = []
}

// ─── 模板相关 ────────────────────────────────────────────────

/**
 * 从模板创建待办。
 *
 * 完整流程：
 *   1. 解析模板的锁定字段列表
 *   2. 解析模板的标签 ID 列表
 *   3. 加载模板的步骤数据
 *   4. 加载模板的自定义字段默认值
 *   5. 组装 _templateData 传入 AddTodoModal 进行预填
 *
 * @param {Object} tpl - 模板对象（由 TemplateDropdown 组件传入）
 */
async function createFromTemplate(tpl) {
  // 解析锁定字段（含标准字段和自定义字段的 "cf_{id}" 标识）
  const locked = safeJsonParseArray(tpl.locked_fields)
  modalLockedFields.value = locked

  // 解析标签 ID 列表
  const tagIds = safeJsonParseArray(tpl.tag_ids)

  // 加载模板步骤
  let steps = []
  try {
    const tplSteps = await db.getTemplateSteps(tpl.id)
    steps = tplSteps.map(s => ({ title: s.title, completed: false }))
  } catch {
    steps = []
  }

  // 加载模板的自定义字段默认值
  // 这是之前缺失的关键步骤 —— 导致从模板创建时自定义字段值丢失
  let customFieldValues = []
  try {
    customFieldValues = await db.getTemplateCustomFieldValues(tpl.id)
  } catch {
    customFieldValues = []
  }

  // 组装待办对象，通过 _templateData 传递模板预填数据给 AddTodoModal
  editingTodo.value = {
    title: tpl.title || '',
    priority: tpl.priority || 'medium',
    tags: tagIds.map(id => store.tags.find(t => t.id === id)).filter(Boolean),
    todo_date: store.currentDate,
    _isNew: true,
    _templateData: {
      recurrence_type: tpl.recurrence_type || 'none',
      recurrence_config: tpl.recurrence_config || '{}',
      steps,
      customFieldValues,  // 传递自定义字段默认值到弹窗
    },
  }
  showFullModal.value = true
}

// ─── 看板折叠 ─────────────────────────────────────────────────

function toggleAllColumns() {
  allCollapsed.value = !allCollapsed.value
  window.dispatchEvent(
    new CustomEvent('kanban-collapse-all', {
      detail: { collapsed: allCollapsed.value },
    }),
  )
}

// ─── 历史待办拖拽 ─────────────────────────────────────────────

/**
 * 历史待办拖拽开始。
 * 使用原生鼠标事件而非 HTML5 drag API，因为 Tauri v1 下 HTML5 drag API
 * 存在 dragleave 误触发、dragend 顺序等兼容性问题。
 */
function onHistMouseDown(e, todo) {
  // 不从按钮元素开始拖拽
  const tag = e.target.tagName
  if (tag === 'BUTTON' || e.target.closest('button')) return
  if (e.button !== 0) return
  e.preventDefault()

  histDragState.value = {
    todo,
    startX: e.clientX,
    startY: e.clientY,
    x: e.clientX,
    y: e.clientY,
    active: false,
    targetStatus: 'pending',
  }

  document.addEventListener('mousemove', onHistMouseMove)
  document.addEventListener('mouseup', onHistMouseUp)
}

function onHistMouseMove(e) {
  if (!histDragState.value) return

  const dx = e.clientX - histDragState.value.startX
  const dy = e.clientY - histDragState.value.startY

  // 超过阈值才激活拖拽（防止误触）
  if (!histDragState.value.active && (Math.abs(dx) > HIST_DRAG_THRESHOLD || Math.abs(dy) > HIST_DRAG_THRESHOLD)) {
    histDragState.value.active = true
  }

  if (histDragState.value.active) {
    histDragState.value.x = e.clientX
    histDragState.value.y = e.clientY
    histDragState.value.targetStatus = detectHoverColumn(e.clientX, e.clientY)
  }
}

/**
 * 检测鼠标位置下方的看板列。
 * 通过 DOM 查询找到 data-kanban-column 属性的元素，根据列标题判断目标状态。
 */
function detectHoverColumn(x, y) {
  // 临时隐藏拖拽幽灵元素，以便 elementFromPoint 能检测到下方的列
  const ghostEls = document.querySelectorAll('[data-drag-ghost]')
  ghostEls.forEach(el => { el.style.display = 'none' })

  const el = document.elementFromPoint(x, y)

  // 恢复幽灵元素
  ghostEls.forEach(el => { el.style.display = '' })

  if (!el) return null

  let target = el
  while (target && target !== document.body) {
    if (target.hasAttribute && target.hasAttribute('data-kanban-column')) {
      const titleEl = target.querySelector('.text-sm.font-semibold')
      if (titleEl) {
        const colTitle = titleEl.textContent.trim()
        const statusMap = { 待处理: 'pending', 进行中: 'in_progress', 等待中: 'blocked', 已完成: 'done' }
        return statusMap[colTitle] || null
      }
    }
    target = target.parentElement
  }

  return null
}

function onHistMouseUp(e) {
  document.removeEventListener('mousemove', onHistMouseMove)
  document.removeEventListener('mouseup', onHistMouseUp)

  if (!histDragState.value) return

  const wasActive = histDragState.value.active
  const todo = histDragState.value.todo
  const targetStatus = detectHoverColumn(e.clientX, e.clientY)

  histDragState.value = null

  if (!wasActive) return
  if (!targetStatus) return

  histDragTodo.value = todo
  histDragTargetStatus.value = targetStatus

  // 根据用户偏好决定是否显示确认弹窗
  if (skipHistWarning.value) {
    executeHistoricalMove()
  } else {
    showHistWarning.value = true
  }
}

/** 确认历史拖拽操作 */
async function confirmHistDrag() {
  // 保存跳过偏好设置
  if (skipHistWarning.value) {
    try {
      await db.setSetting('skip_historical_drag_warning', 'true')
    } catch (e) {
      console.error('Failed to save skip warning setting:', e)
    }
  }

  showHistWarning.value = false
  await executeHistoricalMove()
}

function cancelHistDrag() {
  showHistWarning.value = false
  histDragTodo.value = null
}

/** 执行历史待办移动到今日 */
async function executeHistoricalMove() {
  const todo = histDragTodo.value
  const targetStatus = histDragTargetStatus.value
  histDragTodo.value = null

  if (!todo) return
  await store.moveHistoricalTodoToToday(todo.id, targetStatus)
}

// ─── 显示辅助函数 ─────────────────────────────────────────────
// 统一使用 helpers.js 中的共享函数，消除重复定义

/** 拖拽幽灵中的优先级颜色 */
function getHistPriorityColor(p) { return priorityColor(p) }
function getHistPriorityDot(p) { return priorityDot(p) }
function getHistPriorityLabel(p) { return priorityLabel(p) }

/** 状态标签映射 */
function getHistStatusLabel(status) {
  const map = { pending: '待处理', in_progress: '进行中', blocked: '等待中', done: '已完成' }
  return map[status] || '待处理'
}

/** 已完成弹窗中的优先级显示 —— 使用共享函数 */
function getPriorityColor(p) { return priorityColor(p) }
function getPriorityDot(p) { return priorityDot(p) }
function getPriorityLabel(p) { return priorityLabel(p) }

/** 已完成弹窗中的重复类型显示 —— 使用共享函数 */
function getRecurrenceLabel(type) { return recurrenceLabel(type) }
</script>
