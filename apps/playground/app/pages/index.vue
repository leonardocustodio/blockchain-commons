<script setup lang="ts">
import { ref, shallowRef, computed, watch } from 'vue'
import { decodeCbor, hexToBytes, hexOpt, diagnosticOpt, type Cbor } from '@blockchain-commons/dcbor'
import { UR, decodeBytewords, BytewordsStyle } from '@blockchain-commons/uniform-resources'

useHead({
  title: 'CBOR Diagnostic Tool - Blockchain Commons',
  meta: [{ name: 'description', content: 'Parse and visualize CBOR data with annotated hex and diagnostic notation' }],
})

// Input format options
type InputFormat = 'auto' | 'ur' | 'bytewords' | 'hex'

const inputFormatOptions = [
  { label: 'Auto-detect format', value: 'auto', icon: 'i-heroicons-sparkles' },
  { label: 'Single UR', value: 'ur', icon: 'i-heroicons-qr-code' },
  { label: 'Bytewords', value: 'bytewords', icon: 'i-heroicons-language' },
  { label: 'Hex (dCBOR)', value: 'hex', icon: 'i-heroicons-code-bracket' },
]

// State
const inputFormat = ref<InputFormat>('auto')
const hexInput = ref('a2626964187b646e616d65684a6f686e20446f65')
const error = ref<string | null>(null)
const parsedCbor = shallowRef<Cbor | null>(null)
const annotatedHex = ref<string>('')
const diagnosticNotation = ref<string>('')

// Output view toggle
type OutputView = 'hex' | 'diagnostic'
const outputView = ref<OutputView>('hex')

// Detect input format automatically
function detectFormat(input: string): InputFormat {
  const trimmed = input.trim().toLowerCase()

  // Check for UR format
  if (trimmed.startsWith('ur:')) {
    return 'ur'
  }

  // Check for hex (only hex characters)
  const cleanHex = input.replace(/\s/g, '')
  if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
    return 'hex'
  }

  // Check for bytewords (only lowercase letters, spaces, and hyphens)
  if (/^[a-z\s-]+$/i.test(trimmed)) {
    return 'bytewords'
  }

  return 'hex' // Default to hex
}

// Parse input based on format
function parseInput(input: string, format: InputFormat): Uint8Array {
  const effectiveFormat = format === 'auto' ? detectFormat(input) : format

  switch (effectiveFormat) {
    case 'ur': {
      if (!input.toLowerCase().startsWith('ur:')) {
        throw new Error('UR string must start with "ur:"')
      }
      const ur = UR.fromURString(input)
      return ur.cbor().toData()
    }

    case 'bytewords': {
      // Try different bytewords styles
      const trimmed = input.trim()

      // Detect style based on input format
      if (trimmed.includes(' ')) {
        // Standard style: words separated by spaces
        return decodeBytewords(trimmed, BytewordsStyle.Standard)
      } else if (trimmed.includes('-')) {
        // URI style: words separated by hyphens
        return decodeBytewords(trimmed, BytewordsStyle.Uri)
      } else {
        // Minimal style: 2-letter abbreviations
        return decodeBytewords(trimmed, BytewordsStyle.Minimal)
      }
    }

    case 'hex':
    default: {
      const cleanHex = input.replace(/\s/g, '')
      if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
        throw new Error('Invalid hex characters')
      }
      if (cleanHex.length % 2 !== 0) {
        throw new Error('Hex string must have even length')
      }
      return hexToBytes(cleanHex)
    }
  }
}

