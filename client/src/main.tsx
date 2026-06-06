import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Index from './pages/Index'
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
    path: "/meeting",
    element: <MeetRoot />,
    children: [
      {
        path: "/meeting/join/:id",
        element: <Join />
      },
      {
        path: "/meeting/client/:id",
        element: <MeetingClient />
      }
    ]
  }

])

createRoot(document.getElementById('root')!).render(
  <>
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet"></link>
    <RouterProvider router={router} />
  </>
)
