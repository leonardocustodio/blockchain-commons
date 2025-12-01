<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const emit = defineEmits<{
  select: [example: { format: 'hex' | 'ur', value: string }]
}>()

const examples: NavigationMenuItem[] = [
  {
    label: 'Examples',
    type: 'label'
  },
  {
    label: 'Simple Object',
    icon: 'i-heroicons-cube',
    onSelect: () => emit('select', {
      format: 'hex',
      value: 'a2626964187b646e616d65684a6f686e20446f65'
    })
  },
  {
    label: 'Collection',
    icon: 'i-heroicons-rectangle-stack',
    onSelect: () => emit('select', {
      format: 'hex',
      value: 'a2646e616d656d4d7920436f6c6c656374696f6e65757365727382d86fa262696401646e616d6571c4b07266616e2042696c616c6fc49f6c75d86fa262696402646e616d6572506965746572205579747465727370726f74'
    })
  },
  {
    label: 'UR Link',
    icon: 'i-heroicons-link',
    onSelect: () => emit('select', {
      format: 'ur',
      value: 'ur:link3/pdihjzinjtjejklyoeiakpjpjzksdtisjyjyjojkftdldlktktktdmjzinjtjeihieinjtdmiajljndlinjtdljzihjlioiakpjkjyjlieinjldlihjyinjyjzihisgsinjtjeihiegajtihjyisihjnihjeiehsjpjedpiyjljpihjkjyihjyinjyjzihjsfzjzihjljthsjpiejliakpjkjyjlieinjliyhskohsjyhsjpksfeinjoiyjkftdldlidhsiyjeeyidknhsiaihiaidkoimkshsimjpjlideyiojojlecjnjseejojseeidemjsidkojsjyjeiaenjseckkemjnjtjyisktjejpieimhseyisjojpenjsjkimjokpidjziniahejeihkkynimjyinjyjzihheiyjljtjyiofygtcxguhsjtjkimjyinjyjzihhejkinknihihjkjnhsjzjzjejyinjyjzihheiajljzjljpiocnfgfgfgfgfgfgvwylneoe'
    })
  }
]
</script>

<template>
  <aside class="hidden lg:block w-48 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
    <div class="p-4">
      <UNavigationMenu
        :items="examples"
        orientation="vertical"
        color="primary"
        variant="pill"
        class="w-full"
      />
    </div>
  </aside>
</template>
