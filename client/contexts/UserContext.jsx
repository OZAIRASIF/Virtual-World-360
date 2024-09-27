import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser } from '../helpers/getUser';
import Cookies from 'js-cookie'


export const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchUser = async () => {
        setLoading(true)
        const userData = await getUser();
        if (userData) {
            setUser(userData);
            console.log(userData)
        }
        setLoading(false);
    };
    useEffect(() => {
        fetchUser();
    }, []);

    const loginUser = async () => {
        await fetchUser();
    };

    const getHeaders = () => {
        const token = Cookies.get('token')
        const headers = {
            Authorization: `Bearer ${token}`
        }
        return { headers: headers }
    }


    return (
        <UserContext.Provider value={{ user, setUser, loading, setLoading, loginUser, getHeaders }}>
            {children}
        </UserContext.Provider>
    );
};
