// import { showErrorToast, showSuccessToast } from "./toast";
import { backend_url } from "../constants";
import Cookies from "js-cookie";
import axios from "axios";

export const getUser = async () => {
    try {
        const token = Cookies.get("token")

        if (!token) {
            return false
        }

        const response = await axios.get(`${backend_url}/${userType}/analysis`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        console.log(response)
        if (response.data.user_id) {
            // showSuccessToast(`Hello ${result?.data?.user?.username} `)
            return response.data
        } else {
            // showErrorToast(result.message)
            console.log("err ")
            return null
        }

    } catch (error) {
        console.error('Auth check failed', error);
        return false;
    }
};