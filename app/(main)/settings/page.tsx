'use client'

import { Card, Empty } from 'antd'

export default function SettingsPage() {
  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">设置</h1>

        <Card>
          <Empty
            description="设置页面正在开发中"
          />
        </Card>
      </div>
    </div>
  )
}
