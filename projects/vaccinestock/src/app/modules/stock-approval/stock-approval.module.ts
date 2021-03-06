import { NgModule } from '@angular/core';
import { OutApprovalComponent } from './components/out-approval/out-approval.component';
import { OutConfirmComponent } from './components/out-confirm/out-confirm.component';
import { InConfirmComponent } from './components/in-confirm/in-confirm.component';
import { OrderChangeComponent } from './components/order-change/order-change.component';
import { OutReceiptComponent } from './components/out-receipt/out-receipt.component';
import { StockApprovalComponent } from './stock-approval.component';
import { UeaModule } from '../../@uea/uea.module';
import { StockApprovalRoutingModule } from './stock-approval.routing.module';
import {StockSharedModule} from '../stock-shared/stock-shared.module';
import {VacOrderDetailComponent} from './components/order-detail/vac-order-detail-approval/vac-order-detail.component';
import {OutConfirmOrderDetailComponent} from './components/order-detail/out-confirm-order-detail/out-confirm-order-detail.component';
import {InConfirmOrderDetailComponent} from './components/order-detail/in-confirm-order-detail/in-confirm-order-detail.component';
import {OrderChangeOrderDetailComponent} from './components/order-detail/order-change-order-detail/order-change-order-detail.component';
import {OutReceiptOrderDetailComponent} from './components/order-detail/out-receipt-order-detail/out-receipt-order-detail.component';

const COMPONENTS = [
  OutApprovalComponent,
  OutConfirmComponent,
  InConfirmComponent,
  OrderChangeComponent,
  OutReceiptComponent,
  StockApprovalComponent,
  VacOrderDetailComponent,
  OutConfirmOrderDetailComponent,
  InConfirmOrderDetailComponent,
  OrderChangeOrderDetailComponent,
];

@NgModule({
  declarations: [...COMPONENTS, OutReceiptOrderDetailComponent],
  imports: [
    UeaModule,
    StockApprovalRoutingModule,
    StockSharedModule
  ]
})
export class StockApprovalModule { }