// Parse CBOR from input
function parseCbor() {
  error.value = null
  parsedCbor.value = null
  annotatedHex.value = ''
  diagnosticNotation.value = ''

  const input = hexInput.value.trim()
  if (!input) {
    error.value = 'Please enter data to parse'
    return
  }

  try {
    const cborBytes = parseInput(input, inputFormat.value)

    // Parse CBOR
    const cbor = decodeCbor(cborBytes)
    parsedCbor.value = cbor

    // Generate annotated hex
    annotatedHex.value = hexOpt(cbor, { annotate: true })

    // Generate diagnostic notation
    diagnosticNotation.value = diagnosticOpt(cbor, { flat: false })
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

// Compute byte count from parsed CBOR
const byteCount = computed(() => {
  if (parsedCbor.value) {
    return parsedCbor.value.toData().length
  }
  return 0
})

// Auto-parse when input or format changes (debounced)
let parseTimeout: ReturnType<typeof setTimeout> | null = null
watch([hexInput, inputFormat], () => {
  if (parseTimeout) clearTimeout(parseTimeout)
  parseTimeout = setTimeout(() => {
    try {
      parseCbor()
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    }
  }, 300)
})

// Handle example selection from sidebar
function handleExampleSelect(example: { format: 'hex' | 'ur', value: string }) {
  inputFormat.value = example.format
  hexInput.value = example.value
}

// Parse on mount
onMounted(() => {
  try {
    parseCbor()
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <AppHeader />

    <!-- Main Content with Sidebar -->
    <div class="flex flex-1 overflow-hidden">
      <ExamplesSidebar @select="handleExampleSelect" />

      <main class="flex-1 flex flex-col lg:flex-row min-h-0">
        <!-- Error Display (Top Bar) -->
        <div v-if="error" class="p-4 lg:hidden">
          <UAlert
            color="red"
            icon="i-heroicons-exclamation-triangle"
            :title="error"
          />
        </div>

        <!-- Left Panel: Input -->
        <div class="w-full lg:w-1/3 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-gray-800 bg-blue-50 dark:bg-blue-950/30">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 class="font-semibold text-sm text-blue-900 dark:text-blue-300">Input</h2>
            </div>
            <span class="text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">{{ byteCount }} bytes</span>
          </div>

          <!-- Error (desktop) -->
          <div v-if="error" class="hidden lg:block p-4">
            <UAlert
              color="red"
              icon="i-heroicons-exclamation-triangle"
              :title="error"
            />
          </div>

          <!-- Input Content -->
          <div class="p-4 flex-shrink-0">
            <USelectMenu
              v-model="inputFormat"
              :items="inputFormatOptions"
              value-key="value"
              :search-input="false"
              :content="{ side: 'bottom', align: 'start', sideOffset: 4 }"
              class="w-full"
            />
          </div>
          <div class="flex-1 px-4 pb-4 min-h-0">
            <textarea
              v-model="hexInput"
              :placeholder="inputFormat === 'ur' ? 'Enter UR string (e.g., ur:link3/...)' :
                            inputFormat === 'bytewords' ? 'Enter bytewords (e.g., able acid also...)' :
                            inputFormat === 'hex' ? 'Enter hex data (e.g., a2626964...)' :
                            'Enter data in any format (hex, UR, or bytewords)'"
              class="w-full h-full resize-none font-mono text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Right Panel: Output -->
        <div class="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
          <div v-if="parsedCbor" class="flex-1 flex flex-col min-h-0">
            <!-- Header with Toggle -->
            <div class="flex items-center justify-between px-4 h-12 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h2 class="font-semibold text-sm text-gray-900 dark:text-gray-100">Output</h2>
              </div>
              <UTabs
                :items="[
                  { label: 'Annotated Hex', value: 'hex' },
                  { label: 'Diagnostic', value: 'diagnostic' }
                ]"
                :model-value="outputView"
                size="xs"
                class="w-auto"
                @update:model-value="outputView = $event as OutputView"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-auto p-4">
              <pre v-if="outputView === 'hex'" class="font-mono text-xs whitespace-pre text-gray-800 dark:text-gray-200">{{ annotatedHex }}</pre>
              <pre v-else class="font-mono text-xs whitespace-pre text-gray-800 dark:text-gray-200">{{ diagnosticNotation }}</pre>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="flex-1 flex items-center justify-center p-8">
            <div class="text-center">
              <div class="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4 inline-block">
                <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">No CBOR data parsed</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400">Enter data in the input panel or select an example from the sidebar</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <AppFooter />
  </div>
</template>
