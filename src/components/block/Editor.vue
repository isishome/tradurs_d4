<script setup>
import { ref, shallowReadonly, computed, reactive } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  contents: {
    type: String,
    default: ''
  },
  accept: {
    type: String,
    default: 'image/*'
  },
  maxFiles: {
    type: [Number, String],
    default: undefined
  }
})

const emit = defineEmits(['update'])
const $q = useQuasar()
const definitions = shallowReadonly({
  images: {
    icon: 'image',
    tip: 'Insert Image',
    handler: () => {
      uploader.value.pickFiles()
    }
  }
})
const toolbar = shallowReadonly([
  [{
    icon: $q.iconSet.editor.align,
    fixedLabel: true,
    highlight: true,
    list: 'only-icons',
    options: ['left', 'center', 'right', 'justify']
  }, {
    icon: $q.iconSet.editor.fontSize,
    fixedLabel: true,
    highlight: true,
    list: 'no-icons',
    options: [
      'size-1',
      'size-2',
      'size-3',
      'size-4',
      'size-5',
      'size-6',
      'size-7'
    ]
  }],
  ['bold', 'italic', {
    icon: 'more_horiz',
    fixedLabel: true,
    highlight: true,
    options: [
      'underline',
      'strike',
      'subscript',
      'superscript',
      'removeFormat'
    ]
  }],
  ['textColor'],
  ['unordered', 'ordered'],
  ['link', 'images', 'highlight', 'add'],
  ['fullscreen']
])
const editor = ref(null)
const _contents = ref(props.contents)
const uploader = ref(null)
const attach = ref([])

const update = () => {
  if (['<br>', '<br/>', ''].includes(_contents.value.trim()))
    editor.value.runCmd('removeFormat', '')
  emit('update', editor.value.getContentEl().innerHTML)
}

const remove = (file) => {
  const findIndex = attach.value.findIndex(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)
  if (findIndex !== -1) {
    attach.value.splice(findIndex, 1)
    uploader.value.removeFile(file)
    const imgs = editor.value.getContentEl().querySelectorAll(`img[src=\"${file.__img.src}\"]`)
    imgs.forEach(img => img.remove())
  }
  update()
}

const added = (files) => {
  files.forEach(f => {
    if (f.__img) {
      insertImage(f.__img.src)
      attach.value.push(f)
    }
  })
  update()
}

const insertImage = (src) => {
  editor.value.runCmd('insertImage', src)
  update()
}

const onPaste = (evt) => {
  if (evt.target.nodeName === 'INPUT') return
  let text, encodeText
  evt.preventDefault()
  evt.stopPropagation()
  if (evt.originalEvent && evt.originalEvent.clipboardData.getData) {
    text = evt.originalEvent.clipboardData.getData('text/plain')
    encodeText = text.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
      return '&#' + i.charCodeAt(0) + ';'
    })
    editor.value.runCmd('insertHTML', text)
  }
  else if (evt.clipboardData && evt.clipboardData.getData) {
    text = evt.clipboardData.getData('text/plain')
    encodeText = text.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
      return '&#' + i.charCodeAt(0) + ';'
    })
    editor.value.runCmd('insertHTML', encodeText)
  }
  update()
}

const clear = () => {
  let i = attach.value.length
  while (i--)
    remove(attach.value[0])
  update()
}

const hex = ref('')
const changeColor = (val) => {
  editor.value.runCmd('foreColor', val)
  update()
}

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

const code = async (language) => {
  const edit = editor.value
  edit.caret.restore()
  let targetNode = sel.value.anchorNode.nodeName === 'PRE' ? sel.value.anchorNode : sel.value.anchorNode.parentNode.closest('pre')

  if (targetNode) {
    if (targetNode.dataset.language === language) {
      const nodeList = [...targetNode.childNodes]
      const range = new Range()
      targetNode.replaceWith(...targetNode.childNodes)
      range.setStartBefore(nodeList[0])
      range.setEndAfter(nodeList[nodeList.length - 1])
      sel.value.removeAllRanges()
      sel.value.addRange(range)
    }
    else
      targetNode.dataset.language = language
  } else {
    edit.runCmd('formatBlock', 'pre')
    targetNode = sel.value.anchorNode.nodeName === 'PRE' ? sel.value.anchorNode : sel.value.anchorNode.parentNode.closest('pre')
    targetNode.dataset.language = language
  }
  await sleep(0)
  edit.focus()
  update()
}

