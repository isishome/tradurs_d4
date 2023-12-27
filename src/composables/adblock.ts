import { Notify, QNotifyAction } from 'quasar'
import { i18n } from 'src/boot/i18n'

const prod: boolean = import.meta.env.PROD

export function useAdBlock() {
  const check = ({ actions }: { actions?: Array<QNotifyAction> }) => {
    if (prod && !process.env.SERVER) {
      fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js').then(() => { }).catch(() => {
        if (Math.random() > .8)
          Notify.create({
            progress: true,
            icon: 'img:/images/icons/warning.svg',
            classes: 'no-invert',
            color: 'warning',
            textColor: 'dark',
            multiLine: true,
            message: i18n.global.t('adblock.title'),
            caption: i18n.global.t('adblock.contents'),
            actions
          })
      })
    }
  }

  return { check }
}