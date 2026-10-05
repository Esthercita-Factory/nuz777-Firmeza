import { Routes } from '@angular/router';
import { HomeComponent } from '../Views/Home/Home.Component';
import { LoginComponent } from '../Views/Auth/Login.Component';
import { RegisterComponent } from '../Views/Auth/Register.Component';
import { ShellComponent } from '../Views/Layout/Shell.Component';
import { DashboardComponent } from '../Views/Dashboard/Dashboard.Component';
import { ProductsComponent } from '../Views/Products/Products.Component';
import { ProductFormComponent } from '../Views/Products/ProductForm.Component';
import { ProductDetailComponent } from '../Views/Products/ProductDetail.Component';
import { CustomersComponent } from '../Views/Customers/Customers.Component';
import { CustomerFormComponent } from '../Views/Customers/CustomerForm.Component';
import { CustomerDetailComponent } from '../Views/Customers/CustomerDetail.Component';
import { CustomerRequestsComponent } from '../Views/Customers/CustomerRequests.Component';
import { SalesComponent } from '../Views/Sales/Sales.Component';
import { SaleFormComponent } from '../Views/Sales/SaleForm.Component';
import { SaleDetailComponent } from '../Views/Sales/SaleDetail.Component';
import { ImportsComponent } from '../Views/Imports/Imports.Component';
import { AccessDeniedComponent } from '../Views/Errors/AccessDenied.Component';
import { adminGuard, authGuard } from '../Guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'sin-acceso', component: AccessDeniedComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
      { path: 'productos', component: ProductsComponent },
      // El orden importa: 'nuevo' debe declararse antes que ':id' para que
      // Angular no interprete /productos/nuevo como un id.
      { path: 'productos/nuevo', component: ProductFormComponent },
      { path: 'productos/:id', component: ProductDetailComponent },
      { path: 'productos/:id/editar', component: ProductFormComponent },
      { path: 'clientes', component: CustomersComponent },
      { path: 'clientes/nuevo', component: CustomerFormComponent },
      { path: 'clientes/:id', component: CustomerDetailComponent },
      { path: 'clientes/:id/editar', component: CustomerFormComponent },
      { path: 'solicitudes', component: CustomerRequestsComponent },
      { path: 'ventas', component: SalesComponent },
      { path: 'ventas/nueva', component: SaleFormComponent },
      { path: 'ventas/:id', component: SaleDetailComponent },
      { path: 'ventas/:id/editar', component: SaleFormComponent },
      { path: 'carga-masiva', component: ImportsComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
