import { Routes } from '@angular/router';
import { DefaultComponent } from './layout/default/default.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { ChatbotComponent } from './pages/chatbot/chatbot.component';
import { authGuard, canActive } from './core/guard/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: DefaultComponent,
        children: [
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            },
            {
                path: 'login',
                canActivate: [authGuard],
                component: LoginComponent
            },
            {
                path: 'home',
                canActivate: [canActive],
                component: HomeComponent
            },
            {
                path: 'chatbot',
                canActivate: [canActive],
                component: ChatbotComponent
            }
        ]
    },
];
