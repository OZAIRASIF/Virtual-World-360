// src/RouteComponent.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import TourEditor from "../pages/TourEditor";
import Tours from "../pages/Tours";


const RouteComponent = () => {
    return (
        <Router>
            <Routes>

                <Route path="/" element={< Dashboard />} />
                <Route path="/editor" element={< Tours />} />
                <Route path="/editor/:id" element={<TourEditor />} />


                {/* <Route path="/*" element={<NotFound />} />

                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                    <Route path="/student/*" element={<StudentRoutes />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                    <Route path="/teacher/*" element={<TeacherRoutes />} />
                </Route> */}
            </Routes>
        </Router>
    );
}

export default RouteComponent;
