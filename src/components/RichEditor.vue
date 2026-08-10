<template>
  <div class="rich-editor border border-border rounded-lg overflow-hidden">
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const editorRef = ref(null)
let quill = null

onMounted(() => {
  quill = new Quill(editorRef.value, {
    theme: 'snow',
    placeholder: '添加备注...',
    modules: {
      toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
    },
  })

  if (props.modelValue) {
    quill.root.innerHTML = props.modelValue
  }

  quill.on('text-change', () => {
    emit('update:modelValue', quill.root.innerHTML)
  })
})

watch(
  () => props.modelValue,
  val => {
    if (quill && quill.root.innerHTML !== val) {
      quill.root.innerHTML = val || ''
    }
  },
)

onBeforeUnmount(() => {
  quill = null
})
</script>

<style scoped>
.editor-container {
  min-height: 100px;
}
.editor-container :deep(.ql-container) {
  border: none;
  font-size: 14px;
}
.editor-container :deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid var(--tw-border-opacity, #e2e8f0);
  padding: 6px 8px;
}
</style>
