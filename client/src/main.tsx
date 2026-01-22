import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Index from './pages/Index'
import TestProduce from './pages/TestProduce'
import TestConsume from './pages/TestConsume'
import Join from './pages/Join'

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
    path: "/join/:id",
    element: <Join />
  }
])

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
