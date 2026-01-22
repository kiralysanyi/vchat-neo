import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Index from './pages/Index'
import TestProduce from './pages/TestProduce'
import TestConsume from './pages/TestConsume'
import Join from './pages/Join'
import MeetRoot from './pages/MeetRoot'
import MeetingClient from './pages/MeetingClient'

const router = createBrowserRouter([
  {
    index: true,
    path: "/",
    element: <Index />
  },
  {
    path: "/test/produce",
    element: <TestProduce />
  },
  {
    path: "/test/consume",
    element: <TestConsume />
  },
  {
    path: "/meeting",
    element: <MeetRoot />,
    children: [
      {
        path: "/meeting/join/:id",
        element: <Join />
      },
      {
        path: "/meeting/:id",
        element: <MeetingClient />
      }
    ]
  }

])

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
