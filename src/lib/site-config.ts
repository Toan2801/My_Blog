import type { MenuItem, LogoConfig } from '@/lib/types';


export const getMenuItems = (): MenuItem[] => [
  {
    href: '/',
    label: 'Trang chủ',
    icon: 'HomeIcon'
  },
];
export const getLogoConfig = (): LogoConfig => ({
  subDomain: [
    {
      text: 'kinh',
      isHiddenOnCollapse: false
    },
    {
      text: 'thu',
      isHiddenOnCollapse: true
    }
  ],

  domain: [
    {
      text: 'dai',
      isHiddenOnCollapse: true
    },
    {
      text: 'dien',
      isHiddenOnCollapse: false
    }
  ]
});