const apply = async (ext) => {
  const edit = editor.value
  edit.caret.restore()
  const range = new Range()
  let targetNode = ext.cmd && sel.value.anchorNode.nodeName === ext.cmd.toUpperCase() ? sel.value.anchorNode : ext.cmd ? sel.value.anchorNode.parentNode.closest(ext.cmd) : null

  if (targetNode) {
    range.selectNodeContents(targetNode)
    sel.value.removeAllRanges()
    sel.value.addRange(range)
    await sleep(0)
  }

  if (ext.name === 'hr')
    edit.runCmd('insertHorizontalRule')
  else if (ext.name === 'bq')
    edit.runCmd('formatBlock', targetNode ? 'div' : ext.cmd)
  else if (ext.name === 'tag') {
    if (targetNode) {
      const nodeList = [...targetNode.childNodes]
      targetNode.replaceWith(...targetNode.childNodes)
      range.setStartBefore(nodeList[0])
      range.setEndAfter(nodeList[nodeList.length - 1])
    }
    else {
      edit.runCmd('insertHTML', `<em>${sel.value.toString()}</em>`)
      targetNode = sel.value.anchorNode.parentNode
      range.selectNodeContents(targetNode)
    }
    sel.value.removeAllRanges()
    sel.value.addRange(range)
  }
  await sleep(0)
  edit.focus()
  update()
}

const escape = (e) => {
  if (active({ cmd: 'pre' }) || active({ cmd: 'blockquote' })) {
    e.preventDefault()
    editor.value.runCmd('insertParagraph')
    editor.value.runCmd('formatBlock', 'div')
  }
  else if (active({ cmd: 'em' })) {
    e.preventDefault()
    sel.value.anchorNode.parentElement.after(document.createTextNode('​'))
    const range = new Range()
    range.setStartAfter(sel.value.anchorNode.parentNode.nextSibling)
    sel.value.removeAllRanges()
    sel.value.addRange(range)
  }
  update()
}

const sel = computed(() => window.getSelection() ? window.getSelection() : document.getSelection() ? document.getSelection() : document.selection)

const active = (ext) => {
  if (!sel.value.anchorNode)
    return false
  const targetNode = ext.cmd && sel.value.anchorNode.nodeName === ext.cmd.toUpperCase() ? sel.value.anchorNode : ext.cmd ? sel.value.anchorNode.parentNode.closest(ext.cmd) : null
  return targetNode !== null
}

const activeCode = (ext) => {
  if (!sel.value.anchorNode)
    return false
  const targetNode = ext.cmd && sel.value.anchorNode.nodeName === ext.cmd.toUpperCase() ? sel.value.anchorNode : ext.cmd ? sel.value.anchorNode.parentNode.closest(ext.cmd) : null
  return targetNode !== null && targetNode.dataset.language === ext.name
}

const languages = reactive([
  {
    name: 'html',
    label: 'HTML',
    icon: 'html',
    cmd: 'pre',
    active: activeCode
  }, {
    name: 'css',
    label: 'CSS',
    icon: 'css',
    cmd: 'pre',
    active: activeCode
  }, {
    name: 'javascript',
    label: 'JavaScript',
    icon: 'javascript',
    cmd: 'pre',
    active: activeCode
  }, {
    name: 'bash',
    label: 'BASH',
    icon: 'terminal',
    cmd: 'pre',
    active: activeCode
  }
])

const extensions = reactive([
  {
    name: 'hr',
    label: 'Insert Horizental Rule',
    icon: 'horizontal_rule',
    cmd: '',
    active: active
  }, {
    name: 'bq',
    label: 'Insert Quote',
    icon: 'format_quote',
    cmd: 'blockquote',
    active: active
  }, {
    name: 'tag',
    label: 'Insert Tag',
    icon: 'label',
    cmd: 'em',
    active: active
  }
])
</script>

