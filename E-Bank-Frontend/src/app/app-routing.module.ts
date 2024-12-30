import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {CustomersComponent} from './customers/customers.component';
import {AccountsComponent} from './accounts/accounts.component';
import {AppComponent} from './app.component';
import {NewCustomerComponent} from './new-customer/new-customer.component';

const routes: Routes = [
  { path: '', redirectTo: 'customers', pathMatch: 'full' }, // Default route
  {path : "customers" , component : CustomersComponent},
  {path : "accounts" , component : AccountsComponent},
  {path : "new-customer",component : NewCustomerComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }