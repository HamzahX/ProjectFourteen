import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import './index.less';
import App from './App/App';

import { QueryParamProvider } from 'use-query-params';

render((
    <BrowserRouter>
        <QueryParamProvider
        >
            <App />
        </QueryParamProvider>
    </BrowserRouter>
), document.getElementById('root'));
