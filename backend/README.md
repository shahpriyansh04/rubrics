this is the mock react code to hit the endpoints

app.jsx
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/student-dashboard"
        element={<ProtectedRoutes component={SD} />}
      />
      <Route
        path="/teacher-dashboard"
        element={<ProtectedRoutes component={TD} />}
      />
    </Routes>
  );
}

export default App;




login.jsx
import axios from "axios";
import Cookies from "universal-cookie";
const cookies = new Cookies();





 function Login() {
    const [email, setEmail]=useState("");
    const[password, setPassword]= useState("");
    const [login,setLogin]=useState(false);
    const [role, setRole] = useState("student"); 


    const handleSubmit=(e)=>{
      const configuration = {
        method: "post",
        url: "http://localhost:5000/login",
        data: {
          email,
          password,
          role
        },
      };
      e.preventDefault();
      axios(configuration)
      .then((result) => {
        // set the cookie
        cookies.set("TOKEN", result.data.token, {
          path: "/",// "path :"/" means that cookie will be available to all routes."
        });
        window.location.href = `/${role}-dashboard`; // this takes us to the href after successful login
        setLogin(true);
        console.log(result);
      })
      .catch((error) => {setLogin(false);console.log(error);})

    }

    ...rest of the code








protectedRoutes.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "universal-cookie";

const cookies = new Cookies();

export default function ProtectedRoutes({ component: Component, ...rest }) {
  // Get token from cookies
  const token = cookies.get("TOKEN");

  // If token exists, render the component; otherwise, redirect to landing page
  return token ? (
    <Component {...rest} />
  ) : (
    <Navigate to="/" replace state={{ from: rest.location }} />
  );
}



