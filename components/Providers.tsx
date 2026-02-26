'use client'

import { XProvider } from '@ant-design/x'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ConfigProvider locale={zhCN}>
      <XProvider>
        {children}
      </XProvider>
    </ConfigProvider>
  )
}
