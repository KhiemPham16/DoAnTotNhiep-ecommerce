import React from 'react';
import { Outlet } from 'react-router-dom';

import Header from '~/components/Header';
import Footer from '~/components/Footer';
import BookAdvisorPopup from '~/components/BookAdvisorPopup/BookAdvisorPopup';

export default function SiteLayout() {
    return (
        <>
            <Header />
            <Outlet />
            <Footer />
            <BookAdvisorPopup />
        </>
    );
}
