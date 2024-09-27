import { UserProvider } from "../contexts/UserContext"
import Routes from "../routes/Routes"


function App() {
  return (
    <UserProvider>
      <Routes />
    </UserProvider>
  )
}

export default App