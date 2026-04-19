import { useState } from 'react'
import { ConfigProvider, Layout, Button, theme } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import ptBR from 'antd/locale/pt_BR'
import Login from './pages/Login'
import Nodes from './pages/Nodes'
import { clearToken, hasToken } from './api/client'

const { Header } = Layout

export default function App() {
  const [authed, setAuthed] = useState(hasToken)

  function logout() {
    clearToken()
    setAuthed(false)
  }

  if (!authed) return (
    <ConfigProvider locale={ptBR}>
      <Login onLogin={() => setAuthed(true)} />
    </ConfigProvider>
  )

  return (
    <ConfigProvider locale={ptBR} theme={{ algorithm: theme.defaultAlgorithm }}>
      <Layout style={{ height: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>IA RAG Admin</span>
          <Button type="text" icon={<LogoutOutlined />} style={{ color: '#fff' }} onClick={logout}>
            Sair
          </Button>
        </Header>
        <Layout style={{ flex: 1, overflow: 'hidden' }}>
          <Nodes />
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}
