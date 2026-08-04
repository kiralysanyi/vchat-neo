import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router'
import Index from './pages/Index'
import Join from './pages/Join'
import MeetRoot from './pages/MeetRoot'
import MeetingClient from './pages/MeetingClient'
import getAuthConfig from './utils/getAuthConfig'
import { AuthProvider, type AuthProviderProps } from 'react-oidc-context'
import AuthWrapper from './wrappers/AuthWrapper'
import Callback from './pages/Callback'
import { WebStorageStateStore } from 'oidc-client-ts'
import ManagementPage from './pages/Management'

const routes: RouteObject[] = [
  {
    index: true,
    path: "/",
    element: <Index />
  },
  {
    path: "/manage",
    element: <ManagementPage />
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

]


getAuthConfig().then((config) => {
  if (config == null) {
    sessionStorage.removeItem("authconfig")
    // auth disabled
    const router = createBrowserRouter(routes)

    createRoot(document.getElementById('root')!).render(
      <>
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet"></link>
        <RouterProvider router={router} />
      </>
    )
  } else {
    sessionStorage.setItem("authconfig", JSON.stringify(config));

    // auth enabled
    (window as any).authenabled = true;
    const oidcConfig: AuthProviderProps = {
      authority: config.zitadel_domain,
      client_id: config.zitadel_client_id,
      redirect_uri: `${location.origin}/callback`,
      scope: "openid profile email offline_access urn:zitadel:iam:org:projects:roles",
      automaticSilentRenew: true,
      userStore: new WebStorageStateStore({ store: window.localStorage }),
    }

    console.log("App configured with auth enabled!")
    routes.push({
      path: "/callback",
      element: <Callback />
    })
    const router = createBrowserRouter(routes)


    createRoot(document.getElementById('root')!).render(
      <AuthProvider {...oidcConfig}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet"></link>
        <AuthWrapper>
          <RouterProvider router={router} />
        </AuthWrapper>
      </AuthProvider>
    )
  }
})
