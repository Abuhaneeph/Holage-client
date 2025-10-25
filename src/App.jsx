import { AppProvider } from "./context/AppContext"
import { ToastProvider } from "./context/ToastContext"
import Router from "./Router"

const App = () => {
  return (
    <ToastProvider>
      <AppProvider>
        <div className="font-sans antialiased">
          <Router />
        </div>
      </AppProvider>
    </ToastProvider>
  )
}

export default App
