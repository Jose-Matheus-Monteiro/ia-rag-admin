import { useState } from 'react'
import { Button, Card, Form, Input, message } from 'antd'
import { api, setToken } from '../api/client'

interface Props {
  onLogin: () => void
}

export default function Login({ onLogin }: Props) {
  const [loading, setLoading] = useState(false)

  async function onFinish(values: { username: string; password: string }) {
    setLoading(true)
    try {
      const data = await api.login(values.username, values.password)
      setToken(data.access_token)
      onLogin()
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card title="IA RAG Admin" style={{ width: 360 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Usuário" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Senha" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