<template>
  <form autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false">
    <q-uploader ref="uploader" v-show="false" :max-files="maxFiles" :accept="accept" multiple @added="added" />
    <div class="relative-position">
      <q-editor ref="editor" toolbar-toggle-color="active-toggle" v-model="_contents" @update:model-value="update"
        @paste="onPaste" min-height="20rem" max-height="50rem" class="editor" :definitions="definitions"
        :toolbar="toolbar" @keydown.enter.exact="escape" @keydown.tab.prevent>
        <template #textColor>
          <q-btn dense flat size="sm" icon="format_color_text">
            <q-tooltip :delay="1000">
              Change Text Color
            </q-tooltip>
            <q-menu auto-close no-focus no-refocus>
              <q-color @mousedown.prevent v-model="hex" no-header no-footer default-view="palette"
                style="max-width:250px" @update:model-value="changeColor" />
            </q-menu>
          </q-btn>
        </template>
        <template #highlight>
          <q-btn dense flat icon="code" size="sm"
            :class="languages.filter(l => l.active(l) === true).length > 0 ? 'text-active-toggle' : ''">
            <q-tooltip :delay="1000">
              Insert Code Highlight
            </q-tooltip>
            <q-menu auto-close no-focus no-refocus>
              <q-list dense>
                <q-item @mousedown.prevent clickable v-for="l in languages" :key="l.name" @click="code(l.name)"
                  :active="l.active(l)" active-class="text-active-toggle">
                  <q-item-section side>
                    <q-icon :name="l.icon" size="sm" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ l.label }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>
        <template #add>
          <q-btn @mousedown.prevent dense flat icon="add" size="sm"
            :class="extensions.filter(ex => ex.active(ex) === true).length > 0 ? 'text-active-toggle' : ''">
            <q-tooltip :delay="1000">
              Extension List
            </q-tooltip>
            <q-menu auto-close no-focus no-refocus>
              <q-list dense>
                <q-item dense @mousedown.prevent clickable v-for="ex in extensions" :key="ex.name" @click="apply(ex)"
                  :active="ex.active(ex)" active-class="text-active-toggle">
                  <q-item-section side>
                    <q-icon :name="ex.icon" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ ex.label }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>
      </q-editor>
    </div>
    <div class="row items-center q-col-gutter-xs">
      <div v-for="a in attach" :key="a.name" class="col-4 col-md-2">
        <q-chip class="full-width" removable clickable icon="image" :label="a.name" @click="insertImage(a.__img.src)"
          @remove="remove(a)" />
      </div>
    </div>
    <q-btn v-if="attach.length > 0" no-caps unelevated dense rounded color="grey-10" @click="clear" label="Clear All" />
    <div class="q-my-xl"></div>
  </form>
</template>

<style>
.q-editor__toolbar-group .text-active-toggle,
.q-item.text-active-toggle {
  background-color: rgba(0, 0, 0, .1) !important;
}

.body--dark .q-editor__toolbar-group .text-active-toggle,
.body--dark .q-item.text-active-toggle {
  background-color: rgba(255, 255, 255, .2) !important;
}

.q-item.text-active-toggle {
  color: inherit !important;
}
</style>
<style scoped>
.editor:deep(img) {
  max-width: 100%;
}

.editor:deep(.q-btn-dropdown--simple *+.q-btn-dropdown__arrow) {
  margin-left: 0 !important;
}

.editor:deep(.q-btn--dense .on-left) {
  margin-right: 0 !important;
}

.editor:deep(.q-editor__toolbar) {
  align-items: center;
}

@media (max-width: 350px) {
  .editor:deep(.q-editor__toolbar) {
    align-items: start;
  }
}

.editor:deep(.q-editor__toolbar .q-btn) {
  margin: 1px !important;
}

.editor:deep(.q-editor__toolbar) {
  user-select: none;
}

.editor:deep(pre[data-language]) {
  font-family: Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace;
  font-size: 14px;
  border-radius: 8px;
  background-color: #202030;
  padding: 1em 1.6em;
  color: lightgrey;
  transition: background-color .2s ease;
  position: relative;
}

.editor:deep(pre[data-language]::before) {
  content: attr(data-language);
  position: absolute;
  z-index: 2;
  color: rgba(255, 255, 255, .3);
  top: 4px;
  right: 10px;
  font-weight: 700;
}

.body--dark .editor:deep(pre[data-language]) {
  background-color: #000000;
}

@media (max-width: 480px) {
  .editor:deep(pre[data-language]) {
    border-radius: 0 !important;
  }

  .editor:deep(pre[data-language]::before) {
    top: 1px;
    right: 5px;
    font-size: 11px;
  }
}

.editor:deep(blockquote) {
  box-shadow: inset 4px 0 0 0 rgba(100, 150, 200, 1);
  padding: 1rem 1rem 1rem 2em;
  margin: 2rem 0;
  background-color: rgba(0, 0, 0, .03);
  border-radius: 0 4px 4px 0;
}

.body--dark .editor:deep(blockquote) {
  background-color: rgba(255, 255, 255, .03);
}

.editor:deep(em) {
  font-style: normal !important;
  display: inline-block;
  margin: 0 .2rem;
  padding: 0 .2rem;
  background-color: rgba(0, 0, 0, .1);
  border-radius: 4px;
}

.body--dark .editor:deep(em) {
  background-color: rgba(255, 255, 255, .2);
}

.editor:deep(.q-editor__toolbar .text-active-toggle),
.q-item.text-active-toggle {
  background-color: rgba(0, 0, 0, .1) !important;
}

.body--dark .editor:deep(.q-editor__toolbar .text-active-toggle),
.body--dark .q-item.text-active-toggle {
  background-color: rgba(255, 255, 255, .2) !important;
}
</style>