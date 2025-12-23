<script setup lang="ts">
  import IconDart from '~icons/logos/dart'
  import IconDjango from '~icons/logos/django-icon'
  import IconDocker from '~icons/logos/docker'
  import IconExpress from '~icons/logos/express'
  import IconFigma from '~icons/logos/figma'
  import IconGit from '~icons/logos/git'
  import IconGithub from '~icons/logos/github-icon'
  import IconHtml5 from '~icons/logos/html-5'
  import IconJavascript from '~icons/logos/javascript'
  import IconNginx from '~icons/logos/nginx'
  import IconNodejs from '~icons/logos/nodejs-icon'
  import IconPhp from '~icons/logos/php'
  import IconPostgresql from '~icons/logos/postgresql'
  import IconPrisma from '~icons/logos/prisma'
  import IconRabbitmq from '~icons/logos/rabbitmq-icon'
  import IconReact from '~icons/logos/react'
  import IconRedis from '~icons/logos/redis'
  import IconTypescript from '~icons/logos/typescript-icon'
  import IconVue from '~icons/logos/vue'
  import IconVuetify from '~icons/logos/vuetifyjs'
  import InteractiveIconCloud from '@/components/ui/InteractiveIconCloud.vue'

  const icons = [
    IconTypescript,
    IconJavascript,
    IconDart,
    IconReact,
    IconHtml5,
    IconNodejs,
    IconExpress,
    IconPrisma,
    IconPostgresql,
    IconNginx,
    IconDocker,
    IconGit,
    IconGithub,
    IconFigma,
    IconVuetify,
    IconVue,
    IconDjango,
    IconPhp,
    IconRabbitmq,
    IconRedis,
  ]
</script>

<template>
  <InteractiveIconCloud :icons="icons" />
</template>
