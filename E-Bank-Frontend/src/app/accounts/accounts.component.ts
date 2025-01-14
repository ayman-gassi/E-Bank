import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {AccountsService} from "../services/accounts.service";
import {BehaviorSubject, catchError, Observable, throwError, EMPTY} from "rxjs";
import {AccountDetails} from "../model/account.model";
import { ActivatedRoute } from '@angular/router';
import {AuthService} from "../services/auth.service";

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  styleUrls: ['./accounts.component.css']
})
export class AccountsComponent implements OnInit {
  accountFormGroup! : FormGroup;
  currentPage: number = 0;
  pageSize: number = 100;
  operationFromGroup! : FormGroup;
  errorMessage! :string ;
  isInitialState: boolean = true;
  isLoading: boolean = false;
  searchTerm: string = '';
  selectedFilter: string = 'all';
  private accountDetailsSubject = new BehaviorSubject<AccountDetails | null>(null);
  accountDetails$ = this.accountDetailsSubject.asObservable();
  accountId: string = '';
  notification: { type: 'success' | 'error', message: string } | null = null;
  showDeleteModal: boolean = false;
  selectedOperation: any = null;

  constructor(private fb : FormBuilder, private accountService : AccountsService, private route: ActivatedRoute, public authService: AuthService) { }

  ngOnInit(): void {
    this.accountFormGroup = this.fb.group({
      accountId : this.fb.control(null)
    });
    this.operationFromGroup = this.fb.group({
      operationType : this.fb.control(null),
      amount : this.fb.control(null),
      description : this.fb.control(null)
    });

    // Handle query params for direct account loading
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.accountFormGroup.patchValue({ accountId: params['id'] });
        this.handleSearchAccount();
      }
    });
  }

  private loadAccountData(page: number = 0) {
    if (!this.accountId) return;

    this.isLoading = true;
    this.accountService.getAccount(this.accountId, page, this.pageSize)
      .subscribe({
        next: (data) => {
          this.accountDetailsSubject.next(data);
          this.isInitialState = false;
          this.currentPage = page;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message;
          this.isInitialState = false;
          this.isLoading = false;
        }
      });
  }

  handleSearchAccount() {
    this.accountId = this.accountFormGroup.value.accountId;
    window.scrollTo(0, 0);
    this.loadAccountData();
  }

  gotoPage(page: number) {
    this.loadAccountData(page);
  }

  private scrollToTransactions() {
    setTimeout(() => {
      const element = document.getElementById('transactionsTable');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  handleAccountOperation() {
    const accountId : string = this.accountFormGroup.value.accountId;
    const operationType = this.operationFromGroup.value.operationType;
    const amount = this.operationFromGroup.value.amount;
    const description = this.operationFromGroup.value.description;

    if (!operationType || !amount) {
      this.showNotification('error', 'Please fill in all required fields');
      return;
    }

    if(operationType === 'DEBIT') {
      this.accountService.debit(accountId, amount, description).subscribe({
        next : (data)=>{
          this.loadAccountData();
          this.operationFromGroup.reset();
          this.operationFromGroup.patchValue({ operationType: null });
          this.showNotification('success', 'Debit operation completed successfully');
          this.scrollToTransactions();
        },
        error : err => {
          this.showNotification('error', err.error.message);
        }
      });
    } else if(operationType === 'CREDIT') {
      this.accountService.credit(accountId, amount, description).subscribe({
        next : (data)=>{
          this.loadAccountData();
          this.operationFromGroup.reset();
          this.operationFromGroup.patchValue({ operationType: null });
          this.showNotification('success', 'Credit operation completed successfully');
          this.scrollToTransactions();
        },
        error : err => {
          this.showNotification('error', err.error.message);
        }
      });
    }
  }

  showNotification(type: 'success' | 'error', message: string) {
    this.notification = { type, message };
    setTimeout(() => this.clearNotification(), 5000);
  }

  clearNotification() {
    this.notification = null;
  }

  resetSearch() {
    this.accountFormGroup.reset();
    this.operationFromGroup.reset();
    this.accountDetailsSubject.next(null);
    this.errorMessage = '';
    this.isInitialState = true;
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here if you want
      console.log('Copied to clipboard');
    });
  }

  filterOperations(filter: string) {
    this.selectedFilter = filter;
    // The actual filtering will be done in the template using a pipe
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedFilter = 'all';
  }

  get filteredOperations() {
    if (!this.accountDetailsSubject.value?.accountOperationDTOS) return [];

    let operations = [...this.accountDetailsSubject.value.accountOperationDTOS];

    // Apply search filter first
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      operations = operations.filter(op =>
        op.description?.toLowerCase().includes(term) ||
        op.type?.toLowerCase().includes(term) ||
        op.id?.toString().includes(term) ||
        op.amount?.toString().includes(term)
      );
    }

    // Sort all operations by ID in descending order (most recent first)
    operations.sort((a, b) => b.id - a.id);

    // Apply type filter if not "all" or "recent"
    if (this.selectedFilter !== 'all' && this.selectedFilter !== 'recent') {
      operations = operations.filter(op =>
        op.type?.toLowerCase() === this.selectedFilter
      );
    }

    return operations;
  }

  selectOperationType(type: string) {
    this.operationFromGroup.patchValue({ operationType: type });
  }

}
