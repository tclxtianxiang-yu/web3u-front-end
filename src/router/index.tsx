import { createBrowserRouter } from "react-router";
import Home from "pages/Home";
import Layout from "../components/Layout";

// Course pages
import CourseCatalog from "pages/Courses/Catalog";
import CourseDetail from "pages/Courses/Detail";
import CoursePlayer from "pages/Courses/Player";

// Teacher pages
import TeacherDashboard from "pages/Teacher/Dashboard";
import TeacherCourses from "pages/Teacher/Courses";
import TeacherUpload from "pages/Teacher/Upload";
import TeacherEarnings from "pages/Teacher/Earnings";
import TeacherNFT from "pages/Teacher/NFT";

// Student pages
import StudentDashboard from "pages/Student/Dashboard";
import StudentCourses from "pages/Student/Courses";
import StudentHistory from "pages/Student/History";
import StudentNFT from "pages/Student/NFT";

const router = createBrowserRouter([
	{
		element: <Layout />,
		children: [
			{
				path: "/",
				element: <Home />,
			},
			{
				path: "/courses",
				element: <CourseCatalog />,
			},
			{
				path: "/courses/:id",
				element: <CourseDetail />,
			},
			{
				path: "/courses/:id/watch",
				element: <CoursePlayer />,
			},
			// Teacher routes
			{
				path: "/teacher",
				element: <TeacherDashboard />,
			},
			{
				path: "/teacher/courses",
				element: <TeacherCourses />,
			},
			{
				path: "/teacher/upload",
				element: <TeacherUpload />,
			},
			{
				path: "/teacher/earnings",
				element: <TeacherEarnings />,
			},
			{
				path: "/teacher/nft",
				element: <TeacherNFT />,
			},
			// Student routes
			{
				path: "/student",
				element: <StudentDashboard />,
			},
			{
				path: "/student/courses",
				element: <StudentCourses />,
			},
			{
				path: "/student/history",
				element: <StudentHistory />,
			},
			{
				path: "/student/nft",
				element: <StudentNFT />,
			},
		],
	},
]);

export default router;
